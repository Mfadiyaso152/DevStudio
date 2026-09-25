import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AccountType } from '../types';
import { convertArabicToEnglishDigits } from '../lib/db';

export const AuthPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { 
    user,
    registerUser, 
    loginWithGoogle, 
    sendOtp,
    verifyOtp,
  } = useAuth();

  // Step: 
  // 1 = Enter Email
  // 'otp' = Enter 6-digit Code
  // 2 = Choose Individual / Company
  // 3 = Choose DOB
  // 4 = Complete Full Name & Phone
  const [step, setStep] = useState<number | 'otp'>(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Registration wizard steps
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [companyName, setCompanyName] = useState('');
  const [dob, setDob] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If already authenticated with incomplete survey, automatically open wizard at Step 2
  React.useEffect(() => {
    if (user) {
      const isAdmin = user.role === 'admin' || 
                      user.email.toLowerCase() === 'mfb.15@icloud.com' || 
                      user.email.toLowerCase() === 'mfb-15@hotmail.com';
      if (isAdmin) {
        navigate('/admin');
        return;
      }

      const isComplete = Boolean(
        user.fullName && user.fullName.trim() && 
        user.phone && user.phone.trim() && 
        user.dob && user.dob.trim()
      );

      if (isComplete) {
        navigate('/home');
        return;
      }

      setEmail(user.email || '');
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setDob(user.dob || '');
      setAccountType(user.entityType || 'individual');
      if (user.companyName) setCompanyName(user.companyName);

      setStep(2);
    }
  }, [user, navigate]);

  const formatErrorMessage = (err: any, fallback: string): string => {
    if (!err) return fallback;
    let msg = '';
    if (typeof err === 'string') msg = err;
    else if (typeof err.message === 'string') msg = err.message;
    else if (typeof err.error === 'string') msg = err.error;
    else if (typeof err.error?.message === 'string') msg = err.error.message;
    else if (typeof err.details === 'string') msg = err.details;

    if (!msg || msg === '[object Object]' || msg.includes('<!DOCTYPE') || msg.includes('<html')) {
      return fallback;
    }

    if (msg.includes('A server error has occurred') || msg.includes('Internal Server Error')) {
      return 'تعذر إرسال رمز التحقق بسبب تعذر الاتصال بمزود البريد الإلكتروني، يرجى التأكد من مفتاح RESEND_API_KEY أو المحاولة مجدداً.';
    }

    return msg;
  };

  // Start Cooldown timer
  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 1. Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    setIsSendingOtp(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await sendOtp(email.trim());
      setSuccessMsg(res.message || 'تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      startCooldown(res.cooldownSeconds || 60);
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err, 'فشل إرسال رمز التحقق، يرجى المحاولة مرة أخرى'));
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userProfile = await verifyOtp(email.trim(), otp.trim());
      if (userProfile) {
        const isAdmin = userProfile.role === 'admin' || 
                        userProfile.role === 'staff' ||
                        userProfile.email.toLowerCase() === 'mfb.15@icloud.com' || 
                        userProfile.email.toLowerCase() === 'mfb-15@hotmail.com';
        
        if (isAdmin) {
          navigate('/admin');
          return;
        }

        // If user already has complete profile (fullName, phone, dob), navigate directly to home
        if (
          userProfile.fullName && userProfile.fullName.trim() && 
          userProfile.phone && userProfile.phone.trim() && 
          userProfile.dob && userProfile.dob.trim()
        ) {
          navigate('/home');
          return;
        }

        setEmail(userProfile.email || email.trim());
        setFullName(userProfile.fullName || '');
        setPhone(userProfile.phone || '');
        setDob(userProfile.dob || '');
        setStep(2);
      }
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err, 'رمز التحقق غير صحيح أو انتهت صلاحيته'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Google Login Alternative
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const googleUser = await loginWithGoogle();
      if (googleUser) {
        const isAdmin = googleUser.role === 'admin' || 
                        googleUser.role === 'staff' ||
                        googleUser.email.toLowerCase() === 'mfb.15@icloud.com' || 
                        googleUser.email.toLowerCase() === 'mfb-15@hotmail.com';
        if (isAdmin) {
          navigate('/admin');
          return;
        }

        if (
          googleUser.fullName && googleUser.fullName.trim() && 
          googleUser.phone && googleUser.phone.trim() && 
          googleUser.dob && googleUser.dob.trim()
        ) {
          navigate('/home');
          return;
        }

        setEmail(googleUser.email || '');
        setFullName(googleUser.fullName || '');
        setPhone(googleUser.phone || '');
        setDob(googleUser.dob || '');
        setStep(2);
      }
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err, 'فشل تسجيل الدخول بواسطة Google'));
    }
  };

  const handleNextStep2 = () => {
    if (accountType === 'company' && !companyName.trim()) {
      setErrorMsg('يرجى كتابة اسم الشركة أو المؤسسة');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleNextStep3 = () => {
    if (!dob) {
      setErrorMsg('يرجى تحديد تاريخ الميلاد');
      return;
    }
    setErrorMsg('');
    setStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('يرجى كتابة الاسم الكامل');
      return;
    }
    const cleanPhone = convertArabicToEnglishDigits(phone.trim()).replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('يرجى كتابة رقم جوال صحيح (مثال: 05xxxxxxxx)');
      return;
    }
    if (!dob) {
      setErrorMsg('يرجى تحديد تاريخ الميلاد');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMsg('');

    try {
      await registerUser({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phone: cleanPhone,
        dob: dob.trim(),
        entityType: accountType,
        companyName: accountType === 'company' ? companyName.trim() : undefined,
      });

      navigate('/home');
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err, 'حدث خطأ أثناء حفظ الملف الشخصي'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Tajawal',sans-serif] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-500 selection:text-white w-full" dir="rtl">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>DevStudio</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">تسجيل الدخول والتوثيق</h2>
          <p className="text-xs text-slate-400">تابع مشاريعك البرمجية وقدّم طلباتك بكل سهولة وأمان</p>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6 w-full text-right">
          
          {/* Error / Success Notifications */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: ENTER EMAIL */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full text-left pl-4 pr-10 py-3 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSendingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال رمز التحقق...</span>
                  </>
                ) : (
                  <>
                    <span>إرسال رمز التحقق (OTP)</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Google Alternative */}
              <div className="pt-3 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>الدخول بحساب Google</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 'otp': ENTER OTP CODE */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">أدخل رمز التحقق (6 أرقام)</label>
                  <span className="text-[11px] text-indigo-400 font-mono">{email}</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(convertArabicToEnglishDigits(e.target.value).replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    autoFocus
                    dir="ltr"
                    className="w-full text-center tracking-[10px] pl-4 pr-10 py-3 bg-slate-950/60 border border-slate-700/80 rounded-2xl text-lg font-mono text-indigo-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otp.length !== 6}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق والدخول...</span>
                  </>
                ) : (
                  <>
                    <span>تأكيد الرمز والدخول</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:text-white underline cursor-pointer"
                >
                  تغيير البريد
                </button>

                {cooldown > 0 ? (
                  <span>إعادة الإرسال بعد ({cooldown}ث)</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 2: ENTITY TYPE (فرد أو شركة بدون وصف) */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">اختر نوع الحساب:</label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('individual')}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer font-bold text-sm ${
                    accountType === 'individual'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
                  <span>فرد</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('company')}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer font-bold text-sm ${
                    accountType === 'company'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-teal-400" />
                  <span>شركة</span>
                </button>
              </div>

              {accountType === 'company' && (
                <div className="space-y-1 pt-2">
                  <label className="block text-xs font-bold text-slate-300">اسم الشركة أو المؤسسة</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: شركة الحلول المتقدمة"
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-700 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleNextStep2}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: DOB */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">تاريخ الميلاد</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 pr-10 py-3 bg-slate-950/60 border border-slate-700 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  السابق
                </button>
                <button
                  type="button"
                  onClick={handleNextStep3}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FULL NAME & PHONE (Empty by default) */}
          {step === 4 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">الاسم الكامل</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="اكتب اسمك الكامل هنا..."
                    className="w-full pl-4 pr-10 py-3 bg-slate-950/60 border border-slate-700 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">رقم الجوال</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0500000000"
                    dir="ltr"
                    className="w-full text-right pl-4 pr-10 py-3 bg-slate-950/60 border border-slate-700 rounded-2xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  السابق
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>إتمام الدخول</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
