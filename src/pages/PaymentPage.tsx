import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Building2, 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  Check, 
  Sparkles, 
  FileText,
  AlertCircle,
  X,
  ArrowLeft
} from 'lucide-react';
import { BANK_ACCOUNTS } from '../lib/mockData';
import { Project, PaymentReceipt } from '../types';
import { subscribeProjects, subscribePayments, submitPaymentReceipt } from '../lib/db';
import { useAuth } from '../context/AuthContext';

export const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);

  // Selected payment for "سداد"
  const [payingPayment, setPayingPayment] = useState<PaymentReceipt | null>(null);

  // Form State
  const [senderName, setSenderName] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiptNote, setReceiptNote] = useState<string>('');

  const [copiedIban, setCopiedIban] = useState<string | null>(null);
  const [copiedAcc, setCopiedAcc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const rajhiAccount = BANK_ACCOUNTS[0];

  useEffect(() => {
    const unsubP = subscribeProjects((allProjects) => {
      if (user) {
        const userProjs = allProjects.filter(p => p.userId === user.uid || user.role === 'admin' || user.role === 'staff');
        setProjects(userProjs);
      }
    });

    const unsubPay = subscribePayments((allPayments) => {
      if (user) {
        setPayments(allPayments.filter(p => p.userId === user.uid || user.role === 'admin' || user.role === 'staff'));
      } else {
        setPayments(allPayments);
      }
    });

    return () => {
      unsubP();
      unsubPay();
    };
  }, [user]);

  const handleCopy = (text: string, type: 'iban' | 'acc') => {
    navigator.clipboard.writeText(text);
    if (type === 'iban') {
      setCopiedIban(text);
      setTimeout(() => setCopiedIban(null), 2000);
    } else {
      setCopiedAcc(text);
      setTimeout(() => setCopiedAcc(null), 2000);
    }
  };

  const openPayModal = (payment: PaymentReceipt) => {
    setPayingPayment(payment);
    setSenderName(user?.fullName || '');
    setReferenceNumber('');
    setReceiptNote('');
    setErrorMsg('');
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayment) return;
    if (!senderName.trim() || !referenceNumber.trim()) {
      setErrorMsg('يرجى تعبئة اسم المحوّل والرقم المرجعي للتحويل');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await submitPaymentReceipt(payingPayment.id, {
        senderName: senderName.trim(),
        referenceNumber: referenceNumber.trim(),
        transferDate,
        bankName: rajhiAccount.bankName,
        receiptNote: receiptNote.trim()
      });

      setSuccessMsg('تم رفع إيصال التحويل بنجاح! الإدارة تراجع الدفعة وسيتم الاعتماد فوراً.');
      setPayingPayment(null);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الإيصال');
    } finally {
      setIsLoading(false);
    }
  };

  const duePayments = payments.filter(p => p.status === 'due' || !p.status);
  const otherPayments = payments.filter(p => p.status && p.status !== 'due');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-right font-['Tajawal',sans-serif]" dir="rtl">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-1">
        <h1 className="text-3xl font-black text-slate-900">سداد الدفعات</h1>
        <p className="text-xs text-slate-500">تابع فواتير ودفعات مشاريعك البرمجية وسدد بأمان</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* DUE PAYMENTS SECTION */}
      {duePayments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span>الدفعات المستحقة للسداد ({duePayments.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {duePayments.map((due) => (
              <div 
                key={due.id}
                className="bg-white rounded-3xl p-6 border-2 border-indigo-500/30 hover:border-indigo-500 shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                      بانتظار السداد
                    </span>
                    <span className="text-xs font-mono text-slate-400">#{due.id.slice(-6)}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{due.projectTitle}</h3>
                  <p className="text-xs text-slate-500">{due.receiptNote || 'دفعة مستحقة'}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold">المبلغ المستحق:</span>
                    <span className="text-xl font-black text-indigo-600 font-mono">
                      {due.amount.toLocaleString('ar-SA')} <span className="text-xs font-sans text-slate-500">ر.س</span>
                    </span>
                  </div>

                  <button
                    onClick={() => openPayModal(due)}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>سداد الآن</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: PAY / ATTACH RECEIPT */}
      <AnimatePresence>
        {payingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 shadow-2xl space-y-6 text-right max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black text-slate-900">سداد الدفعة وإرفاق الإيصال</h3>
                  <p className="text-xs text-slate-500">{payingPayment.projectTitle}</p>
                </div>
                <button
                  onClick={() => setPayingPayment(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* BANK DETAILS DISPLAY */}
              <div className="p-5 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-200/50 pb-2.5">
                  <span className="font-black text-indigo-950 text-sm">{rajhiAccount.bankName}</span>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    المبلغ: {payingPayment.amount.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div>اسم الحساب: <span className="font-bold text-slate-900">{rajhiAccount.accountName}</span></div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <span>رقم الحساب: <span className="font-mono font-bold text-slate-900" dir="ltr">{rajhiAccount.accountNumber}</span></span>
                    <button
                      type="button"
                      onClick={() => handleCopy(rajhiAccount.accountNumber, 'acc')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedAcc === rajhiAccount.accountNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAcc === rajhiAccount.accountNumber ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>

                  {/* IBAN */}
                  <div className="pt-2">
                    <span className="block text-[11px] font-semibold text-slate-600 mb-1">الآيبان (IBAN):</span>
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-indigo-300 font-mono text-xs font-bold text-indigo-900" dir="ltr">
                      <button 
                        type="button"
                        onClick={() => handleCopy(rajhiAccount.iban, 'iban')}
                        className="p-1 hover:bg-indigo-50 rounded text-indigo-600 flex items-center gap-1 text-[11px] font-bold cursor-pointer font-sans"
                      >
                        {copiedIban === rajhiAccount.iban ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedIban === rajhiAccount.iban ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                      <span className="truncate">{rajhiAccount.iban}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ATTACH RECEIPT FORM */}
              <form onSubmit={handleSubmitReceipt} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">اسم المحوّل (صاحب الحساب البنكي)</label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="مثال: عبدالله الفهد"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">رقم المرجع / العملية</label>
                    <input
                      type="text"
                      required
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="مثال: 98124401"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">تاريخ التحويل</label>
                    <input
                      type="date"
                      required
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">ملاحظات إضافية (اختياري)</label>
                  <input
                    type="text"
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    placeholder="تم التحويل عبر تطبيق الراجحي..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingPayment(null)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>إرسال الإيصال للإدارة</span>
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EMPTY STATE IF NO PAYMENTS AT ALL */}
      {payments.length === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
            <CreditCard className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">لا توجد دفعات مستحقة حالياً</h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
            ستظهر الدفعات هنا تلقائياً بعد التقديم على طلب برمجة واعتماد المبلغ مع الإدارة.
          </p>
        </div>
      )}

      {/* SUBMITTED PAYMENTS / RECEIPTS TABLE */}
      {otherPayments.length > 0 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>سجل الإيصالات والمدفوعات ({otherPayments.length})</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">المشروع</th>
                  <th className="p-3">اسم المحوّل</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الرقم المرجعي</th>
                  <th className="p-3">حالة الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {otherPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900">{p.projectTitle}</td>
                    <td className="p-3 text-slate-700">{p.senderName || '-'}</td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{p.amount.toLocaleString('ar-SA')} ر.س</td>
                    <td className="p-3 font-mono text-slate-500">{p.referenceNumber || '-'}</td>
                    <td className="p-3">
                      {p.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          <span>قيد المراجعة</span>
                        </span>
                      )}
                      {p.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>معتمد ومقبول ✓</span>
                        </span>
                      )}
                      {p.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>مرفوض ✕</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
