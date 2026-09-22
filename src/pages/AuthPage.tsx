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
  KeyRound,
  Lock,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AccountType } from '../types';
import { convertArabicToEnglishDigits } from '../lib/db';

export const AuthPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { 
    registerUser, 
    loginWithGoogle, 
    sendFirebaseEmailLink 
  } = useAuth();

  // Wizard Step (1 to 4)
  const [step, setStep] = useState<number>(1);

  // Auth Choice
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 2: Entity Type
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [companyName, setCompanyName] = useState('');

  // Step 3: DOB - Default to 2010-01-01
  const [dob, setDob] = useState('2010-01-01');

  // Step 4: Full Name & Phone
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Firebase Email Link Send
  const handleSendEmailLink = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('البريد الإلكتروني غير صحيح');
      return;
    }

    if (resendCooldown > 0) {
      setErrorMsg(`يرجى الانتظار ${resendCooldown} ثانية قبل إعادة الإرسال`);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await sendFirebaseEmailLink(email.trim());
      setLinkSent(true);

      // Start 30s resend cooldown
      setResendCooldown(30);
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
      setErrorMsg(err.message || 'فشل إرسال رابط تسجيل الدخول، يرجى إعادة المحاولة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const googleUser = await loginWithGoogle();
      if (googleUser) {
        if (googleUser.email) setEmail(googleUser.email);
        if (googleUser.fullName) setFullName(googleUser.fullName);
        if (googleUser.phone) setPhone(googleUser.phone);

        // If user is already existing or details are filled, go directly to home page
        if (googleUser.fullName && googleUser.phone && googleUser.phone !== '+966 50 123 4567') {
          navigate('/home');
          return;
        }
        setStep(2);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول بواسطة Google');
    } finally {
      setIsLoading(false);
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
    if (!phone.trim() || phone.length < 8) {
      setErrorMsg('يرجى كتابة رقم جوال صحيح');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await registerUser({
        email: email || 'user@devstudio.sa',
        fullName: fullName.trim(),
        phone: phone.trim(),
        entityType: accountType,
        companyName: accountType === 'company' ? companyName.trim() : undefined,
        dob
      });

      // Navigate to main app
      navigate('/home');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في التسجيل');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Tajawal',sans-serif] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative" dir="rtl">
      
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header back button */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between z-10">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else navigate('/landing');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all text-slate-300 hover:text-white cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{step > 1 ? 'الخطوة السابقة' : 'العودة للتعريف'}</span>
        </button>

        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
          خطوة {step} من 4
        </span>
      </div>

      {/* Main Wizard Card */}
      <div className="max-w-xl mx-auto w-full my-auto z-10 pt-8 pb-12">
        
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8">
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-gradient-to-r from-indigo-500 to-teal-400' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* STEP 1: AUTH METHOD (GOOGLE / EMAIL VIA FIREBASE LINK) */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              
              {!linkSent ? (
                <>
                  <div className="space-y-2 text-right">
                    <h1 className="text-2xl font-black text-white">تسجيل الدخول / إنشاء حساب جديد</h1>
                    <p className="text-xs text-slate-400">اختر طريقة تسجيل الدخول المفضل لديك للبدء</p>
                  </div>

                  {/* Method Toggles */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('email');
                        setErrorMsg('');
                      }}
                      className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-3 transition-all cursor-pointer ${
                        authMethod === 'email'
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-black'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>البريد الإلكتروني</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('google');
                        setErrorMsg('');
                      }}
                      className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-3 transition-all cursor-pointer ${
                        authMethod === 'google'
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-black'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>حساب Google</span>
                    </button>
                  </div>

                  {authMethod === 'email' ? (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-indigo-500 outline-none"
                        />
                      </div>

                      {errorMsg && (
                        <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">{errorMsg}</p>
                      )}

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleSendEmailLink}
                        className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{isLoading ? 'جاري إرسال الرابط...' : 'إرسال رابط الدخول'}</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {errorMsg && (
                        <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">{errorMsg}</p>
                      )}

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleGoogleLogin}
                        className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{isLoading ? 'جاري الاتصال بـ Google...' : 'متابعة بواسطة Google'}</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* CONFIRMATION SCREEN */
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
                    <Mail className="w-8 h-8 text-indigo-400" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">تحقق من بريدك الإلكتروني</h2>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                      أرسلنا رابط تسجيل الدخول إلى بريدك الإلكتروني. افتح الرسالة واضغط على رابط تسجيل الدخول للمتابعة.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
                    <span className="text-xs text-slate-400 block mb-1">تم الإرسال إلى:</span>
                    <span className="font-mono font-bold text-indigo-300 text-sm dir-ltr">{email}</span>
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">{errorMsg}</p>
                  )}

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleSendEmailLink}
                      className={`w-full py-3.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                        resendCooldown > 0
                          ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30'
                      }`}
                    >
                      {resendCooldown > 0 ? `إعادة إرسال الرابط بعد (${resendCooldown} ثانية)` : 'إعادة إرسال الرابط'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLinkSent(false);
                        setErrorMsg('');
                      }}
                      className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      تغيير البريد الإلكتروني
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          )}

          {/* STEP 2: ENTITY TYPE (INDIVIDUAL / COMPANY) */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2 text-right">
                <h2 className="text-2xl font-black text-white">تحديد صفة المستخدم</h2>
                <p className="text-xs text-slate-400">هل تطلب الخدمة بصفتك فرد أم يمثل شركة أو مؤسسة؟</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('individual');
                    setErrorMsg('');
                  }}
                  className={`p-6 rounded-2xl border text-right space-y-3 transition-all cursor-pointer ${
                    accountType === 'individual'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-black shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-7 h-7 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">فرد / مستقل</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">للأفراد وأصحاب الأفكار الناشئة</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccountType('company');
                    setErrorMsg('');
                  }}
                  className={`p-6 rounded-2xl border text-right space-y-3 transition-all cursor-pointer ${
                    accountType === 'company'
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-black shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-7 h-7 text-indigo-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">شركة / مؤسسة</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">للجهات التجارية والشركات</p>
                  </div>
                </button>
              </div>

              {accountType === 'company' && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-300">اسم الشركة أو المؤسسة</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: شركة الرؤية المستقبلية"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              {errorMsg && (
                <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{errorMsg}</p>
              )}

              <button
                type="button"
                onClick={handleNextStep2}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>متابعة الخطوة التالية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 3: DATE OF BIRTH */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2 text-right">
                <h2 className="text-2xl font-black text-white">تاريخ الميلاد</h2>
                <p className="text-xs text-slate-400">يرجى تحديد تاريخ الميلاد لاكتمال بيانات ملفك</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">تاريخ الميلاد (اليوم / الشهر / السنة)</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-indigo-400 absolute right-3.5 top-3.5" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-4 pr-11 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{errorMsg}</p>
              )}

              <button
                type="button"
                onClick={handleNextStep3}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>متابعة الخطوة الأخيرة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 4: PHONE & FULL NAME + "تبقى خطوة واحدة فقط" BANNER */}
          {step === 4 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              
              {/* Mandatory Requirement Banner */}
              <div className="p-4 bg-indigo-950/80 border border-indigo-500/40 rounded-2xl text-indigo-200 text-center space-y-1">
                <div className="flex items-center justify-center gap-2 font-black text-base text-indigo-300">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>تبقى خطوة واحدة فقط</span>
                </div>
                <p className="text-xs opacity-90">ادخل اسمك الكامل ورقم الجوال المعتمد للتواصل</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الاسم الكامل</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: عبدالله محمد السلمان"
                      className="w-full pl-4 pr-11 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الجوال</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(convertArabicToEnglishDigits(e.target.value))}
                      placeholder="0501234567"
                      dir="ltr"
                      className="w-full pl-4 pr-11 py-3.5 text-right bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isLoading ? 'جاري الاتصال وحفظ البيانات...' : 'بدأ الاستخدام'}</span>
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};
