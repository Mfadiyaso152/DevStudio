import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendOtpService } from './auth-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log the API key status on invocation as requested
  console.log("Resend Key Present:", !!process.env.RESEND_API_KEY);

  // 1. Comprehensive CORS & Security Headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 2. Handle preflight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Verify HTTP Method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Please use POST.',
      code: 'METHOD_NOT_ALLOWED' 
    });
  }

  try {
    // 4. Safe Body Parsing
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseErr: any) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON request body format',
          code: 'INVALID_JSON_BODY',
          details: parseErr?.message || String(parseErr)
        });
      }
    }

    const { email } = body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'البريد الإلكتروني غير صحيح أو مفقود في الطلب',
        code: 'MISSING_OR_INVALID_EMAIL'
      });
    }

    // 5. Execute Core Service
    const result = await sendOtpService(email);
    return res.status(200).json(result);

  } catch (err: any) {
    console.error('[send-otp api handler error]:', typeof err === 'object' ? JSON.stringify(err) : String(err));
    const errorCode = err?.code || 'AUTH_OTP_SEND_ERROR';
    const errorMessage = err?.message || 'فشل إرسال رمز التحقق، يرجى المحاولة مرة أخرى';
    const errorDetails = err?.details || (typeof err === 'object' ? JSON.stringify(err) : String(err));

    return res.status(400).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: errorDetails
    });
  }
}
