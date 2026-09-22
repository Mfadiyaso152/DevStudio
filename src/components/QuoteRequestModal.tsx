import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Smartphone, 
  Globe, 
  Cpu, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Clock, 
  DollarSign, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ServiceType } from '../types';
import { createQuoteRequest } from '../lib/db';

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

export const QuoteRequestModal: React.FC<QuoteRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted
}) => {
  const { user, openAuthModal } = useAuth();

  // Wizard Steps:
  // 1: Select Service (App / Website / System)
  // 2: Project details & scope
  // 3: Confirmation & Submit
  const [step, setStep] = useState<number>(1);

  const [serviceType, setServiceType] = useState<ServiceType>('app');
  const [platforms, setPlatforms] = useState<string[]>(['iOS', 'Android']);
  const [title, setTitle] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [expectedBudget, setExpectedBudget] = useState<string>('10,000 - 20,000 ر.س');
  const [expectedTimeframe, setExpectedTimeframe] = useState<string>('30 يوم');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handlePlatformToggle = (plat: string) => {
    if (platforms.includes(plat)) {
      if (platforms.length === 1) return; // Keep at least 1
      setPlatforms(platforms.filter(p => p !== plat));
    } else {
      setPlatforms([...platforms, plat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }

    if (!title.trim() || !details.trim()) {
      setErrorMsg('يرجى إدخال عنوان المشروع والتفاصيل المطلوبة');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const labels: Record<ServiceType, string> = {
        app: 'تطبيق جوال',
        website: 'موقع إلكتروني',
        system: 'نظام مخصص'
      };

      await createQuoteRequest({
        userId: user.uid,
        userName: user.fullName,
        userEmail: user.email,
        userPhone: user.phone,
        userEntityType: user.entityType,
        companyName: user.companyName,
        serviceType,
        serviceTypeLabel: labels[serviceType],
        platforms,
        title: title.trim(),
        details: details.trim(),
        expectedBudget,
        expectedTimeframe
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setStep(1);
        setTitle('');
        setDetails('');
        onClose();
        onRequestSubmitted();
      }, 1800);

    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال طلب عرض السعر');
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
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
              طلب عرض سعر برمجيات
            </span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {isSuccess ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">تم تأكيد طلب عرض السعر بنجاح!</h3>
              <p className="text-slate-600 max-w-md mx-auto text-sm">
                سيتواصل معك أحد الموظفين المختصين عبر الواتساب أو الاتصال الهاتفي لدراسة التفاصيل والاتفاق على السعر النهائي.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Select Service Type */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">1. حدد نوع الخدمة البرمجية المطلوبة</h3>
                    <p className="text-xs text-slate-500 mt-1">اختر المنصة الرئيسية التي ترغب بتطويرها</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setServiceType('app');
                        setPlatforms(['iOS', 'Android']);
                      }}
                      className={`p-5 rounded-2xl border-2 text-right transition-all flex flex-col gap-3 ${
                        serviceType === 'app'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${serviceType === 'app' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-base">تطبيق جوال</span>
                        <span className="text-xs text-slate-500">iOS & Android بفريم ورك حديث</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setServiceType('website');
                        setPlatforms(['Web']);
                      }}
                      className={`p-5 rounded-2xl border-2 text-right transition-all flex flex-col gap-3 ${
                        serviceType === 'website'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${serviceType === 'website' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-base">موقع إلكتروني</span>
                        <span className="text-xs text-slate-500">منصة سريعة وتصميم متجاوب</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setServiceType('system');
                        setPlatforms(['Web', 'Desktop']);
                      }}
                      className={`p-5 rounded-2xl border-2 text-right transition-all flex flex-col gap-3 ${
                        serviceType === 'system'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${serviceType === 'system' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-base">نظام مخصص</span>
                        <span className="text-xs text-slate-500">لوحات تحكم وإدارة عمليات</span>
                      </div>
                    </button>
                  </div>

                  {/* Platforms Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">الأنظمة والمستهدفات</label>
                    <div className="flex flex-wrap gap-2">
                      {['iOS', 'Android', 'Web', 'Desktop'].map((p) => {
                        const isSelected = platforms.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handlePlatformToggle(p)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {p} {isSelected ? '✓' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all"
                  >
                    متابعة كـ إدخال التفاصيل
                  </button>
                </motion.div>
              )}

              {/* Step 2: Details & Scope */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">2. أدخل تفاصيل فكرة المشروع</h3>
                    <p className="text-xs text-slate-500 mt-1">اشرح الميزات المطلوبة بوضوح ليتم المراجعة من قبل الموظفين</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">اسم أو عنوان المشروع</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: تطبيق توصيل شحنات وحجز مواعيد"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">تفاصيل ومتطلبات المشروع البرمجي</label>
                    <textarea
                      rows={4}
                      required
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="اكتب الميزات التفصيلية (مثل: تسجيل دخول، بوابات دفع، خرائط، شات مباشر، إشعارات)..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">الميزانية التقديرية المتوقعة</label>
                      <select
                        value={expectedBudget}
                        onChange={(e) => setExpectedBudget(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="5,000 - 10,000 ر.س">5,000 - 10,000 ر.س</option>
                        <option value="10,000 - 20,000 ر.س">10,000 - 20,000 ر.س</option>
                        <option value="20,000 - 40,000 ر.س">20,000 - 40,000 ر.س</option>
                        <option value="+50,000 ر.س">+50,000 ر.س (مشاريع كبرى)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">المدة الزمنية المستهدفة</label>
                      <select
                        value={expectedTimeframe}
                        onChange={(e) => setExpectedTimeframe(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="14 يوم">14 يوم (سريع)</option>
                        <option value="30 يوم">30 يوم (قياسي)</option>
                        <option value="45 إلى 60 يوم">45 إلى 60 يوم</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-sm font-semibold"
                    >
                      الرجوع للخلف
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                      <span>تأكيد عرض السعر</span>
                      <Send className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </motion.div>
              )}

            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
