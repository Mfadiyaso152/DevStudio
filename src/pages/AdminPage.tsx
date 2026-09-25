import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home,
  FileText, 
  CreditCard, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Edit,
  Trash2,
  Search,
  Activity,
  X,
  Plus,
  Phone,
  MessageCircle,
  ExternalLink,
  Image as ImageIcon,
  Check,
  Building2,
  DollarSign,
  Briefcase,
  Layers,
  Upload,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { QuoteRequest, Project, PaymentReceipt, UserProfile, StaffMember, PortfolioProject } from '../types';
import { 
  subscribeQuotes, 
  subscribeProjects, 
  subscribePayments, 
  subscribeStaff,
  subscribePortfolioProjects,
  updateQuoteStatus, 
  createPaymentInvoice,
  approveOrRejectPayment,
  getAllUserProfiles,
  addStaffMember,
  deleteStaffMember,
  addPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
  convertArabicToEnglishDigits,
  getOrderCodeForQuote
} from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { compressImageFile } from '../lib/imageUtils';

export const AdminPage: React.FC = () => {
  const { user, logout, sendOtp } = useAuth();
  
  // Master Admin check
  const isMasterAdmin = 
    user?.email?.toLowerCase() === 'mfb.15@icloud.com' || 
    user?.email?.toLowerCase() === 'mfb-15@hotmail.com' || 
    user?.email?.toLowerCase() === 'mfb.15.f@gmail.com' || 
    user?.role === 'admin' ||
    user?.role === 'staff';

  // Active Tab for Admin Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'requests' | 'payments' | 'portfolio' | 'staff'>('home');

  // Live Data States
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [portfolioList, setPortfolioList] = useState<PortfolioProject[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Quote Details & Action Modal
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [modalAgreedPrice, setModalAgreedPrice] = useState<string>('');
  const [modalStaffNotes, setModalStaffNotes] = useState<string>('');
  const [modalRejectionReason, setModalRejectionReason] = useState<string>('');
  const [isSavingQuote, setIsSavingQuote] = useState<boolean>(false);

  // Add Payment Modal (Admin adds payment due for a client project)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState<boolean>(false);
  const [paySelectedUserId, setPaySelectedUserId] = useState<string>('');
  const [paySelectedProjectId, setPaySelectedProjectId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');
  const [isCreatingPayment, setIsCreatingPayment] = useState<boolean>(false);

  // Portfolio Management Modal
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState<boolean>(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioProject | null>(null);
  const [portfolioTitle, setPortfolioTitle] = useState<string>('');
  const [portfolioLink, setPortfolioLink] = useState<string>('');
  const [portfolioImage, setPortfolioImage] = useState<string>('');
  const [isSavingPortfolio, setIsSavingPortfolio] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Add Staff Modal with Email OTP verification (Max 2 staff members)
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [staffStep, setStaffStep] = useState<'input' | 'otp'>('input');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffFullName, setStaffFullName] = useState<string>('');
  const [staffRoleLabel, setStaffRoleLabel] = useState<string>('مشرف إدارة ومطور');
  const [staffOtp, setStaffOtp] = useState<string>('');
  const [isSendingStaffOtp, setIsSendingStaffOtp] = useState<boolean>(false);
  const [isVerifyingStaffOtp, setIsVerifyingStaffOtp] = useState<boolean>(false);
  const [staffErrorMsg, setStaffErrorMsg] = useState<string>('');
  const [staffSuccessMsg, setStaffSuccessMsg] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const unsubQ = subscribeQuotes(setQuotes);
    const unsubProj = subscribeProjects(setProjects);
    const unsubPay = subscribePayments(setPayments);
    const unsubStaff = subscribeStaff(setStaffList);
    const unsubPort = subscribePortfolioProjects(setPortfolioList);
    setAllUsers(getAllUserProfiles());

    return () => {
      unsubQ();
      unsubProj();
      unsubPay();
      unsubStaff();
      unsubPort();
    };
  }, []);

  useEffect(() => {
    setAllUsers(getAllUserProfiles());
  }, [quotes, staffList]);

  // When client changes in Add Payment Modal, filter projects & reset selection
  const clientProjects = useMemo(() => {
    if (!paySelectedUserId) return [];
    return projects.filter(p => p.userId === paySelectedUserId);
  }, [paySelectedUserId, projects]);

  const handleClientSelectChange = (userId: string) => {
    setPaySelectedUserId(userId);
    setPaySelectedProjectId('');
    setPayAmount('');
  };

  const handleProjectSelectChange = (projId: string) => {
    setPaySelectedProjectId(projId);
    const selectedProj = projects.find(p => p.id === projId);
    if (selectedProj && selectedProj.agreedPrice) {
      setPayAmount(selectedProj.agreedPrice.toString());
    } else {
      setPayAmount('');
    }
  };

  // Handle Opening Quote Modal
  const openQuoteModal = (q: QuoteRequest) => {
    setSelectedQuote(q);
    setModalAgreedPrice(q.agreedPrice ? q.agreedPrice.toString() : '');
    setModalStaffNotes(q.staffNotes || '');
    setModalRejectionReason(q.rejectionReason || '');
  };

  // Save Quote Action: Accept / Reject
  const handleUpdateQuote = async (status: 'accepted' | 'rejected' | 'pending') => {
    if (!selectedQuote) return;
    setIsSavingQuote(true);

    const priceNum = modalAgreedPrice ? parseFloat(convertArabicToEnglishDigits(modalAgreedPrice)) : undefined;

    try {
      await updateQuoteStatus(
        selectedQuote.id,
        status,
        modalStaffNotes,
        priceNum,
        undefined,
        undefined,
        undefined,
        status === 'rejected' ? modalRejectionReason : undefined
      );

      showToast(status === 'accepted' ? 'تم قبول الطلب وتحديد السعر بنجاح' : 'تم رفض الطلب');
      setSelectedQuote(null);
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ التحديث');
    } finally {
      setIsSavingQuote(false);
    }
  };

  // Handle Add Payment for Client
  const handleCreatePaymentDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySelectedUserId || !paySelectedProjectId || !payAmount) {
      showToast('يرجى اختيار العميل والمشروع وتحديد المبلغ');
      return;
    }

    const selectedUser = allUsers.find(u => u.uid === paySelectedUserId);
    const selectedProj = projects.find(p => p.id === paySelectedProjectId);

    if (!selectedUser || !selectedProj) {
      showToast('بيانات العميل أو المشروع غير مكتملة');
      return;
    }

    setIsCreatingPayment(true);
    try {
      await createPaymentInvoice({
        projectId: selectedProj.id,
        projectTitle: selectedProj.title,
        userId: selectedUser.uid,
        userName: selectedUser.fullName || selectedUser.email,
        userEmail: selectedUser.email,
        amount: parseFloat(convertArabicToEnglishDigits(payAmount)),
        note: payNote.trim() || undefined
      });

      showToast('تم إنشاء الدفعة وإرسالها لصفحة سداد العميل بنجاح');
      setIsAddPaymentOpen(false);
      setPaySelectedUserId('');
      setPaySelectedProjectId('');
      setPayAmount('');
      setPayNote('');
    } catch (err: any) {
      showToast(err.message || 'فشل إنشاء الدفعة');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Handle Image Upload for Portfolio
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)');
      return;
    }

    try {
      const compressedData = await compressImageFile(file, 1000, 0.75);
      setPortfolioImage(compressedData);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPortfolioImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Add / Edit Portfolio Project
  const handleOpenPortfolioModal = (item?: PortfolioProject) => {
    if (item) {
      setEditingPortfolioItem(item);
      setPortfolioTitle(item.title);
      setPortfolioLink(item.linkUrl);
      setPortfolioImage(item.imageUrl);
    } else {
      setEditingPortfolioItem(null);
      setPortfolioTitle('');
      setPortfolioLink('');
      setPortfolioImage('');
    }
    setIsPortfolioModalOpen(true);
  };

  const handleSavePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolioTitle.trim() || !portfolioImage.trim()) {
      showToast('يرجى كتابة اسم المشروع وإرفاق الصورة من الجهاز');
      return;
    }

    setIsSavingPortfolio(true);
    try {
      if (editingPortfolioItem) {
        await updatePortfolioProject(editingPortfolioItem.id, {
          title: portfolioTitle.trim(),
          linkUrl: portfolioLink.trim(),
          imageUrl: portfolioImage.trim()
        });
        showToast('تم تحديث بيانات المشروع بالمعرض بنجاح');
      } else {
        await addPortfolioProject({
          title: portfolioTitle.trim(),
          linkUrl: portfolioLink.trim(),
          imageUrl: portfolioImage.trim()
        });
        showToast('تم إضافة المشروع لمعرض أعمالنا بنجاح');
      }
      setIsPortfolioModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ المشروع');
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    try {
      await deletePortfolioProject(id);
      setPortfolioList(prev => prev.filter(p => p.id !== id));
      showToast('تم حذف المشروع من المعرض بنجاح');
    } catch (err: any) {
      showToast(err.message || 'فشل حذف المشروع');
    }
  };

  // Step 1: Send real OTP to staff email
  const handleSendStaffOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = staffEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStaffErrorMsg('يرجى إدخال بريد إلكتروني صحيح للموظف');
      return;
    }
    if (staffList.length >= 2) {
      setStaffErrorMsg('تم الوصول للحد الأقصى لعدد الموظفين (2 موظفين)');
      return;
    }

    setIsSendingStaffOtp(true);
    setStaffErrorMsg('');
    setStaffSuccessMsg('');

    try {
      const res = await sendOtp(cleanEmail);
      setStaffSuccessMsg(res.message || `تم إرسال رمز التحقق بنجاح إلى ${cleanEmail}`);
      setStaffStep('otp');
    } catch (err: any) {
      setStaffErrorMsg(err.message || 'فشل إرسال رمز التحقق للبريد');
    } finally {
      setIsSendingStaffOtp(false);
    }
  };

  // Step 2: Verify OTP and Add Staff Member (without modifying the current admin's logged-in session)
  const handleVerifyAndAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = staffEmail.trim().toLowerCase();
    const cleanOtp = staffOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setStaffErrorMsg('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setIsVerifyingStaffOtp(true);
    setStaffErrorMsg('');

    try {
      // 1. Verify OTP with server API directly (does NOT log out the current admin)
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
      });

      let data: any = null;
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(`استجابة غير صالحة من الخادم (${res.status})`);
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || data?.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
      }

      // 2. Add staff member to database & grant full admin permissions
      const newStaff = await addStaffMember({
        fullName: staffFullName.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: '',
        role: 'admin',
        roleLabel: staffRoleLabel.trim() || 'مشرف إدارة ومطور',
        department: 'قسم الإدارة والبرمجة',
        status: 'active',
        assignedProjectsCount: 0
      });

      // Update local state immediately
      setStaffList(prev => [newStaff, ...prev.filter(s => s.email.toLowerCase() !== cleanEmail)]);

      showToast(`تم التحقق من الرمز وتعيين ${cleanEmail} كموظف بصلاحيات كاملة!`);
      setIsAddStaffOpen(false);
      setStaffStep('input');
      setStaffEmail('');
      setStaffFullName('');
      setStaffOtp('');
      setStaffErrorMsg('');
      setStaffSuccessMsg('');
    } catch (err: any) {
      setStaffErrorMsg(err.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
    } finally {
      setIsVerifyingStaffOtp(false);
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = async (id: string) => {
    try {
      await deleteStaffMember(id);
      setStaffList(prev => prev.filter(s => s.id !== id));
      showToast('تم إلغاء صلاحيات الموظف بنجاح');
    } catch (err: any) {
      showToast(err.message || 'فشل إلغاء صلاحيات الموظف');
    }
  };

  // Metrics
  const totalPaidRevenue = payments
    .filter(p => p.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingQuotesCount = quotes.filter(q => q.status === 'pending').length;
  const pendingReceiptsCount = payments.filter(p => p.status === 'pending').length;

  // FULL PAGE VIEW WHEN A QUOTE IS SELECTED IN ADMIN
  if (selectedQuote) {
    const orderCode = selectedQuote.orderCode || getOrderCodeForQuote(selectedQuote.id);
    const clientProfile = allUsers.find(u => u.uid === selectedQuote.userId || u.email.toLowerCase() === selectedQuote.userEmail?.toLowerCase());
    const realName = clientProfile?.fullName || selectedQuote.userName || selectedQuote.userEmail;
    const realPhone = clientProfile?.phone || selectedQuote.userPhone || '';
    const cleanDigits = convertArabicToEnglishDigits(realPhone).replace(/[^0-9]/g, '');
    const waNumber = cleanDigits.startsWith('966') ? cleanDigits : (cleanDigits.startsWith('05') ? '966' + cleanDigits.substring(1) : cleanDigits);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 font-['Tajawal',sans-serif] relative overflow-x-hidden" dir="rtl">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <button
              onClick={() => setSelectedQuote(null)}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              <span>العودة لقائمة الطلبات</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                #{orderCode}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {selectedQuote.serviceTypeLabel || 'طلب برمجة'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-right">
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <h1 className="text-2xl font-black text-slate-900">{selectedQuote.title}</h1>
              <p className="text-xs text-slate-500">اسم صاحب الطلب: <strong className="text-slate-900">{realName}</strong></p>
            </div>

            {/* Client Contact Info */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
              <span className="font-extrabold text-slate-800 text-sm block">بيانات العميل والتواصل:</span>
              <div className="flex flex-wrap items-center gap-4 text-slate-700 font-bold">
                <span>اسم العميل: {realName}</span>
                {realPhone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono">رقم الجوال: {realPhone}</span>
                  </>
                )}
              </div>

              {realPhone && (
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-xs text-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>محادثة واتساب ({realPhone})</span>
                  </a>
                  <a
                    href={`tel:${realPhone}`}
                    className="px-4 py-2.5 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-200 text-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>اتصال هاتفي</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm space-y-2">
              <span className="font-bold text-slate-800 block text-sm">تفاصيل الفكرة والمواصفات:</span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{selectedQuote.details}</p>
            </div>

            {/* Price & Approval Form */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">السعر المتفق عليه النهائي (ر.س)</label>
                <input
                  type="number"
                  value={modalAgreedPrice}
                  onChange={(e) => setModalAgreedPrice(e.target.value)}
                  placeholder="مثال: 18000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">ملاحظات الإدارة / تفاصيل الاتفاق</label>
                <textarea
                  rows={3}
                  value={modalStaffNotes}
                  onChange={(e) => setModalStaffNotes(e.target.value)}
                  placeholder="اكتب ملاحظات العرض ومواعيد التسليم..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">سبب الاعتذار (في حال رفض الطلب)</label>
                <input
                  type="text"
                  value={modalRejectionReason}
                  onChange={(e) => setModalRejectionReason(e.target.value)}
                  placeholder="اكتب سبب الاعتذار للعميل إن وجد..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  disabled={isSavingQuote}
                  onClick={() => handleUpdateQuote('accepted')}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-100 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>قبول الطلب</span>
                </button>

                <button
                  disabled={isSavingQuote}
                  onClick={() => handleUpdateQuote('rejected')}
                  className="px-6 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>الاعتذار عن الطلب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32 font-['Tajawal',sans-serif] relative overflow-x-hidden selection:bg-indigo-500 selection:text-white" dir="rtl">
      
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-80 right-10 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        {/* Minimal Top Bar with Logout Button */}
        <div className="flex items-center justify-end pb-2 border-b border-slate-200/80">
          <button
            onClick={logout}
            className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW (HOME) */}
        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-400">إجمالي الطلبات</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-slate-900">{quotes.length}</span>
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-400">طلبات بانتظار المراجعة</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-amber-600">{pendingQuotesCount}</span>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-400">إيصالات دفع معلقة</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-emerald-600">{pendingReceiptsCount}</span>
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-semibold text-slate-400">إجمالي الإيراد المحصل</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-slate-900">{totalPaidRevenue.toLocaleString('ar-SA')} ر.س</span>
                  <DollarSign className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </div>

            {/* Recent Quotes Quick Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>أحدث طلبات البرمجة الواردة</span>
                </h2>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1"
                >
                  <span>عرض الكل ({quotes.length})</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quotes.slice(0, 6).map((q) => {
                  const orderCode = q.orderCode || getOrderCodeForQuote(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => openQuoteModal(q)}
                      className="p-5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 transition-all cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-indigo-600">#{orderCode}</span>
                        {q.status === 'pending' && <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">قيد المراجعة</span>}
                        {q.status === 'accepted' && <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">مقبول</span>}
                        {q.status === 'rejected' && <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md">معتذر عنه</span>}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{q.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{q.userName || q.userEmail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: QUOTE REQUESTS MANAGEMENT */}
        {activeTab === 'requests' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">طلبات البرمجة</h2>
                <p className="text-xs text-slate-500 mt-1">انقر على أي طلب لتحديد السعر المتفق عليه وقبوله أو الاعتذار</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {quotes.map((quote) => {
                const orderCode = quote.orderCode || getOrderCodeForQuote(quote.id);
                return (
                  <div
                    key={quote.id}
                    onClick={() => openQuoteModal(quote)}
                    className="bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <span className="font-mono font-black text-sm">#{orderCode}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{quote.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>العميل: {quote.userName || quote.userEmail}</span>
                          <span>•</span>
                          <span>{quote.serviceTypeLabel || 'تطبيق جوال'}</span>
                          {quote.agreedPrice && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 font-bold">السعر: {quote.agreedPrice.toLocaleString('ar-SA')} ر.س</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {quote.status === 'pending' && (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                          قيد المراجعة
                        </span>
                      )}
                      {quote.status === 'accepted' && (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                          تم القبول
                        </span>
                      )}
                      {quote.status === 'rejected' && (
                        <span className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold">
                          تم الاعتذار
                        </span>
                      )}
                      <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 3: PAYMENTS & INVOICES */}
        {activeTab === 'payments' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">المدفوعات وسداد العملاء</h2>
                <p className="text-xs text-slate-500 mt-1">إنشاء الدفعات ومراجعة إيصالات التحويل البنكي والاعتماد</p>
              </div>

              <button
                onClick={() => setIsAddPaymentOpen(true)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer self-start"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة دفعة لعميل</span>
              </button>
            </div>

            {/* Payments List */}
            <div className="space-y-4">
              {payments.length === 0 ? (
                <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
                  <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-xs font-bold">لا توجد دفعات منشأة حالياً</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {payments.map((pay) => (
                    <div
                      key={pay.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {pay.id}
                          </span>
                          <span className="text-xs font-bold text-slate-400">المشروع: {pay.projectTitle}</span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">{pay.userName || pay.userEmail}</h3>
                        <p className="text-xs text-slate-500">
                          المبلغ المطلوب: <strong className="text-indigo-700 text-sm font-black">{pay.amount.toLocaleString('ar-SA')} ر.س</strong>
                        </p>
                        {pay.senderName && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 space-y-1">
                            <div>اسم المحول: <strong>{pay.senderName}</strong> | البنك: <strong>{pay.bankName}</strong></div>
                            <div>الرقم المرجعي: <span className="font-mono">{pay.referenceNumber || '-'}</span> | التاريخ: {pay.transferDate}</div>
                            {pay.receiptImage && (
                              <a
                                href={pay.receiptImage}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-600 font-bold mt-1 underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>عرض صورة إيصال التحويل المرفق</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3 self-end md:self-center">
                        {pay.status === 'due' && (
                          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                            بانتظار سداد العميل
                          </span>
                        )}

                        {pay.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold">
                              تم إرفاق الإيصال
                            </span>
                            <button
                              onClick={() => approveOrRejectPayment(pay.id, 'approved')}
                              title="اعتماد الإيصال ✓"
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => approveOrRejectPayment(pay.id, 'rejected')}
                              title="رفض الإيصال ✕"
                              className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {pay.status === 'approved' && (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>تم التحقق والاعتماد ✓</span>
                          </span>
                        )}

                        {pay.status === 'rejected' && (
                          <span className="px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>تم رفض الإيصال</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: PORTFOLIO MANAGEMENT */}
        {activeTab === 'portfolio' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">معرض أعمالنا</h2>
              </div>

              <button
                onClick={() => handleOpenPortfolioModal()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer self-start"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مشروع للمعرض</span>
              </button>
            </div>

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                      {item.linkUrl && (
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>رابط المشروع</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenPortfolioModal(item)}
                        className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer"
                        title="تعديل المشروع"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePortfolio(item.id)}
                        className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                        title="حذف المشروع"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 5: STAFF & TEAM MANAGEMENT */}
        {activeTab === 'staff' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">فريق العمل والموظفين</h2>
                <p className="text-xs text-slate-500 mt-1">
                  إدارة الموظفين ومنحهم الصلاحيات الإدارية الكاملة (الموظفون المضافون: {staffList.length} من أصل 2 كحد أقصى)
                </p>
              </div>

              {isMasterAdmin && (
                staffList.length >= 2 ? (
                  <button
                    disabled
                    className="px-5 py-3 bg-slate-200 text-slate-400 font-bold text-xs rounded-xl border border-slate-300 cursor-not-allowed flex items-center gap-2 self-start shadow-none"
                    title="تم الوصول للحد الأقصى لعدد الموظفين (2/2)"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تعيين موظف (الحد الأقصى: 2/2)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsAddStaffOpen(true);
                      setStaffStep('input');
                      setStaffEmail('');
                      setStaffFullName('');
                      setStaffOtp('');
                      setStaffErrorMsg('');
                      setStaffSuccessMsg('');
                    }}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer self-start active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تعيين موظف ({staffList.length}/2)</span>
                  </button>
                )
              )}
            </div>

            {/* Staff List */}
            {staffList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <User className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-sm font-semibold">لم يتم إضافة موظفين بعد (يمكنك تعيين حتى موظفين اثنين كحد أقصى عبر التحقق بالبريد)</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffList.map((stf) => (
                  <div
                    key={stf.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-base flex items-center justify-center">
                        {stf.fullName ? stf.fullName.charAt(0).toUpperCase() : 'M'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-extrabold text-slate-900 truncate">{stf.fullName}</h3>
                        <p className="text-xs text-slate-500 truncate" dir="ltr">{stf.email}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                      <div className="text-slate-500">المسمى: <strong className="text-slate-900">{stf.roleLabel || 'مشرف إدارة'}</strong></div>
                      <div className="text-slate-500">الصلاحيات: <span className="text-indigo-700 font-bold">لوحة تحكم إدارية كاملة</span></div>
                      <div className="text-slate-500">الحالة: <span className="text-emerald-700 font-bold">نشط ومفعل</span></div>
                    </div>

                    {isMasterAdmin && (
                      <button
                        onClick={() => handleDeleteStaff(stf.id)}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>إلغاء صلاحيات الموظف</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* FLOATING GLASS BOTTOM NAVIGATION BAR FOR ADMIN & STAFF (ICON ONLY WITH SPRING PILL) */}
      <div 
        className="fixed bottom-4 sm:bottom-6 inset-x-0 z-50 flex justify-center items-center px-4 pointer-events-none select-none font-['Tajawal',sans-serif]"
        dir="rtl"
        style={{
          paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        }}
      >
        <motion.nav 
          initial={{ y: 60, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8
          }}
          className="pointer-events-auto relative flex items-center gap-2 sm:gap-3 p-1.5 bg-slate-900/80 backdrop-blur-3xl border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.12)_inset] rounded-full ring-1 ring-black/40"
        >
          {/* Subtle Specular Top Highlight (iOS style) */}
          <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

          {[
            { id: 'home', label: 'الرئيسية', icon: Home },
            { id: 'requests', label: 'الطلبات', icon: FileText },
            { id: 'payments', label: 'الدفعات', icon: CreditCard },
            { id: 'portfolio', label: 'المعرض', icon: Layers },
            { id: 'staff', label: 'الموظفين', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                whileTap={{ scale: 0.86 }}
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                title={item.label}
                className={`relative flex items-center justify-center p-3 sm:p-3.5 rounded-full cursor-pointer transition-colors duration-200 outline-none ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                role="tab"
                aria-selected={isActive}
              >
                {/* Sliding Active Pill Background with Spring Physics */}
                {isActive && (
                  <motion.div
                    layoutId="admin-nav-active-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 shadow-[0_4px_20px_rgba(99,102,241,0.5),0_0_0_1px_rgba(255,255,255,0.3)_inset]"
                    transition={{
                      type: "spring",
                      stiffness: 480,
                      damping: 34,
                      mass: 0.75,
                    }}
                  />
                )}

                {/* Icon Container with micro-scale and spring on active */}
                <motion.div
                  className="relative z-10 flex items-center justify-center"
                  animate={isActive ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                >
                  <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]' : 'text-slate-400'}`} />
                </motion.div>

                {/* Glowing Active Indicator Dot underneath */}
                {isActive && (
                  <motion.span
                    layoutId="admin-nav-active-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.nav>
      </div>

      {/* MODAL 2: ADD PAYMENT DUE FOR CLIENT */}
      <AnimatePresence>
        {isAddPaymentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">إضافة دفعة</h3>
                <button onClick={() => setIsAddPaymentOpen(false)} className="p-2 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePaymentDue} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">1. اختر العميل</label>
                  <select
                    required
                    value={paySelectedUserId}
                    onChange={(e) => handleClientSelectChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- اختر العميل --</option>
                    {allUsers.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.fullName || 'عميل بدون اسم'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">2. اختر مشروع العميل</label>
                  <select
                    required
                    disabled={!paySelectedUserId}
                    value={paySelectedProjectId}
                    onChange={(e) => handleProjectSelectChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="">{paySelectedUserId ? '-- اختر المشروع التابع للعميل --' : '-- اختر العميل أولاً --'}</option>
                    {clientProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} (السعر: {p.agreedPrice?.toLocaleString('ar-SA')} ر.س)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">3. مبلغ الدفعة (ر.س - تلقائي من المشروع)</label>
                  <input
                    type="number"
                    required
                    readOnly
                    value={payAmount}
                    placeholder="يتم تعبئته تلقائياً عند اختيار المشروع"
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-indigo-700 font-black text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">ملاحظة أو وصف الدفعة (اختياري)</label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="مثال: الدفعة الأولى عند البدء"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isCreatingPayment}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer"
                  >
                    {isCreatingPayment ? 'جاري الحفظ...' : 'إنشاء الدفعة وإرسالها للعميل'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: PORTFOLIO ADD / EDIT WITH IMAGE UPLOAD FROM DEVICE */}
      <AnimatePresence>
        {isPortfolioModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">
                  {editingPortfolioItem ? 'تعديل مشروع بالمعرض' : 'إضافة مشروع جديد للمعرض'}
                </h3>
                <button onClick={() => setIsPortfolioModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePortfolio} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">اسم المشروع</label>
                  <input
                    type="text"
                    required
                    value={portfolioTitle}
                    onChange={(e) => setPortfolioTitle(e.target.value)}
                    placeholder="مثال: تطبيق توصيل الطلبات السريعة"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">رابط المشروع أو المتجر (اختياري)</label>
                  <input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    dir="ltr"
                  />
                </div>

                {/* Device Image Upload */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800">
                    صورة المشروع (إرفاق من الجهاز بجودة عالية) <span className="text-[11px] font-normal text-slate-500">(المقاس المفضل: 1280×720 بكسل أو بنسبة 16:9)</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {portfolioImage ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 group">
                      <img src={portfolioImage} alt="معاينة" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 font-bold transition-opacity"
                      >
                        <Upload className="w-4 h-4" />
                        <span>تغيير الصورة</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 text-slate-500 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Upload className="w-6 h-6 text-indigo-600" />
                      <span className="font-bold text-xs text-slate-700">اضغط هنا لإرفاق الصورة من جهازك</span>
                      <span className="text-[11px] text-slate-400">PNG, JPG, WebP بدقة عالية</span>
                    </button>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSavingPortfolio}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer"
                  >
                    {isSavingPortfolio ? 'جاري الحفظ...' : 'حفظ المشروع بالمعرض'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: ADD STAFF WITH REAL EMAIL OTP VERIFICATION */}
      <AnimatePresence>
        {isAddStaffOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 text-right"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">تعيين موظف جديد</h3>
                  <p className="text-xs text-slate-500 mt-0.5">التحقق بالبريد الإلكتروني الحقيقي (الحد الأقصى: 2)</p>
                </div>
                <button 
                  onClick={() => setIsAddStaffOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {staffErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{staffErrorMsg}</span>
                </div>
              )}

              {staffSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{staffSuccessMsg}</span>
                </div>
              )}

              {staffStep === 'input' ? (
                <form onSubmit={handleSendStaffOtp} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">البريد الإلكتروني للموظف</label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="employee@example.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">اسم الموظف</label>
                    <input
                      type="text"
                      value={staffFullName}
                      onChange={(e) => setStaffFullName(e.target.value)}
                      placeholder="مثال: عبد الله محمد"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">المسمى الوظيفي</label>
                    <input
                      type="text"
                      required
                      value={staffRoleLabel}
                      onChange={(e) => setStaffRoleLabel(e.target.value)}
                      placeholder="مثال: مشرف إدارة ومطور برمجيات"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={isSendingStaffOtp}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSendingStaffOtp ? (
                        <span>جاري إرسال رمز التحقق...</span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>إرسال رمز التحقق للبريد</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyAndAddStaff} className="space-y-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs">
                    تم إرسال رمز تحقق مكوّن من 6 أرقام إلى: <strong className="text-slate-900 block mt-1 font-mono" dir="ltr">{staffEmail}</strong>
                    يرجى إدخال الرمز لتأكيد التعيين وتفعيل صلاحيات الإدارة للموظف.
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">رمز التحقق (6 أرقام)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={staffOtp}
                      onChange={(e) => setStaffOtp(convertArabicToEnglishDigits(e.target.value).replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-indigo-500 rounded-xl text-indigo-900 text-center font-mono font-black text-2xl tracking-[8px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStaffStep('input')}
                      className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      رجوع
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifyingStaffOtp || staffOtp.length !== 6}
                      className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isVerifyingStaffOtp ? (
                        <span>جاري التحقق والتعيين...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>تأكيد الرمز وتعيين الموظف</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
