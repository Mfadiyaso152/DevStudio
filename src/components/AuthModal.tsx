import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  KeyRound, 
  User, 
  Building2, 
  Calendar, 
  Phone, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EntityType } from '../types';
import { convertArabicToEnglishDigits } from '../lib/db';
import { OtpInput } from './OtpInput';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    registerUser, 
    loginWithGoogle, 
    sendOtp,
    verifyOtp
  } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('email');
  const [email, setEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Profile Onboarding Form state
  const [entityType, setEntityType] = useState<EntityType>('individual');
  const [companyName, setCompanyName] = useState<string>('');
  const [dob, setDob] = useState<string>('2010-01-01');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  if (!isAuthModalOpen) return null;

  const resetState = () => {
    setStep(1);
    setOtpSent(false);
    setOtpCode('');
    setErrorMessage('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    closeAuthModal();
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await sendOtp(email.trim());
      setOtpSent(true);
      setResendCooldown(res.cooldownSeconds || 60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل إرسال رمز التحقق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      const profile = await verifyOtp(email.trim(), otpCode.trim());
      if (profile) {
        if (profile.fullName && profile.phone && profile.phone !== '+966 50 123 4567') {
          handleClose();
          return;
        }
        setFullName(profile.fullName || '');
        setPhone(profile.phone || '');
        setStep(2);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل التحقق من رمز OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const gUser = await loginWithGoogle();
      if (gUser) {
        if (gUser.email) setEmail(gUser.email);
        if (gUser.fullName) setFullName(gUser.fullName);
        if (gUser.phone) setPhone(gUser.phone);

        if (gUser.fullName && gUser.phone && gUser.phone !== '+966 50 123 4567') {
          closeAuthModal();
          return;
        }
        setStep(2);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تسجيل الدخول بـ Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('يرجى إدخال الاسم الكامل ورقم الجوال');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await registerUser({
        email: email || 'user@example.com',
        fullName: fullName.trim(),
        phone: phone.trim(),
        dob,
        entityType,
        companyName: entityType === 'company' ? companyName : undefined,
      });
      resetState();
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في حفظ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <button 
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
              الخطوة {step} من 4
            </span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div 
            className="bg-indigo-600 h-1.5 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: AUTH METHOD CHOICE (GOOGLE OR EMAIL LINK) */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!otpSent ? (
                  <>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900">تسجيل الدخول / إنشاء حساب</h3>
                      <p className="text-sm text-slate-500">اختر طريقة تسجيل الدخول المفضلة للبدء في طلب مشروعك البرمجي</p>
                    </div>

                    {/* Google Button */}
                    <button
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl text-slate-800 font-semibold shadow-sm transition-all hover:border-slate-400 group cursor-pointer"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>متابعة باستخدام حساب Google</span>
                    </button>

                    <div className="relative flex items-center justify-center">
                      <div className="border-t border-slate-200 w-full" />
                      <span className="bg-white px-3 text-xs text-slate-400 font-medium uppercase absolute">أو برمز التحقق (OTP)</span>
                    </div>

                    {/* Email Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">البريد الإلكتروني</label>
                        <div className="relative">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@domain.com"
                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-left font-sans text-sm"
                            dir="ltr"
                          />
                          <Mail className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                        </div>
                      </div>

                      <button
                        onClick={handleSendOtp}
                        disabled={isLoading}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{isLoading ? 'جاري إرسال الرمز...' : 'إرسال رمز التحقق'}</span>
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </>
                ) : (
                  /* OTP CODE SCREEN */
                  <form onSubmit={handleVerifyOtp} className="space-y-5 py-2">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
                        <KeyRound className="w-7 h-7" />
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900">أدخل رمز التحقق (OTP)</h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                        تم إرسال رمز تحقق مكون من 6 أرقام إلى بريدك الإلكتروني.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <span className="text-xs text-slate-500 block mb-0.5">البريد الإلكتروني:</span>
                      <span className="font-mono font-bold text-indigo-700 text-xs dir-ltr">{email}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 text-center">أدخل الرمز المكون من 6 أرقام</label>
                      <OtpInput
                        value={otpCode}
                        onChange={setOtpCode}
                        disabled={isLoading}
                        autoFocus={true}
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="submit"
                        disabled={isLoading || otpCode.length !== 6}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{isLoading ? 'جاري التحقق...' : 'تحقق'}</span>
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        disabled={resendCooldown > 0 || isLoading}
                        onClick={handleSendOtp}
                        className={`w-full py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                          resendCooldown > 0
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        {resendCooldown > 0 ? `إعادة إرسال الرمز بعد (${resendCooldown} ثانية)` : 'إعادة إرسال الرمز'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setErrorMessage('');
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                      >
                        تغيير البريد الإلكتروني
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* STEP 2: ENTITY SELECTION (COMPANY OR INDIVIDUAL) */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">حدد نوع الحساب</h3>
                  <p className="text-sm text-slate-500">هل تطلب البرمجيات بصفتك فرد أم تمثل شركة / مؤسسة؟</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEntityType('individual')}
                    className={`p-5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-3 ${
                      entityType === 'individual'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${entityType === 'individual' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold text-base">فرد</span>
                      <span className="text-xs text-slate-500">أفراد، مستقلون، وأصحاب أفكار</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEntityType('company')}
                    className={`p-5 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-3 ${
                      entityType === 'company'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${entityType === 'company' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold text-base">شركة / مؤسسة</span>
                      <span className="text-xs text-slate-500">شركات، قطاع أعمال، وناشئة</span>
                    </div>
                  </button>
                </div>

                {entityType === 'company' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">اسم الشركة / المؤسسة</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="مثال: شركة الحلول الذكية المحدودة"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </motion.div>
                )}

                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  <span>المتابعة للخطوة التالية</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </motion.div>
            )}

            {/* STEP 3: DATE OF BIRTH */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">تاريخ الميلاد</h3>
                  <p className="text-sm text-slate-500">يرجى تحديد تاريخ الميلاد لاستكمال توثيق الحساب والضمان البرمجي</p>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Calendar className="w-6 h-6" />
                    <span className="font-bold text-slate-800">حدد تاريخ الميلاد:</span>
                  </div>

                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans text-center text-lg font-semibold"
                  />
                </div>

                <button
                  onClick={() => setStep(4)}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  <span>الانتقال للخطوة الأخيرة</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </motion.div>
            )}

            {/* STEP 4: PHONE & FULL NAME + BANNER "تبقى خطوة واحدة فقط" */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* REQUIRED BANNER: تبقى خطوة واحدة فقط */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 shadow-sm">
                  <div className="p-2 bg-amber-500 text-white rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-amber-950">تبقى خطوة واحدة فقط!</h4>
                    <p className="text-xs text-amber-800">أدخل رقم الجوال والاسم الكامل لتفعيل الحساب نهائياً</p>
                  </div>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">الاسم الكامل</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: عبدالله بن محمد السلمان"
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                      <User className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">رقم الجوال (للتواصل عبر الواتساب/الاتصال)</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(convertArabicToEnglishDigits(e.target.value))}
                        placeholder="0501234567"
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-right font-sans"
                        dir="ltr"
                      />
                      <Phone className="w-5 h-5 text-slate-400 absolute right-3 top-3.5" />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600" />
                    <span>بياناتك محمية ومحفوظة بموجب اتفاقية الخصوصية واستوديو البرمجة</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-lg rounded-xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    <span>إكمال التسجيل والبدء مباشرة</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
