import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  ShieldCheck, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { BANK_ACCOUNTS } from '../lib/mockData';
import { Project, PaymentReceipt } from '../types';
import { subscribeProjects, subscribePayments, submitPaymentReceipt } from '../lib/db';
import { useAuth } from '../context/AuthContext';

export const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [receiptNote, setReceiptNote] = useState<string>('');

  const [copiedIban, setCopiedIban] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const rajhiAccount = BANK_ACCOUNTS[0];

  useEffect(() => {
    const unsubP = subscribeProjects((allProjects) => {
      if (user) {
        const userProjs = allProjects.filter(p => p.userId === user.uid || user.role === 'admin' || user.role === 'staff');
        setProjects(userProjs);
        if (userProjs.length > 0 && !selectedProjectId) {
          setSelectedProjectId(userProjs[0].id);
          setAmount(userProjs[0].agreedPrice.toString());
        }
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIban(text);
    setTimeout(() => setCopiedIban(null), 2000);
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !senderName || !amount || !referenceNumber) {
      setErrorMsg('يرجى تعبئة كافة الحقول المطلوبة بما في ذلك اسم المحول والرقم المرجعي');
      return;
    }

    const matchedProject = projects.find(p => p.id === selectedProjectId);
    if (!matchedProject) {
      setErrorMsg('يرجى تحديد المشروع المترابط مع التحويل');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await submitPaymentReceipt({
        projectId: matchedProject.id,
        projectTitle: matchedProject.title,
        userId: user?.uid || 'user-demo-1',
        userName: user?.fullName || 'عميل برمجيات',
        amount: parseFloat(amount),
        bankName: rajhiAccount.bankName,
        senderName: senderName.trim(),
        referenceNumber: referenceNumber.trim(),
        transferDate,
        receiptNote: receiptNote.trim()
      });

      setSuccessMsg('تم رفع إيصال التحويل بنجاح وسوف يتم إرسال الطلب للإدارة للمراجعة والاعتماد.');
      setSenderName('');
      setReferenceNumber('');
      setReceiptNote('');

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرفاق الإيصال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-right font-['Tajawal',sans-serif]" dir="rtl">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <h1 className="text-3xl font-black text-slate-900">سداد الدفعات والتحويل البنكي</h1>
      </div>

      {projects.length === 0 ? (
        /* EMPTY PAYMENTS STATE */
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
            <CreditCard className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">لا توجد دفعات مستحقة حالياً</h2>
          <p className="text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
            ستظهر الدفعات هنا تلقائياً بعد التقديم على طلب عرض سعر والاتفاق مع الإدارة على تفاصيل ومبلغ المشروع.
          </p>
        </div>
      ) : (
        /* ACTIVE PAYMENTS FORM & BANK DISPLAY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* BANK ACCOUNT DISPLAY (Al Rajhi Only) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>بيانات الحساب البنكي للتحويل</span>
              </h2>

              <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-4 relative">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                  <span className="font-black text-indigo-950 text-base">{rajhiAccount.bankName}</span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-indigo-600 text-white rounded-full">حساب رسمي</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div>اسم الحساب: <span className="font-bold text-slate-900">{rajhiAccount.accountName}</span></div>
                  <div>رقم الحساب: <span className="font-mono font-bold text-slate-900" dir="ltr">{rajhiAccount.accountNumber}</span></div>
                </div>

                {/* IBAN Copy Box */}
                <div className="pt-2">
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">رقم الآيبان (IBAN):</span>
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-300 font-mono text-xs font-bold text-indigo-900 shadow-xs" dir="ltr">
                    <button 
                      type="button"
                      onClick={() => handleCopy(rajhiAccount.iban)}
                      className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors flex items-center gap-1 font-sans text-xs font-bold cursor-pointer"
                    >
                      {copiedIban === rajhiAccount.iban ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedIban === rajhiAccount.iban ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                    <span className="truncate">{rajhiAccount.iban}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1">
                <span className="font-bold block text-slate-900">ملاحظة:</span>
                <p>بعد التحويل، ارفق بيانات الإيصال أدناه وسوف يصل الطلب كاملاً للإدارة فوراً.</p>
              </div>
            </div>
          </div>

          {/* RECEIPT FORM */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <span>ارفاق إيصال التحويل</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">قم بإدخال بيانات التحويل المالي وتأكيده</p>
              </div>

              {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReceipt} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">اختر المشروع المحدد للدفع</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      const p = projects.find(proj => proj.id === e.target.value);
                      if (p) setAmount(p.agreedPrice.toString());
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} - (المبلغ: {p.agreedPrice.toLocaleString('ar-SA')} ر.س)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">اسم المحوّل (صاحب الحساب)</label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="مثال: عبدالله السلمان"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">المبلغ المحول (ر.س)</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="18500"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">الرقم المرجعي لعملية التحويل</label>
                  <input
                    type="text"
                    required
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="مثال: TRX-9820011"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">ملاحظات الإيصال (اختياري)</label>
                  <input
                    type="text"
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    placeholder="ملاحظات إضافية حول عملية التحويل..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                  <span>إرسال الإيصال للإدارة</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* TRANSACTION HISTORY TABLE */}
      {payments.length > 0 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>سجل الإيصالات المرفوعة</span>
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
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900">{p.projectTitle}</td>
                    <td className="p-3 text-slate-700">{p.senderName}</td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{p.amount.toLocaleString('ar-SA')} ر.س</td>
                    <td className="p-3 font-mono text-slate-500">{p.referenceNumber}</td>
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
                          <span>مقبول ومرسخ</span>
                        </span>
                      )}
                      {p.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>مرفوض</span>
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
