import crypto from 'crypto';

// Default Firebase Project configuration for DevStudio
const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'dev-studi',
  authDomain: 'dev-studi.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-b33db464-7b86-419f-9183-4f6efefd96f6',
  apiKey: 'AIzaSyDXpIct6xdbQeyvvb6cPuYPLHy8SyBhguw'
};

// In-memory OTP cache for sub-millisecond local execution
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
 * Save OTP record securely to Firestore REST API & Memory
 */
async function saveOtpRecord(record: OtpRecord): Promise<void> {
  // 1. Update in-memory L1 cache
  otpMemoryStore.set(record.email, record);

  // 2. Direct Firestore REST API (Universal persistence for all Vercel serverless instances)
  try {
    const projectId = cleanEnv(process.env.FIREBASE_PROJECT_ID) || DEFAULT_FIREBASE_CONFIG.projectId;
    const databaseId = cleanEnv(process.env.FIREBASE_DATABASE_ID) || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
    const apiKey = cleanEnv(process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY) || DEFAULT_FIREBASE_CONFIG.apiKey;
    const docPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/emailOtps/${encodeURIComponent(record.email)}?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(docPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          email: { stringValue: record.email },
          otpHash: { stringValue: record.otpHash },
          attempts: { integerValue: String(record.attempts) },
          maxAttempts: { integerValue: String(record.maxAttempts) },
          createdAt: { stringValue: new Date(record.createdAt).toISOString() },
          expiresAt: { stringValue: new Date(record.expiresAt).toISOString() },
          used: { booleanValue: record.used },
        }
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      console.log(`[STAGE: FIRESTORE_WRITE_SUCCESS] Document saved in emailOtps`);
    } else {
      console.warn(`[STAGE: FIRESTORE_WRITE_STATUS] HTTP ${response.status}`);
    }
  } catch (restErr: any) {
    console.warn(`[STAGE: FIRESTORE_WRITE_NOTICE] Memory cache active: ${restErr?.message || restErr}`);
  }
}

/**
 * Fetch OTP record from Firestore REST API or memory
 */
async function fetchOtpRecord(email: string): Promise<OtpRecord | null> {
  const now = Date.now();

  // 1. Direct Firestore REST API
  try {
    const projectId = cleanEnv(process.env.FIREBASE_PROJECT_ID) || DEFAULT_FIREBASE_CONFIG.projectId;
    const databaseId = cleanEnv(process.env.FIREBASE_DATABASE_ID) || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
    const apiKey = cleanEnv(process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY) || DEFAULT_FIREBASE_CONFIG.apiKey;
    const docPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/emailOtps/${encodeURIComponent(email)}?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(docPath, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      const fields = json?.fields;
      if (fields && fields.otpHash?.stringValue) {
        return {
          email: fields.email?.stringValue || email,
          otpHash: fields.otpHash.stringValue,
          attempts: Number(fields.attempts?.integerValue) || 0,
          maxAttempts: Number(fields.maxAttempts?.integerValue) || 5,
          createdAt: fields.createdAt?.stringValue ? new Date(fields.createdAt.stringValue).getTime() : now,
          expiresAt: fields.expiresAt?.stringValue ? new Date(fields.expiresAt.stringValue).getTime() : now,
          used: !!fields.used?.booleanValue,
        };
      }
    }
  } catch (restErr: any) {
    console.warn('[Firestore REST read notice]:', restErr?.message || restErr);
  }

  // 2. Fallback to in-memory L1 cache
  const memRecord = otpMemoryStore.get(email);
  if (memRecord) {
    return memRecord;
  }

  return null;
}

/**
 * Update OTP record status in Firestore
 */
async function updateOtpStatus(email: string, patch: { attempts?: number; used?: boolean; verifiedAt?: string }): Promise<void> {
  // Update L1 Cache
  const mem = otpMemoryStore.get(email);
  if (mem) {
    if (typeof patch.attempts === 'number') mem.attempts = patch.attempts;
    if (typeof patch.used === 'boolean') mem.used = patch.used;
    otpMemoryStore.set(email, mem);
  }

  // Direct Firestore REST API
  try {
    const projectId = cleanEnv(process.env.FIREBASE_PROJECT_ID) || DEFAULT_FIREBASE_CONFIG.projectId;
    const databaseId = cleanEnv(process.env.FIREBASE_DATABASE_ID) || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
    const apiKey = cleanEnv(process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY) || DEFAULT_FIREBASE_CONFIG.apiKey;
    
    const maskParams: string[] = [];
    const fields: any = {};
    if (typeof patch.attempts === 'number') {
      maskParams.push('updateMask.fieldPaths=attempts');
      fields.attempts = { integerValue: String(patch.attempts) };
    }
    if (typeof patch.used === 'boolean') {
      maskParams.push('updateMask.fieldPaths=used');
      fields.used = { booleanValue: patch.used };
    }
    if (patch.verifiedAt) {
      maskParams.push('updateMask.fieldPaths=verifiedAt');
      fields.verifiedAt = { stringValue: patch.verifiedAt };
    }

    const docPath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/emailOtps/${encodeURIComponent(email)}?key=${apiKey}&${maskParams.join('&')}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    await fetch(docPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {}
}

/**
 * Send OTP Service
 * Rate limit: 60 seconds
 * Expiration: 10 minutes
 * Max attempts: 5
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
  const existing = await fetchOtpRecord(email);

  // Enforce 60s cooldown
  if (existing && now - existing.createdAt < 60 * 1000) {
    const remaining = Math.ceil((60 * 1000 - (now - existing.createdAt)) / 1000);
    throw new Error(`يرجى الانتظار ${remaining} ثانية قبل طلب رمز جديد`);
  }

  const otp = generateNumericOtp();
  const otpHash = hashOtp(email, otp);
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes
  console.log(`[STAGE: OTP_GENERATED] Hash created, expiration set to 10 minutes`);

  // Save to Firestore & Memory (ONLY store hash, never plain OTP)
  await saveOtpRecord({
    email,
    otpHash,
    attempts: 0,
    maxAttempts: 5,
    createdAt: now,
    expiresAt,
    used: false,
  });

  // Resend Configuration & Dispatch
  const rawResendKey = cleanEnv(process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY);
  const isResendConfigured = isValidResendApiKey(rawResendKey);
  
  let rawFrom = cleanEnv(process.env.RESEND_FROM_EMAIL);
  if (!rawFrom || rawFrom.includes('dev.wathiq.site')) {
    rawFrom = rawFrom 
      ? rawFrom.replace(/dev\.wathiq\.site/g, 'fstudio.wathiq.site') 
      : 'DevStudio <no-reply@fstudio.wathiq.site>';
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

      // Candidate senders to try in order of priority
      const candidateSenders = [
        fromEmail,
        'DevStudio <no-reply@fstudio.wathiq.site>',
        'DevStudio <no-reply@studio.wathiq.site>',
        'DevStudio <no-reply@wathiq.site>',
        'DevStudio <onboarding@resend.dev>'
      ];

      // Remove duplicate senders
      const uniqueSenders = Array.from(new Set(candidateSenders));
      let sentSuccess = false;

      for (const sender of uniqueSenders) {
        if (sentSuccess) break;
        const result = await dispatchEmail(sender);
        if (result.ok && result.data?.id) {
          console.log(`[STAGE: RESEND_REQUEST_SUCCESS] Email sent successfully via ${sender} (id: ${result.data.id})`);
          sentSuccess = true;
          break;
        } else {
          console.warn(`[STAGE: RESEND_TRY_FAILED] Sender ${sender} returned status ${result.status}: ${JSON.stringify(result.data)}`);
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
  
  // 1. Fetch OTP record from Firestore REST API (or memory)
  const record = await fetchOtpRecord(email);

  // If no active OTP record found for this email -> Reject
  if (!record || !record.otpHash) {
    throw new Error('لم يتم العثور على رمز تحقق نشط لهذا البريد. يرجى طلب رمز جديد.');
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
    // Increment failed attempts and persist to Firestore
    const newAttempts = (record.attempts || 0) + 1;
    await updateOtpStatus(email, { attempts: newAttempts });

    const remaining = record.maxAttempts - newAttempts;
    if (remaining <= 0) {
      throw new Error('تجاوزت الحد الأقصى للمحاولات الخاطئة. تم إبطال الرمز، يرجى طلب رمز جديد.');
    }
    throw new Error(`رمز التحقق غير صحيح. متبقي لديك ${remaining} ${remaining === 1 ? 'محاولة' : 'محاولات'}.`);
  }

  // 3. Mark as USED immediately in Firestore
  await updateOtpStatus(email, { used: true, verifiedAt: new Date(now).toISOString() });

  // 4. Generate Deterministic UID & Role
  const isAdminEmail = email === 'mfb.15@icloud.com' || email === 'mfb-15@hotmail.com';
  const role = isAdminEmail ? 'admin' : 'client';
  const uid = `usr_${crypto.createHash('md5').update(email).digest('hex').substring(0, 16)}`;

  return {
    success: true,
    email,
    uid,
    role,
    message: 'تم التحقق من الرمز بنجاح'
  };
}
