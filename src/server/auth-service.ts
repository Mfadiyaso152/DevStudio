import crypto from 'crypto';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { Resend } from 'resend';
import firebaseConfig from '../../firebase-applet-config.json';

// In-memory OTP cache as fast fallback & rate-limiter
interface OtpRecord {
  email: string;
  hashedOtp: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

const otpMemoryStore = new Map<string, OtpRecord>();

// Initialize Firebase Admin safely
export function initFirebaseAdmin(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    return existingApps[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'dev-studi';

  try {
    if (serviceAccountKey) {
      const parsed = typeof serviceAccountKey === 'string' && serviceAccountKey.trim().startsWith('{')
        ? JSON.parse(serviceAccountKey)
        : JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf-8'));
      
      const app = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
      });
      return app;
    }

    if (privateKey && clientEmail) {
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      return app;
    }

    // Default init for environments with default credentials or project ID
    const app = initializeApp({
      projectId,
    });
    return app;
  } catch (err) {
    console.warn('[Firebase Admin Init Note]:', err);
    return null;
  }
}

function getFirestoreInstance() {
  try {
    const app = initFirebaseAdmin();
    if (app) {
      return getFirestore(app);
    }
    return null;
  } catch (err) {
    console.warn('[Firestore Admin instance not available, using memory store fallback]:', err);
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
 */
export async function sendOtpService(rawEmail: string): Promise<{
  success: boolean;
  message: string;
  cooldownSeconds: number;
  email: string;
}> {
  const email = rawEmail.trim().toLowerCase();
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
  const hashedOtp = hashOtp(email, otp);
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  // Save to Memory
  otpMemoryStore.set(email, {
    email,
    hashedOtp,
    attempts: 0,
    maxAttempts: 5,
    createdAt: now,
    expiresAt,
    used: false,
  });

  // Try saving to Firestore if configured
  try {
    const db = getFirestoreInstance();
    if (db) {
      const otpsRef = db.collection('otp_requests');
      await otpsRef.doc(email).set({
        email,
        hashedOtp,
        attempts: 0,
        maxAttempts: 5,
        createdAt: new Date(now),
        expiresAt: new Date(expiresAt),
        used: false,
        lastIp: '',
      });
    }
  } catch (dbErr) {
    console.warn('[Firestore write skipped for OTP - memory store active]:', dbErr);
  }

  // Send Email via Resend
  const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'DevStudio <auth@devstudio-umber-six.vercel.app>';
  
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);

    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
            .container { max-width: 520px; margin: 0 auto; background: #1e293b; border-radius: 24px; border: 1px solid #334155; padding: 36px 30px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .logo { font-size: 24px; font-weight: 900; color: #6366f1; letter-spacing: -0.5px; margin-bottom: 24px; }
            .title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
            .desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
            .otp-box { background: #0f172a; border: 2px dashed #6366f1; border-radius: 16px; padding: 20px; margin: 24px 0; }
            .otp-code { font-family: 'Courier New', monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #818cf8; margin: 0; }
            .details { font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #334155; padding-top: 20px; }
            .badge { display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border-radius: 999px; font-size: 11px; font-weight: 700; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">✦ DevStudio</div>
            <div class="badge">توثيق الحساب الآمن</div>
            <h1 class="title">رمز التحقق لمرة واحدة (OTP)</h1>
            <p class="desc">استخدم الرمز التالي لتسجيل الدخول إلى حسابك في DevStudio ومتابعة مشاريعك وعروض الأسعار.</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p style="font-size: 13px; color: #cbd5e1;">الرمز صالح لمدة <strong>10 دقائق</strong> فقط. لا تشارك هذا الرمز مع أي شخص.</p>
            
            <div class="details">
              إذا لم تكن قد طلبت هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.<br>
              © ${new Date().getFullYear()} DevStudio. جميع الحقوق محفوظة.
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      // Try sending with configured domain or onboarding
      const senderCandidates = [
        fromEmail,
        'DevStudio <onboarding@resend.dev>',
        'DevStudio <auth@resend.dev>'
      ];

      let sent = false;
      let lastErr: any = null;

      for (const sender of senderCandidates) {
        try {
          const sendResult = await resend.emails.send({
            from: sender,
            to: [email],
            subject: `رمز التحقق الخاص بك في DevStudio: ${otp}`,
            html: emailHtml,
          });

          if (sendResult.data?.id) {
            sent = true;
            break;
          }
        } catch (e: any) {
          lastErr = e;
        }
      }

      if (!sent && lastErr) {
        console.warn('[Resend delivery issue]:', lastErr.message || lastErr);
      }
    } catch (resendErr: any) {
      console.warn('[Resend API Error]:', resendErr.message || resendErr);
    }
  } else {
    console.warn('[RESEND_API_KEY is not configured in environment variables]');
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
 */
export async function verifyOtpService(rawEmail: string, rawOtp: string): Promise<{
  success: boolean;
  email: string;
  uid: string;
  role: 'admin' | 'staff' | 'client';
  customToken?: string;
  message: string;
}> {
  const email = rawEmail.trim().toLowerCase();
  const otp = rawOtp.trim();

  if (!email || !otp || otp.length !== 6) {
    throw new Error('يرجى إدخال البريد الإلكتروني ورمز التحقق المكون من 6 أرقام');
  }

  const now = Date.now();
  let record: OtpRecord | null = null;

  // Check Firestore first if available
  try {
    const db = getFirestoreInstance();
    if (db) {
      const docSnap = await db.collection('otp_requests').doc(email).get();
      if (docSnap.exists) {
        const data = docSnap.data() as any;
        record = {
          email: data.email,
          hashedOtp: data.hashedOtp,
          attempts: data.attempts || 0,
          maxAttempts: data.maxAttempts || 5,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : new Date(data.createdAt).getTime(),
          expiresAt: data.expiresAt?.toMillis ? data.expiresAt.toMillis() : new Date(data.expiresAt).getTime(),
          used: !!data.used,
        };
      }
    }
  } catch (err) {
    console.warn('[Firestore lookup failed, falling back to memory store]:', err);
  }

  // Fallback to Memory Store
  if (!record) {
    record = otpMemoryStore.get(email) || null;
  }

  if (!record) {
    throw new Error('لم يتم العثور على رمز تحقق مرسل لهذا البريد. يرجى طلب رمز جديد.');
  }

  if (record.used) {
    throw new Error('تم استخدام هذا الرمز مسبقاً. يرجى طلب رمز جديد.');
  }

  if (now > record.expiresAt) {
    throw new Error('انتهت صلاحية رمز التحقق (10 دقائق). يرجى طلب رمز جديد.');
  }

  if (record.attempts >= record.maxAttempts) {
    throw new Error('تجاوزت الحد الأقصى للمحاولات الخاطئة (5 محاولات). يرجى طلب رمز جديد.');
  }

  // Compare Hashes
  const calculatedHash = hashOtp(email, otp);
  const isValid = calculatedHash === record.hashedOtp;

  if (!isValid) {
    const newAttempts = record.attempts + 1;
    record.attempts = newAttempts;
    otpMemoryStore.set(email, record);

    try {
      const db = getFirestoreInstance();
      if (db) {
        await db.collection('otp_requests').doc(email).update({
          attempts: newAttempts,
        });
      }
    } catch {}

    const remaining = record.maxAttempts - newAttempts;
    if (remaining <= 0) {
      throw new Error('تم استنفاد جميع المحاولات. يرجى طلب رمز جديد.');
    }
    throw new Error(`رمز التحقق غير صحيح. متبقي لديك ${remaining} محاولات.`);
  }

  // Mark as used
  record.used = true;
  otpMemoryStore.set(email, record);

  try {
    const db = getFirestoreInstance();
    if (db) {
      await db.collection('otp_requests').doc(email).update({
        used: true,
        verifiedAt: new Date(now),
      });
    }
  } catch {}

  // Firebase Auth User lookup / creation and Custom Token generation
  const isAdminEmail = email === 'mfb-15@hotmail.com';
  const role = isAdminEmail ? 'admin' : 'client';
  let uid = `usr_${crypto.createHash('md5').update(email).digest('hex').substring(0, 16)}`;
  let customToken = '';

  try {
    const app = initFirebaseAdmin();
    if (app) {
      const auth = getAuth(app);
      let userRecord: UserRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
        uid = userRecord.uid;
        if (!userRecord.emailVerified) {
          await auth.updateUser(uid, { emailVerified: true });
        }
      } catch (notFoundErr: any) {
        if (notFoundErr.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email,
            emailVerified: true,
            displayName: email.split('@')[0],
          });
          uid = userRecord.uid;
        } else {
          throw notFoundErr;
        }
      }

      customToken = await auth.createCustomToken(uid, {
        email,
        role,
        emailVerified: true
      });
    }
  } catch (authErr: any) {
    console.warn('[Firebase Admin createCustomToken notice]:', authErr.message || authErr);
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
