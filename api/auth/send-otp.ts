import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendOtpService } from '../../src/server/auth-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    const result = await sendOtpService(email);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'فشل إرسال رمز التحقق'
    });
  }
}
