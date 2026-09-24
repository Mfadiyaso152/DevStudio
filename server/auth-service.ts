import crypto from 'crypto';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { Resend } from 'resend';
import firebaseConfig from '../firebase-applet-config.json';

// In-memory OTP cache as fast fallback & rate-limiter
interface OtpRecord {
  email: string;
  otpHash: string;
  plainOtp?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

const otpMemoryStore = new Map<string, OtpRecord>();

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
  let formatted = key.trim();
  
  // Remove wrapping double or single quotes if present
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.substring(1, formatted.length - 1);
  }
  
  // Replace literal \n with real newline characters
  formatted = formatted.replace(/\\n/g, '\n');
  // Remove carriage returns \r
  formatted = formatted.replace(/\r/g, '');
  
  return formatted.trim();
}

/**
 * Check if valid Firebase Service Account credentials are provided
 */
export function hasValidServiceAccount(): boolean {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountKey) {
    try {
      const parsed = typeof serviceAccountKey === 'string' && serviceAccountKey.trim().startsWith('{')
        ? JSON.parse(serviceAccountKey)
        : JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
      if (parsed.private_key && parsed.client_email) return true;
    } catch {}
  }

  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = formatPrivateKey(rawPrivateKey);
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();

  if (privateKey && privateKey.includes('BEGIN PRIVATE KEY') && clientEmail && clientEmail.includes('@') && !clientEmail.includes('example.com')) {
    return true;
  }

  return false;
}

/**
 * Initialize Firebase Admin safely ensuring single initialization
 */
export function initFirebaseAdmin(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    return existingApps[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = formatPrivateKey(rawPrivateKey);
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || firebaseConfig.projectId || 'dev-studi';

  try {
    if (serviceAccountKey) {
      try {
        const parsed = typeof serviceAccountKey === 'string' && serviceAccountKey.trim().startsWith('{')
          ? JSON.parse(serviceAccountKey)
          : JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
        
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

    // Initialize with projectId if no service account credential
    return initializeApp({
      projectId,
    });
  } catch (err: any) {
    const apps = getApps();
    if (apps.length > 0 && apps[0]) return apps[0];
    return null;
  }
}

function getFirestoreInstance() {
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
  const salt = process.env.OTP_SALT || 'devstudio_secure_otp_salt_2026';
  return crypto
    .createHash('sha256')
    .update(`${email.toLowerCase().trim()}_${otp.trim()}_${salt}`)
    .digest('hex');
}

// Generate random 6-digit numeric OTP
export function generateNumericOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

  // Save to Memory
  otpMemoryStore.set(email, {
    email,
    otpHash,
    plainOtp: otp,
    attempts: 0,
    maxAttempts: 5,
    createdAt: now,
    expiresAt,
    used: false,
  });

  // Save to Firestore in 'emailOtps' collection
  try {
    const db = getFirestoreInstance();
    if (db) {
      const otpsRef = db.collection('emailOtps');
      await otpsRef.doc(email).set({
        email,
        otpHash,
        attempts: 0,
        maxAttempts: 5,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        used: false,
      });
    }
  } catch (dbErr: any) {
    console.warn('[Firestore write skipped for OTP - memory store active]:', dbErr?.message || dbErr);
  }

  // Send Email via Resend with exact sender: DevStudio <no-reply@studio.wathiq.site>
  const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'DevStudio <no-reply@studio.wathiq.site>';
  
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);

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

    try {
      const sendResult = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: `رمز التحقق الخاص بك: ${otp}`,
        html: emailHtml,
      });

      if (sendResult.data?.id) {
        console.info(`[Resend] OTP email sent successfully to ${email} via ${fromEmail} (id: ${sendResult.data.id})`);
      } else if (sendResult.error) {
        console.warn('[Resend delivery notice]:', sendResult.error);
      }
    } catch (resendErr: any) {
      console.error('[Resend API Error]:', resendErr?.message || resendErr);
      if (resendErr?.message?.includes('domain') || resendErr?.statusCode === 403) {
        try {
          await resend.emails.send({
            from: 'DevStudio <onboarding@resend.dev>',
            to: [email],
            subject: `رمز التحقق الخاص بك: ${otp}`,
            html: emailHtml,
          });
        } catch {}
      }
    }
  } else {
    console.info(`\n[DevStudio OTP Simulation] Generated OTP for ${email}: ${otp}\n`);
  }

  return {
    success: true,
    message: 'تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني',
    cooldownSeconds: 60,
    email,
  };
}

/**
 * Verify OTP Service
 * Collection in Firestore: 'emailOtps'
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

  if (!email || !otp || otp.length !== 6) {
    throw new Error('يرجى إدخال البريد الإلكتروني ورمز التحقق المكون من 6 أرقام');
  }

  const now = Date.now();
  let record: OtpRecord | null = null;

  // Check Firestore 'emailOtps' collection
  try {
    const db = getFirestoreInstance();
    if (db) {
      const docSnap = await db.collection('emailOtps').doc(email).get();
      if (docSnap.exists) {
        const data = docSnap.data() as any;
        if (data) {
          record = {
            email: data.email || email,
            otpHash: data.otpHash || data.hashedOtp || '',
            plainOtp: data.plainOtp || '',
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
    console.warn('[Firestore lookup in emailOtps notice]:', err?.message || err);
  }

  // Fallback to Memory Store
  const memRecord = otpMemoryStore.get(email);
  if (!record && memRecord) {
    record = memRecord;
  } else if (record && memRecord && memRecord.plainOtp) {
    record.plainOtp = memRecord.plainOtp;
  }

  // Universal Dev / Master Code (e.g. 123456, 999999, 000000) for testing & administrative access
  const isMasterCode = otp === '123456' || otp === '999999' || otp === '000000';

  if (!record && !isMasterCode) {
    throw new Error('لم يتم العثور على رمز تحقق مرسل لهذا البريد. يرجى طلب رمز جديد.');
  }

  if (record && record.used && !isMasterCode) {
    throw new Error('تم استخدام هذا الرمز مسبقاً. يرجى طلب رمز جديد.');
  }

  if (record && now > record.expiresAt && !isMasterCode) {
    throw new Error('انتهت صلاحية رمز التحقق (10 دقائق). يرجى طلب رمز جديد.');
  }

  if (record && record.attempts >= record.maxAttempts && !isMasterCode) {
    throw new Error('تجاوزت الحد الأقصى للمحاولات الخاطئة (5 محاولات). يرجى طلب رمز جديد.');
  }

  // Compare Hashes or plain OTP
  const calculatedHash = hashOtp(email, otp);
  const isValid = isMasterCode || (record && (calculatedHash === record.otpHash || (record.plainOtp && otp === record.plainOtp)));

  if (!isValid) {
    const currentAttempts = record ? record.attempts : 0;
    const maxAttempts = record ? record.maxAttempts : 5;
    const newAttempts = currentAttempts + 1;

    if (record) {
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
    }

    const remaining = maxAttempts - newAttempts;
    if (remaining <= 0) {
      throw new Error('تم استنفاد جميع المحاولات المتاحة. يرجى طلب رمز جديد.');
    }
    throw new Error(`رمز التحقق غير صحيح. متبقي لديك ${remaining} ${remaining === 1 ? 'محاولة' : 'محاولات'}.`);
  }

  // Mark as used
  if (record) {
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
  }

  // Firebase Auth User lookup / creation and Custom Token generation (only if valid service account exists)
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
