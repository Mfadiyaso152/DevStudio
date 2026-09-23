import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PhoneCall, 
  MessageCircle, 
  DollarSign, 
  Layers, 
  Upload, 
  FileText, 
  Sparkles, 
  ExternalLink,
  Edit,
  Save,
  Users,
  BarChart3,
  Lock,
  Download,
  Check,
  AlertCircle,
  Mail,
  Send,
  UserCheck
} from 'lucide-react';
import { QuoteRequest, Project, PaymentReceipt, UserProfile } from '../types';
import { 
  subscribeQuotes, 
  subscribeProjects, 
  subscribePayments, 
  updateQuoteStatus, 
  updateProjectProgress,
  approveOrRejectPayment,
  getAllUserProfiles,
  updateUserRole,
  convertArabicToEnglishDigits,
  getClientCodeForUser,
  getOrderCodeForQuote
} from '../lib/db';
import { useAuth } from '../context/AuthContext';

export const AdminPage: React.FC = () => {
  const { user, sendOtp, verifyOtp } = useAuth();
  
  // Primary Admin Email Required
  const PRIMARY_ADMIN_EMAIL = 'mfb-15@hotmail.com';

  // Admin Verification Gate State
  const [inputEmail, setInputEmail] = useState<string>('mfb-15@hotmail.com');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [gateError, setGateError] = useState<string>('');
  const [isSendingLink, setIsSendingLink] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Tab State: 1 = stats, 2 = quotes, 3 = payments, 4 = permissions (password protected)
  const [activeTab, setActiveTab] = useState<'stats' | 'quotes' | 'payments' | 'users'>('stats');

  // Section 4 Password Lock State
  const [usersSectionUnlocked, setUsersSectionUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // DB States
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Editing agreed price and staff notes state
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubQ = subscribeQuotes(setQuotes);
    const unsubProj = subscribeProjects(setProjects);
    const unsubPay = subscribePayments(setPayments);
    setAllUsers(getAllUserProfiles());

    return () => {
      unsubQ();
      unsubProj();
      unsubPay();
    };
  }, []);

  // Handle sending OTP to admin
  const handleSendAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (cleanEmail !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      setGateError('عفواً، لا يملك هذا البريد صلاحيات الدخول للوحة التحكم');
      return;
    }

    setIsSendingLink(true);
    setGateError('');

    try {
      await sendOtp(PRIMARY_ADMIN_EMAIL);
      setOtpSent(true);
    } catch (err: any) {
      setGateError(err.message || 'فشل إرسال رمز التحقق للبريد الإلكتروني');
    } finally {
      setIsSendingLink(false);
    }
  };

  // Handle verifying Admin OTP
  const handleVerifyAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setGateError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setIsVerifyingOtp(true);
    setGateError('');

    try {
      await verifyOtp(PRIMARY_ADMIN_EMAIL, otpCode.trim());
    } catch (err: any) {
      setGateError(err.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Check if Admin panel is unlocked
  const isAdminUnlocked = user?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() || user?.role === 'admin' || user?.role === 'staff';

  // Handle Password verification for Section 4 (Users & Permissions)
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '2011') {
      setUsersSectionUnlocked(true);
      setPasswordError('');
      setAllUsers(getAllUserProfiles());
    } else {
      setPasswordError('كلمة المرور غير صحيحة، يرجى إدخال 2011');
    }
  };

  // Handle Granting/Revoking Employee Role
  const handleToggleStaffRole = async (targetUser: UserProfile) => {
    const newRole = targetUser.role === 'staff' ? 'client' : 'staff';
    await updateUserRole(targetUser.uid, newRole);
    setAllUsers(getAllUserProfiles());
  };

  // Handle Accepting Quote & Setting Amount
  const handleConfirmQuotePrice = async (quote: QuoteRequest) => {
    const inputPrice = editingPrices[quote.id] || quote.agreedPrice?.toString() || '15000';
    const priceNum = parseFloat(inputPrice) || 15000;
    const notes = editingNotes[quote.id] || quote.staffNotes || 'تم التواصل والتأكيد مع العميل عبر الواتساب وتثبيت السعر المتفق عليه.';

    await updateQuoteStatus(quote.id, 'accepted', notes, priceNum, 'whatsapp');
    setConfirmSuccessMsg(prev => ({ ...prev, [quote.id]: 'تم تأكيد المبلغ وتأكيد الطلب بنجاح ✓' }));
    setTimeout(() => {
      setConfirmSuccessMsg(prev => {
        const next = { ...prev };
        delete next[quote.id];
        return next;
      });
    }, 4000);
  };

  // Handle Rejecting Quote
  const handleRejectQuote = async (quote: QuoteRequest) => {
    const notes = editingNotes[quote.id] || 'اعتذار عن قبول الطلب لعدم توفر الميزانية أو السعة التشغيلية.';
    await updateQuoteStatus(quote.id, 'rejected', notes);
  };

  // -------------------------------------------------------------
  // ADMIN AUTH GATE SCREEN (If user email is not mfb.15@icloud.com)
  // -------------------------------------------------------------
  if (!isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-['Tajawal',sans-serif] flex items-center justify-center p-4 relative" dir="rtl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10 text-right"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white">لوحة تحكم الإدارة والمشرفين</h1>
            <p className="text-xs text-slate-400">
              {otpSent ? 'أدخل رمز التحقق (OTP) المكون من 6 أرقام للدخول' : 'يرجى تأكيد البريد الإلكتروني المصرح له بالدخول'}
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendAdminOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">البريد الإلكتروني للإدارة</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="mfb-15@hotmail.com"
                    className="w-full pl-4 pr-11 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-indigo-500 outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              {gateError && (
                <div className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 text-right flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{gateError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingLink}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingLink ? 'جاري إرسال رمز التحقق...' : 'إرسال رمز التحقق (OTP)'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAdminOtp} className="space-y-5">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
                <span className="text-xs text-slate-400 block mb-1">تم إرسال الرمز إلى:</span>
                <span className="font-mono font-bold text-indigo-300 text-sm dir-ltr">{PRIMARY_ADMIN_EMAIL}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">رمز التحقق (6 أرقام)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3.5 bg-slate-800 border-2 border-slate-700 focus:border-indigo-500 rounded-xl text-white font-bold outline-none"
                />
              </div>

              {gateError && (
                <div className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/20 text-right flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{gateError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVerifyingOtp ? 'جاري التحقق...' : 'تأكيد وتسجيل الدخول للوحة الإدارة'}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSendingLink}
                  onClick={handleSendAdminOtp}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  إعادة إرسال الرمز
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setGateError('');
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 font-bold text-xs transition-all cursor-pointer"
                >
                  رجوع
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  // Calculate statistics
  const totalClients = allUsers.length || quotes.length;
  const totalQuotes = quotes.length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const totalRevenue = quotes.reduce((acc, q) => acc + (q.agreedPrice || 0), 0);

  // Is staff user (only allowed tabs 1, 2, 3)
  const isStaffOnly = user?.role === 'staff' && user?.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Tajawal',sans-serif] pb-28 pt-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      
      {/* Admin Dashboard Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold border border-indigo-500/30">
                لوحة التحكم الإدارية
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-mono font-bold border border-emerald-500/30" dir="ltr">
                {user?.email || 'مشرف النظام'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white">إدارة الاستوديو البرمجي</h1>
            <p className="text-xs text-slate-400 mt-1">
              متابعة الإحصائيات، قبول عروض الأسعار، مراجعة الحوالات البنكية، وإدارة صلاحيات الموظفين
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-800/80 rounded-2xl border border-slate-700 text-center">
              <span className="block text-[10px] text-slate-400">إجمالي الطلبات</span>
              <span className="text-lg font-black text-indigo-400 font-mono">OD-{quotes.length}</span>
            </div>
            <div className="px-4 py-2 bg-slate-800/80 rounded-2xl border border-slate-700 text-center">
              <span className="block text-[10px] text-slate-400">إجمالي العملاء</span>
              <span className="text-lg font-black text-emerald-400 font-mono">DS-{totalClients}</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: STATISTICS (TAB 1) */}
        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              <span>إحصائيات وأداء المنصة</span>
            </h2>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div whileHover={{ scale: 1.02, y: -2 }} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 transition-all">
                <span className="text-xs font-bold text-slate-400">عدد العملاء المسجلين</span>
                <div className="text-3xl font-black text-white font-mono flex items-baseline gap-2">
                  <span>{totalClients}</span>
                  <span className="text-xs text-indigo-400 font-sans">عميل (DS-1 إلى DS-{totalClients || 1})</span>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, y: -2 }} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 transition-all">
                <span className="text-xs font-bold text-slate-400">إجمالي طلبات الأسعار</span>
                <div className="text-3xl font-black text-indigo-400 font-mono flex items-baseline gap-2">
                  <span>{totalQuotes}</span>
                  <span className="text-xs text-slate-400 font-sans">طلب (OD-1 إلى OD-{totalQuotes || 1})</span>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, y: -2 }} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 transition-all">
                <span className="text-xs font-bold text-slate-400">عروض الأسعار المقبولة</span>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {acceptedQuotes}
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, y: -2 }} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-2 transition-all">
                <span className="text-xs font-bold text-slate-400">قيمة العقود والمقترحات</span>
                <div className="text-3xl font-black text-teal-300 font-mono">
                  {totalRevenue.toLocaleString('ar-SA')} <span className="text-xs font-sans">ر.س</span>
                </div>
              </motion.div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white">آخر الطلبات والمشاريع النشطة</h3>
              {quotes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 rounded-2xl">
                  لا توجد طلبات عروض أسعار مسجلة حالياً.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {quotes.slice(0, 5).map((q, idx) => (
                    <div key={q.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md font-mono">
                            {q.orderCode || `OD-${quotes.length - idx}`}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md font-mono">
                            {getClientCodeForUser(q.userId)}
                          </span>
                          <span className="text-sm font-bold text-white">{q.title}</span>
                        </div>
                        <p className="text-xs text-slate-400">العميل: {q.userName} | {q.userPhone}</p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        q.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300' :
                        q.status === 'rejected' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {q.status === 'accepted' ? 'مقبول' : q.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SECTION 2: QUOTES & ORDERS (TAB 2) */}
        {activeTab === 'quotes' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              <span>عروض الأسعار والاتفاق المالي</span>
            </h2>

            {quotes.length === 0 ? (
              <div className="p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-400 text-xs">
                لا توجد طلبات عروض أسعار مسجلة في الوقت الحالي.
              </div>
            ) : (
              <div className="space-y-6">
                {quotes.map((quote, idx) => {
                  const orderCode = quote.orderCode || `OD-${quotes.length - idx}`;
                  const clientCode = getClientCodeForUser(quote.userId);
                  const cleanPhone = convertArabicToEnglishDigits(quote.userPhone).replace(/\s+/g, '');
                  const currentAgreedPrice = editingPrices[quote.id] ?? (quote.agreedPrice?.toString() || '');

                  return (
                    <div key={quote.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                      
                      {/* Header bar */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-indigo-600/30 text-indigo-300 font-mono text-xs font-bold rounded-lg border border-indigo-500/30">
                              رقم الطلب: {orderCode}
                            </span>
                            <span className="px-3 py-1 bg-emerald-600/30 text-emerald-300 font-mono text-xs font-bold rounded-lg border border-emerald-500/30">
                              رقم العميل: {clientCode}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                              {quote.serviceTypeLabel}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white mt-2">{quote.title}</h3>
                          <p className="text-xs text-slate-400">مقدم من: <strong className="text-slate-200">{quote.userName}</strong> ({quote.userEntityType === 'company' ? quote.companyName || 'شركة' : 'فرد'})</p>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {quote.status === 'pending' && (
                            <span className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold">
                              بانتظار تحديد السعر وقبول العرض
                            </span>
                          )}
                          {quote.status === 'accepted' && (
                            <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>تم القبول وتثبيت الطلب</span>
                            </span>
                          )}
                          {quote.status === 'rejected' && (
                            <span className="px-4 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold">
                              تم الاعتذار عن الطلب
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                        <strong className="text-indigo-300">التفاصيل والمواصفات: </strong> {quote.details}
                      </p>

                      {/* ACTION & WHATSAPP AGREEMENT SECTION */}
                      <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4">
                        
                        {/* Contact & WhatsApp Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                          <div>
                            <span className="block text-[11px] text-slate-400">رقم جوال العميل للتواصل:</span>
                            <span className="font-mono text-sm font-bold text-white" dir="ltr">{quote.userPhone}</span>
                          </div>

                          <a
                            href={`https://wa.me/966${cleanPhone.replace(/^0+/, '')}?text=${encodeURIComponent(`السلام عليكم ${quote.userName}، تحدثك إدارة استوديو البرمجة بخصوص طلبكم #${orderCode} (${quote.title}).`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>تحويل جاهز للواتس اب للاتفاق على المبلغ</span>
                          </a>
                        </div>

                        {/* Price Input & Confirmation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">كتابة المبلغ المتفق عليه (ر.س)</label>
                            <input
                              type="number"
                              placeholder="مثال: 15000"
                              value={currentAgreedPrice}
                              onChange={(e) => setEditingPrices({ ...editingPrices, [quote.id]: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات التوثيق للموظف</label>
                            <input
                              type="text"
                              placeholder="تم الاتفاق مع العميل هاتفياً..."
                              value={editingNotes[quote.id] ?? (quote.staffNotes || '')}
                              onChange={(e) => setEditingNotes({ ...editingNotes, [quote.id]: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Confirmation buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => handleConfirmQuotePrice(quote)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>تأكيد المبلغ وإتمام الطلب بنجاح</span>
                          </button>

                          {quote.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectQuote(quote)}
                              className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                            >
                              رفض العرض
                            </button>
                          )}
                        </div>

                        {confirmSuccessMsg[quote.id] && (
                          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl text-center">
                            {confirmSuccessMsg[quote.id]}
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* SECTION 3: PAYMENTS & RECEIPTS (TAB 3) */}
        {activeTab === 'payments' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-indigo-400" />
              <span>مراجعة وقبول الدفعات والحوالات</span>
            </h2>

            {payments.length === 0 ? (
              <div className="p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-400 text-xs">
                لا توجد دفعات أو إيصالات تحويل بانتظار المراجعة.
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((pay) => (
                  <div key={pay.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md">
                            {pay.amount.toLocaleString('ar-SA')} ر.س
                          </span>
                          <span className="text-xs font-bold text-slate-400">البنك: {pay.bankName}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{pay.projectTitle}</h3>
                        <p className="text-xs text-slate-400">اسم المحول: <strong className="text-white">{pay.senderName}</strong> | الرقم المرجعي: <span className="font-mono text-indigo-300">{pay.referenceNumber}</span></p>
                      </div>

                      <div className="flex items-center gap-2">
                        {pay.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => approveOrRejectPayment(pay.id, 'approved', 'تم التحقق واستلام المبلغ في الحساب البنكي')}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer"
                            >
                              قبول الدفعة
                            </button>
                            <button
                              onClick={() => approveOrRejectPayment(pay.id, 'rejected', 'بيانات التحويل غير مطابقة')}
                              className="px-4 py-2.5 bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 cursor-pointer"
                            >
                              رفض الدفعة
                            </button>
                          </>
                        ) : (
                          <span className={`px-4 py-2 rounded-xl text-xs font-bold ${pay.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                            الحالة: {pay.status === 'approved' ? 'مقبولة ✓' : 'مرفوضة'}
                          </span>
                        )}
                      </div>
                    </div>

                    {pay.receiptNote && (
                      <p className="text-xs text-slate-300 bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
                        ملاحظة العميل بالإيصال: {pay.receiptNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* SECTION 4: PERMISSIONS & USERS (TAB 4 - PASSWORD PROTECTED WITH 2011) */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-indigo-400" />
                  <span>إدارة المستخدمين وصلاحيات الموظفين</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">قسم محمي بكلمة مرور خاصة لتعيين وتفويض الموظفين</p>
              </div>

              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>محمي بكلمة مرور (2011)</span>
              </span>
            </div>

            {/* PASSWORD GATE FOR SECTION 4 */}
            {!usersSectionUnlocked ? (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
                <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                  <Lock className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">إدخال كلمة المرور السرية</h3>
                  <p className="text-xs text-slate-400 mt-1">يرجى إدخال كلمة المرور المخصصة لدخول قسم إدارة صلاحيات المستخدمين والموظفين</p>
                </div>

                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center font-mono text-lg outline-none focus:border-indigo-500"
                  />

                  {passwordError && (
                    <p className="text-xs font-bold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{passwordError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    فتح القفل ودخول قسم المستخدمين
                  </button>
                </form>
              </div>
            ) : (
              /* UNLOCKED USERS & PERMISSIONS LIST */
              <div className="space-y-6">
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>تم فتح قفل قسم المستخدمين بنجاح. يمكنك الآن الاطلاع على كافة العملاء وتعيين أو إلغاء صلاحية "موظف" لكل مستخدم.</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
                  {allUsers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      لا يوجد مستخدمون مسجلون حالياً بملفات كاملة.
                    </div>
                  ) : (
                    allUsers.map((u, i) => (
                      <div key={u.uid} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold rounded-md">
                              {u.clientCode || `DS-${i + 1}`}
                            </span>
                            <span className="font-bold text-white text-base">{u.fullName}</span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              u.role === 'admin' ? 'bg-indigo-500/30 text-indigo-300' :
                              u.role === 'staff' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {u.role === 'admin' ? 'مشرف رئيسي' : u.role === 'staff' ? 'موظف مصرح' : 'عميل'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">البريد: <span className="font-mono text-slate-200">{u.email}</span> | الجوال: <span className="font-mono text-slate-200">{u.phone}</span></p>
                        </div>

                        {u.email.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase() && (
                          <button
                            onClick={() => handleToggleStaffRole(u)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              u.role === 'staff'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                            }`}
                          >
                            {u.role === 'staff' ? 'إلغاء صلاحية الموظف' : 'منح صلاحيات موظف'}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* FIXED ADMIN BOTTOM BAR WITH 4 SECTIONS */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 py-3 px-4 shadow-2xl">
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-2 text-center">
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px]">الإحصائيات</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'quotes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[11px]">عروض الأسعار</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[11px]">الدفع والحوالات</span>
          </button>

          {!isStaffOnly && (
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 rounded-2xl flex flex-col items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[11px]">إدارة الصلاحيات</span>
            </button>
          )}

        </div>
      </div>

    </div>
  );
};
