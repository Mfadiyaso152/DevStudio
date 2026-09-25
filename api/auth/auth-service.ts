import crypto from 'crypto';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Default Firebase Project configuration fallback
const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'dev-studi',
  authDomain: 'dev-studi.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-b33db464-7b86-419f-9183-4f6efefd96f6'
};

// In-memory OTP cache as fast fallback & rate-limiter
interface OtpRecord {
  email: string;
  otpHash: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

const otpMemoryStore = new Map<string, OtpRecord>();

export function cleanEnv(val?: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned;
}

export function normalizeInputDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[^0-9]/g, '')
    .trim();
}

/**
 * Format private key cleanly handling escaped newlines, wrapping quotes, and carriage returns
 */
function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let formatted = cleanEnv(key);
  
  // Replace literal \n or \\n with real newline characters
  formatted = formatted.replace(/\\n/g, '\n');
  // Remove carriage returns \r
  formatted = formatted.replace(/\r/g, '');
  
  return formatted.trim();
}

function isValidResendApiKey(key?: string): boolean {
  if (!key) return false;
  const k = cleanEnv(key);
  if (!k.startsWith('re_')) return false;
  if (k.includes('xxxx') || k.includes('your_') || k.includes('example') || k.length < 20) return false;
  return true;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function safeCompareHash(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Check if valid Firebase Service Account credentials are provided
 */
export function hasValidServiceAccount(): boolean {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountKey) {
    try {
      const raw = cleanEnv(serviceAccountKey);
      const parsed = raw.startsWith('{')
        ? JSON.parse(raw)
        : JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
      if (parsed.private_key && parsed.client_email) return true;
    } catch {}
  }

  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = formatPrivateKey(rawPrivateKey);
  const clientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL);

  if (privateKey && privateKey.includes('BEGIN PRIVATE KEY') && clientEmail && clientEmail.includes('@') && !clientEmail.includes('example.com')) {
    return true;
  }

  return false;
}

/**
 * Initialize Firebase Admin safely ensuring single initialization
 * CRITICAL for Vercel/Production: NEVER initialize without explicit credentials (no ADC on AWS Lambda)
 */
export function initFirebaseAdmin(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    return existingApps[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = formatPrivateKey(rawPrivateKey);
  const clientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL);
  const projectId = cleanEnv(process.env.FIREBASE_PROJECT_ID) || DEFAULT_FIREBASE_CONFIG.projectId;

  try {
    if (serviceAccountKey) {
      try {
        const raw = cleanEnv(serviceAccountKey);
        const parsed = raw.startsWith('{')
          ? JSON.parse(raw)
          : JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
        
        if (parsed.private_key && parsed.client_email) {
          return initializeApp({
            credential: cert(parsed),
            projectId: parsed.project_id || projectId,
          });
        }
      } catch (parseErr) {
        // Silent fallback
      }
    }

    if (privateKey && privateKey.includes('BEGIN PRIVATE KEY') && clientEmail && clientEmail.includes('@') && !clientEmail.includes('example.com')) {
      try {
        return initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId,
        });
      } catch (certErr) {
        // Silent fallback
      }
    }

    // On Vercel / non-GCP hosting, do not initialize with empty credentials to avoid ADC metadata hangs
    return null;
  } catch (err: any) {
    const apps = getApps();
    if (apps.length > 0 && apps[0]) return apps[0];
    return null;
  }
}

function getFirestoreInstance(): Firestore | null {
  if (!hasValidServiceAccount()) {
    return null;
  }
  try {
    const app = initFirebaseAdmin();
    if (app) {
      return getFirestore(app);
    }
    return null;
  } catch {
    return null;
  }
}

// SHA-256 Hash with salt
export function hashOtp(email: string, otp: string): string {
  const salt = cleanEnv(process.env.OTP_SALT) || 'devstudio_secure_otp_salt_2026';
  return crypto
    .createHash('sha256')
    .update(`${email.toLowerCase().trim()}_${otp.trim()}_${salt}`)
    .digest('hex');
}

// Generate random 6-digit numeric OTP (cryptographically secure)
export function generateNumericOtp(): string {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Send OTP Service
 * Rate limit: 60 seconds
 * Expiration: 10 minutes
 * Max attempts: 5
 * Collection in Firestore: 'emailOtps'
 */
export async function sendOtpService(rawEmail: string): Promise<{
  success: boolean;
  message: string;
  cooldownSeconds: number;
  email: string;
}> {
  const email = (rawEmail || '').trim().toLowerCase();
  console.log(`[STAGE: SEND_OTP_REQUEST_RECEIVED] Email: ${email}`);

  if (!email || !email.includes('@')) {
    throw new Error('البريد الإلكتروني غير صالح');
  }

  const now = Date.now();
  const existing = otpMemoryStore.get(email);

  // Enforce 60s cooldown
  if (existing && now - existing.createdAt < 60 * 1000) {
    const remaining = Math.ceil((60 * 1000 - (now - existing.createdAt)) / 1000);
    throw new Error(`يرجى الانتظار ${remaining} ثانية قبل طلب رمز جديد`);
  }

  const otp = generateNumericOtp();
  const otpHash = hashOtp(email, otp);
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes
  console.log(`[STAGE: OTP_GENERATED] Hash created, expiration set to 10 minutes`);

  // Save to Memory Store (only hash, attempts, expiry, used)
  otpMemoryStore.set(email, {
    email,
    otpHash,
    attempts: 0,
    maxAttempts: 5,
    createdAt: now,
    expiresAt,
    used: false,
  });

  // Save to Firestore in 'emailOtps' collection with timeout (ONLY store hash, never plain OTP)
  try {
    const db = getFirestoreInstance();
    if (db) {
      const otpsRef = db.collection('emailOtps');
      await Promise.race([
        otpsRef.doc(email).set({
          email,
          otpHash,
          attempts: 0,
          maxAttempts: 5,
          createdAt: new Date(now).toISOString(),
          expiresAt: new Date(expiresAt).toISOString(),
          used: false,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 4000))
      ]);
      console.log(`[STAGE: FIRESTORE_WRITE_SUCCESS] Hash saved in emailOtps collection`);
    } else {
      console.log(`[STAGE: FIRESTORE_WRITE_SKIPPED] In-memory security store active`);
    }
  } catch (dbErr: any) {
    console.warn(`[STAGE: FIRESTORE_WRITE_FAILED] ${dbErr?.message || dbErr}`);
  }

  // Resend Configuration & Dispatch
  const rawResendKey = cleanEnv(process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY);
  const isResendConfigured = isValidResendApiKey(rawResendKey);
  
  let rawFrom = cleanEnv(process.env.RESEND_FROM_EMAIL);
  // Auto-migrate old domain dev.wathiq.site to the active production domain studio.wathiq.site
  if (!rawFrom || rawFrom.includes('dev.wathiq.site')) {
    rawFrom = rawFrom 
      ? rawFrom.replace(/dev\.wathiq\.site/g, 'studio.wathiq.site') 
      : 'DevStudio <no-reply@studio.wathiq.site>';
  }
  const fromEmail = rawFrom;
  
  if (isResendConfigured && rawResendKey) {
    console.log(`[STAGE: RESEND_REQUEST_STARTED] Sender: ${fromEmail}, Recipient: ${email}, KeyConfigured: true`);
    
    try {
      const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #030712; color: #f8fafc; margin: 0; padding: 40px 20px; }
            .container { max-width: 500px; margin: 0 auto; background: #0f172a; border-radius: 20px; border: 1px solid #1e293b; padding: 36px 28px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .logo { font-size: 26px; font-weight: 900; color: #6366f1; margin-bottom: 20px; letter-spacing: -0.5px; }
            .badge { display: inline-block; padding: 5px 14px; background: rgba(99, 102, 241, 0.15); color: #818cf8; border-radius: 999px; font-size: 12px; font-weight: 700; margin-bottom: 16px; border: 1px solid rgba(99, 102, 241, 0.3); }
            .title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
            .desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
            .otp-box { background: #030712; border: 2px solid #6366f1; border-radius: 14px; padding: 18px 24px; margin: 24px 0; display: inline-block; }
            .otp-code { font-family: 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; margin: 0; }
            .note { font-size: 13px; color: #cbd5e1; margin-top: 14px; }
            .footer { font-size: 11px; color: #64748b; margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 18px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">DevStudio</div>
            <div class="badge">توثيق الحساب</div>
            <h1 class="title">رمز التحقق الخاص بك</h1>
            <p class="desc">استخدم الرمز التالي لتسجيل الدخول إلى حسابك في DevStudio ومتابعة مشاريعك وعروض الأسعار.</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p class="note">هذا الرمز صالح لمدة <strong>10 دقائق</strong>.</p>
            
            <div class="footer">
              إذا لم تكن قد طلبت هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.<br>
              © ${new Date().getFullYear()} DevStudio. جميع الحقوق محفوظة.
            </div>
          </div>
        </body>
      </html>
      `;

      // Dispatch email via Resend REST API with AbortController timeout
      const dispatchEmail = async (sender: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${rawResendKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'DevStudio/1.0',
            },
            body: JSON.stringify({
              from: sender,
              to: [email],
              subject: `رمز التحقق الخاص بك: ${otp}`,
              html: emailHtml,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          const resData = await response.json().catch(() => ({}));
          return { ok: response.ok, status: response.status, data: resData };
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          return { ok: false, status: 0, data: { message: fetchErr?.message || 'Fetch failed' } };
        }
      };

      const result = await dispatchEmail(fromEmail);
      if (result.ok && result.data?.id) {
        console.log(`[STAGE: RESEND_REQUEST_SUCCESS] Email sent successfully (id: ${result.data.id}, status: ${result.status})`);
      } else {
        const errorName = result.data?.name || 'UnknownError';
        const errorMessage = result.data?.message || JSON.stringify(result.data);
        console.warn(`[STAGE: RESEND_REQUEST_FAILED] Status: ${result.status}, Name: ${errorName}, Message: ${errorMessage}`);

        // If domain is unverified or failed, attempt apex domain fallback
        if (fromEmail.includes('studio.wathiq.site')) {
          try {
            console.log(`[STAGE: RESEND_RETRY_APEX] Attempting sender DevStudio <no-reply@wathiq.site>`);
            const apexResult = await dispatchEmail('DevStudio <no-reply@wathiq.site>');
            if (apexResult.ok && apexResult.data?.id) {
              console.log(`[STAGE: RESEND_REQUEST_SUCCESS] Apex domain email sent successfully (id: ${apexResult.data.id})`);
            } else {
              console.warn(`[STAGE: RESEND_APEX_FAILED] Status: ${apexResult.status}, Message: ${apexResult.data?.message || ''}`);
            }
          } catch (apexErr: any) {
            console.warn(`[STAGE: RESEND_APEX_ERROR] ${apexErr?.message || apexErr}`);
          }
        }

        // Test fallback for Resend sandbox testing
        if (!fromEmail.includes('resend.dev')) {
          try {
            console.log(`[STAGE: RESEND_RETRY_FALLBACK] Attempting fallback sender onboarding@resend.dev`);
            const fallbackResult = await dispatchEmail('DevStudio <onboarding@resend.dev>');
            if (fallbackResult.ok && fallbackResult.data?.id) {
              console.log(`[STAGE: RESEND_REQUEST_SUCCESS] Fallback sent successfully (id: ${fallbackResult.data.id})`);
            } else {
              console.warn(`[STAGE: RESEND_FALLBACK_FAILED] Status: ${fallbackResult.status}, Message: ${fallbackResult.data?.message || ''}`);
            }
          } catch (fbErr: any) {
            console.warn(`[STAGE: RESEND_FALLBACK_ERROR] ${fbErr?.message || fbErr}`);
          }
        }
      }
    } catch (resendErr: any) {
      console.warn(`[STAGE: RESEND_REQUEST_FAILED] Network / Exception: ${resendErr?.message || resendErr}`);
    }
  } else {
    console.log(`[STAGE: RESEND_SKIPPED] RESEND_API_KEY is not set or placeholder.`);
  }

  console.log(`[STAGE: OTP_READY] OTP cycle complete for ${email}`);

  return {
    success: true,
    message: 'تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني',
    cooldownSeconds: 60,
    email,
  };
}

/**
 * Verify OTP Service
 * Strictly validates OTP hash server-side
 */
export async function verifyOtpService(rawEmail: string, rawOtp: string): Promise<{
  success: boolean;
  email: string;
  uid: string;
  role: 'admin' | 'staff' | 'client';
  customToken?: string;
  message: string;
}> {
  const email = (rawEmail || '').trim().toLowerCase();
  const otp = normalizeInputDigits(rawOtp);

  if (!email || !email.includes('@') || !otp || otp.length !== 6) {
    throw new Error('رمز التحقق غير صحيح أو منتهي الصلاحية');
  }

  const now = Date.now();
  let record: OtpRecord | null = null;

  // 1. Fetch OTP record from Firestore 'emailOtps' collection with timeout
  try {
    const db = getFirestoreInstance();
    if (db) {
      const docSnap = await Promise.race([
        db.collection('emailOtps').doc(email).get(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 4000))
      ]);
      if (docSnap && docSnap.exists) {
        const data = docSnap.data() as any;
        if (data && data.otpHash) {
          record = {
            email: data.email || email,
            otpHash: data.otpHash,
            attempts: data.attempts || 0,
            maxAttempts: data.maxAttempts || 5,
            createdAt: data.createdAt ? new Date(data.createdAt).getTime() : now,
            expiresAt: data.expiresAt ? new Date(data.expiresAt).getTime() : now,
            used: !!data.used,
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('[Firestore lookup in emailOtps]:', err?.message || err);
  }

  // Fallback to Memory Store if Firestore record not found
  if (!record) {
    const memRecord = otpMemoryStore.get(email);
    if (memRecord) {
      record = memRecord;
    }
  }

  // If no active OTP record found for this email -> Reject
  if (!record || !record.otpHash) {
    throw new Error('رمز التحقق غير صحيح أو منتهي الصلاحية');
  }

  // Check if already used -> Reject
  if (record.used) {
    throw new Error('تم استخدام هذا الرمز مسبقاً. يرجى طلب رمز جديد.');
  }

  // Check expiration (10 minutes) -> Reject
  if (now > record.expiresAt) {
    throw new Error('انتهت صلاحية رمز التحقق (10 دقائق). يرجى طلب رمز جديد.');
  }

  // Check maximum attempts (5 attempts limit) -> Reject
  if (record.attempts >= record.maxAttempts) {
    throw new Error('تجاوزت الحد الأقصى للمحاولات الخاطئة. تم إبطال الرمز، يرجى طلب رمز جديد.');
  }

  // 2. Cryptographic Hash Comparison (STRICT MATCH ONLY)
  const calculatedHash = hashOtp(email, otp);
  const isValid = safeCompareHash(calculatedHash, record.otpHash);

  if (!isValid) {
    // Increment failed attempts
    const newAttempts = (record.attempts || 0) + 1;
    record.attempts = newAttempts;
    otpMemoryStore.set(email, record);

    try {
      const db = getFirestoreInstance();
      if (db) {
        await db.collection('emailOtps').doc(email).update({
          attempts: newAttempts,
        });
      }
    } catch {}

    const remaining = record.maxAttempts - newAttempts;
    if (remaining <= 0) {
      throw new Error('تجاوزت الحد الأقصى للمحاولات الخاطئة. تم إبطال الرمز، يرجى طلب رمز جديد.');
    }
    throw new Error(`رمز التحقق غير صحيح. متبقي لديك ${remaining} ${remaining === 1 ? 'محاولة' : 'محاولات'}.`);
  }

  // 3. Mark as USED immediately (Cannot be reused)
  record.used = true;
  otpMemoryStore.set(email, record);

  try {
    const db = getFirestoreInstance();
    if (db) {
      await db.collection('emailOtps').doc(email).update({
        used: true,
        verifiedAt: new Date(now).toISOString(),
      });
    }
  } catch {}

  // 4. Generate UID & Firebase Custom Token ONLY after verified OTP
  const isAdminEmail = email === 'mfb.15@icloud.com' || email === 'mfb-15@hotmail.com';
  const role = isAdminEmail ? 'admin' : 'client';
  let uid = `usr_${crypto.createHash('md5').update(email).digest('hex').substring(0, 16)}`;
  let customToken: string | undefined = undefined;

  if (hasValidServiceAccount()) {
    try {
      const app = initFirebaseAdmin();
      if (app) {
        const auth = getAuth(app);
        try {
          const userRecord = await auth.getUserByEmail(email);
          uid = userRecord.uid;
          if (!userRecord.emailVerified) {
            try {
              await auth.updateUser(uid, { emailVerified: true });
            } catch {}
          }
        } catch (notFoundErr: any) {
          if (notFoundErr.code === 'auth/user-not-found') {
            try {
              const userRecord = await auth.createUser({
                email,
                emailVerified: true,
                displayName: email.split('@')[0],
              });
              uid = userRecord.uid;
            } catch {}
          }
        }

        try {
          customToken = await auth.createCustomToken(uid, {
            email,
            role,
            emailVerified: true
          });
        } catch {}
      }
    } catch {}
  }

  return {
    success: true,
    email,
    uid,
    role,
    customToken,
    message: 'تم التحقق من الرمز بنجاح'
  };
}
