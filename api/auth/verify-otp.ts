import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyOtpService } from '../../server/auth-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Content-Type Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    const { email, otp } = body || {};
    const result = await verifyOtpService(email, otp);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err?.message || 'فشل التحقق من رمز التحقق'
    });
  }
}
