import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageCircle, 
  Sparkles, 
  X,
  ChevronLeft,
  Smartphone,
  PhoneCall
} from 'lucide-react';
import { QuoteRequest } from '../types';
import { subscribeQuotes, getOrderCodeForQuote } from '../lib/db';
import { useAuth } from '../context/AuthContext';

export const RequestsPage: React.FC<{ navigate: (p: string) => void }> = ({ navigate }) => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);

  useEffect(() => {
    const unsubQuotes = subscribeQuotes((allQuotes) => {
      if (user) {
        setQuotes(allQuotes.filter(q => q.userId === user.uid || user.role === 'admin' || user.role === 'staff'));
      } else {
        setQuotes(allQuotes);
      }
    });

    return () => {
      unsubQuotes();
    };
  }, [user]);

  // FULL PAGE VIEW WHEN A QUOTE IS SELECTED
  if (selectedQuote) {
    const orderCode = selectedQuote.orderCode || getOrderCodeForQuote(selectedQuote.id);
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right font-['Tajawal',sans-serif]" dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={() => setSelectedQuote(null)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>العودة لجميع الطلبات</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              #{orderCode}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              {selectedQuote.serviceTypeLabel || 'طلب برمجة'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-3 border-b border-slate-100 pb-6">
            <h1 className="text-2xl font-black text-slate-900">{selectedQuote.title}</h1>
            
            <div>
              {selectedQuote.status === 'pending' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                  <Clock className="w-4 h-4 animate-spin text-amber-600" />
                  <span>حالة الطلب: قيد المراجعة والدراسة الفنية</span>
                </div>
              )}
              {selectedQuote.status === 'accepted' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>حالة الطلب: تم قبول الطلب والاتفاق</span>
                </div>
              )}
              {selectedQuote.status === 'rejected' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>حالة الطلب: تم الاعتذار عن التنفيذ</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Details */}
          {selectedQuote.agreedPrice ? (
            <div className="p-5 bg-gradient-to-r from-indigo-50 to-teal-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-indigo-900">السعر المعتمد النهائي</span>
                <span className="text-xs text-indigo-600 mt-0.5 block">تم التحديد بعد التواصل والاتفاق</span>
              </div>
              <span className="text-3xl font-black text-indigo-700">
                {selectedQuote.agreedPrice.toLocaleString('ar-SA')} ر.س
              </span>
            </div>
          ) : selectedQuote.status === 'accepted' ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 font-medium">
              جاري إعداد وتحديد السعر النهائي من قِبل الإدارة بعد استكمال التواصل.
            </div>
          ) : null}

          {/* Details & Platforms */}
          <div className="space-y-6 text-xs text-slate-700">
            {selectedQuote.platforms && selectedQuote.platforms.length > 0 && (
              <div>
                <span className="font-extrabold text-slate-900 text-sm block mb-2">الأنظمة والمستهدفات:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedQuote.platforms.map((p, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl font-bold border border-slate-200/80">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="font-extrabold text-slate-900 text-sm block mb-2">تفاصيل الفكرة والمواصفات:</span>
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {selectedQuote.details}
              </div>
            </div>

            {selectedQuote.staffNotes && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-emerald-950 block text-sm">ملاحظات الإدارة وفريق العمل:</span>
                <p className="text-emerald-900 leading-relaxed text-xs sm:text-sm">{selectedQuote.staffNotes}</p>
              </div>
            )}

            {selectedQuote.rejectionReason && (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-rose-950 block text-sm">سبب الاعتذار:</span>
                <p className="text-rose-900 leading-relaxed text-xs sm:text-sm">{selectedQuote.rejectionReason}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setSelectedQuote(null)}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
            >
              العودة لقائمة الطلبات
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right font-['Tajawal',sans-serif]" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">طلبات البرمجة</h1>
          <p className="text-xs text-slate-500 mt-1">متابعة حالة طلباتك والأسعار المعتمدة</p>
        </div>

        <button
          onClick={() => navigate('/quote-request')}
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>تقديم عرض برمجه</span>
        </button>
      </div>

      {/* QUOTE REQUESTS LIST */}
      <div className="space-y-4">
        {quotes.length === 0 ? (
          <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">لا توجد طلبات برمجة حالياً</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">اضغط على زر "تقديم عرض برمجه" لتحديد تفاصيل تطبيقك أو موقعك الإلكتروني</p>
            <button
              onClick={() => navigate('/quote-request')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              تقديم عرض برمجه الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {quotes.map((quote, idx) => {
              const orderCode = quote.orderCode || getOrderCodeForQuote(quote.id);
              return (
                <motion.div 
                  key={quote.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedQuote(quote)}
                  className="bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <span className="font-mono font-black text-sm">#{orderCode}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {quote.title}
                      </h3>
                      <span className="text-xs text-slate-400 font-semibold mt-0.5 block">
                        {quote.serviceTypeLabel || 'تطبيق جوال'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    {quote.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        <span>قيد المراجعة</span>
                      </span>
                    )}

                    {quote.status === 'accepted' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تم القبول</span>
                      </span>
                    )}

                    {quote.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>تم الاعتذار</span>
                      </span>
                    )}

                    <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:-translate-x-1" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
