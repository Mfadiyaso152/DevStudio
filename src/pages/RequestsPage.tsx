import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageCircle, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  FileCode2, 
  ArrowLeft 
} from 'lucide-react';
import { QuoteRequest, Project } from '../types';
import { subscribeQuotes, subscribeProjects } from '../lib/db';
import { useAuth } from '../context/AuthContext';

export const RequestsPage: React.FC<{ navigate: (p: string) => void }> = ({ navigate }) => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const unsubQuotes = subscribeQuotes((allQuotes) => {
      if (user) {
        setQuotes(allQuotes.filter(q => q.userId === user.uid || user.role === 'admin' || user.role === 'staff'));
      } else {
        setQuotes(allQuotes);
      }
    });

    const unsubProjects = subscribeProjects((allProjects) => {
      if (user) {
        setProjects(allProjects.filter(p => p.userId === user.uid || user.role === 'admin' || user.role === 'staff'));
      } else {
        setProjects(allProjects);
      }
    });

    return () => {
      unsubQuotes();
      unsubProjects();
    };
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-right font-['Tajawal',sans-serif]" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">طلباتي ومشاريعي البرمجية</h1>
        </div>

        <button
          onClick={() => navigate('/quote-request')}
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>تقديم طلب سعر جديد</span>
        </button>
      </div>

      {/* SECTION 1: QUOTE REQUESTS LIST */}
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          <span>عروض الأسعار المقدمة</span>
        </h2>

        {quotes.length === 0 ? (
          <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">لا توجد طلبات عروض أسعار حالياً</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">اضغط على زر "طلب عرض سعر" لتحديد تفاصيل تطبيقك أو موقعك الإلكتروني</p>
            <button
              onClick={() => navigate('/quote-request')}
              className="px-6 py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              طلب عرض سعر الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {quotes.map((quote, idx) => {
              const matchedProject = projects.find(p => p.quoteId === quote.id);

              return (
                <motion.div 
                  key={quote.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 md:p-8 space-y-6 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {quote.serviceTypeLabel || 'تطبيق جوال'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">#{quote.id}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{quote.title}</h3>
                    </div>

                    {/* Status badge */}
                    <div>
                      {quote.status === 'pending' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl text-xs font-extrabold">
                          <Clock className="w-4 h-4 animate-spin text-amber-600" />
                          <span>قيد المراجعة لدى الموظفين</span>
                        </div>
                      )}

                      {quote.status === 'accepted' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-extrabold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>تم قبول عرض السعر والاتفاق</span>
                        </div>
                      )}

                      {quote.status === 'rejected' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-2xl text-xs font-extrabold">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>تم اعتذار عن الطلب</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <span className="block font-semibold text-slate-400">الأنظمة والمستهدفات:</span>
                      <span className="font-bold text-slate-800">{quote.platforms?.join('، ') || 'iOS & Android'}</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-400">الميزانية التقديرية:</span>
                      <span className="font-bold text-slate-800">{quote.expectedBudget || '15,000 - 30,000 ر.س'}</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-400">السعر المتفق عليه النهائي:</span>
                      <span className="font-extrabold text-indigo-700 text-sm">
                        {quote.agreedPrice ? `${quote.agreedPrice.toLocaleString('ar-SA')} ر.س` : 'بانتظار تحديد الموظف بعد التواصل'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-800">تفاصيل الفكرة: </strong> {quote.details}
                  </p>

                  {/* Staff Notes / Post-Acceptance Contact Step */}
                  {quote.status === 'accepted' && (
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <span>تم التواصل والتوافق على التفاصيل!</span>
                        </span>
                        <a
                          href={`https://wa.me/${quote.userPhone.replace(/\s+/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <span>محادثة الواتساب</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-xs text-emerald-900">
                        ملاحظات الموظف: {quote.staffNotes || 'تم الاتفاق مع العميل وتحديد السعر والجدول الزمني للتنفيذ.'}
                      </p>
                    </div>
                  )}

                  {/* ACTIVE PROJECT PROGRESS SECTION */}
                  {matchedProject && (
                    <div className="mt-6 pt-6 border-t border-slate-200 space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-indigo-600" />
                          <span>مراحل خطوات العمل ومستوى الإنجاز</span>
                        </h4>
                        <span className="text-sm font-black text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                          نسبة الإنجاز: {matchedProject.progressPercentage}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${matchedProject.progressPercentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="bg-gradient-to-r from-indigo-600 to-teal-500 h-3 rounded-full"
                        />
                      </div>

                      {/* Project Steps Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {matchedProject.steps.map((st: any, idx: number) => (
                          <div 
                            key={st.id} 
                            className={`p-4 rounded-2xl border text-right space-y-2 ${
                              st.status === 'completed'
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : st.status === 'in_progress'
                                ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black opacity-80">مرحلة {idx + 1}</span>
                              {st.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : st.status === 'in_progress' ? (
                                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <h5 className="font-bold text-xs">{st.title}</h5>
                            <p className="text-[11px] opacity-80 leading-relaxed">{st.description}</p>
                          </div>
                        ))}
                      </div>

                      {/* WARRANTY AND FINAL DELIVERABLES HANDOVER STEP - OPENS FULL PAGE (NO MODAL) */}
                      <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-5 h-5 text-emerald-400" />
                              <h5 className="font-bold text-base">حالة التسليم والضمان البرمجي</h5>
                            </div>
                            <p className="text-xs text-slate-300">
                              {matchedProject.progressPercentage === 100
                                ? 'المشروع مكتمل 100%! يتطلب فتح صفحة الضمان لاستلام الكود والمستودع.'
                                : 'يتم تجهيز الأكواد والملفات للتسليم المباشر عند اكتمال المشروع.'}
                            </p>
                          </div>

                          {matchedProject.progressPercentage === 100 && !matchedProject.warrantyAgreed && (
                            <button
                              onClick={() => navigate(`/warranty?projectId=${matchedProject.id}`)}
                              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>الموافقة على سياسة الضمان وفتح صفحة الكود</span>
                            </button>
                          )}
                        </div>

                        {/* Unlocked Deliverables Card after Warranty Signed */}
                        {matchedProject.warrantyAgreed && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-slate-800 rounded-2xl border border-emerald-500/40 space-y-4">
                            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>تم تأكيد الضمان بنجاح! شفرات المصدر والملفات متاحة للتنزيل الآن:</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {matchedProject.deliverables?.repositoryUrl && (
                                <a
                                  href={matchedProject.deliverables.repositoryUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-3 bg-slate-900 hover:bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-indigo-300 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileCode2 className="w-4 h-4 text-indigo-400" />
                                    <span>مستودع الكود البرمجي (GitHub)</span>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {matchedProject.deliverables?.appDownloadUrl && (
                                <a
                                  href={matchedProject.deliverables.appDownloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-3 bg-slate-900 hover:bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-teal-300 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Download className="w-4 h-4 text-teal-400" />
                                    <span>تحميل تطبيق الجوال (APK/IPA)</span>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>

                    </div>
                  )}

                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
