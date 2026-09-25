import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyOtpService } from './auth-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    const { email, otp } = body || {};
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'يرجى تزويد البريد الإلكتروني ورمز التحقق في الطلب',
        code: 'MISSING_PARAMETERS'
      });
    }

    // 5. Execute Core Verification
    const result = await verifyOtpService(email, otp);
    return res.status(200).json(result);

  } catch (err: any) {
    console.error('[verify-otp api handler error]:', err);
    const errorCode = err?.code || 'AUTH_OTP_VERIFY_ERROR';
    const errorMessage = err?.message || 'فشل التحقق من رمز التحقق';
    const errorDetails = err?.details || String(err);

    return res.status(400).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: errorDetails
    });
  }
}
