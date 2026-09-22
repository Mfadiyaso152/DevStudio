import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, 
  Globe, 
  Layers, 
  Send, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ServiceType } from '../types';
import { submitQuoteRequest } from '../lib/db';

export const QuoteRequestPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user, isAuthenticated } = useAuth();

  const [serviceType, setServiceType] = useState<ServiceType>('app');
  const [platforms, setPlatforms] = useState<string[]>(['iOS', 'Android']);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [expectedBudget, setExpectedBudget] = useState('15,000 - 30,000 ر.س');
  const [expectedTimeframe, setExpectedTimeframe] = useState('4 أسابيع');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      if (platforms.length > 1) setPlatforms(platforms.filter(x => x !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !details.trim()) {
      setErrorMsg('يرجى تعبئة عنوان الفكرة والتفاصيل المطلوبة');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const serviceLabel = 
        serviceType === 'app' ? 'تطبيق جوال' :
        serviceType === 'website' ? 'موقع إلكتروني' : 'تطبيق جوال وموقع إلكتروني';

      await submitQuoteRequest({
        userId: user?.uid || 'user-demo-1',
        userName: user?.fullName || 'عميل برمجيات',
        userEmail: user?.email || 'client@example.com',
        userPhone: user?.phone || '+966 50 000 0000',
        userEntityType: user?.accountType || 'individual',
        companyName: user?.companyName,
        serviceType,
        serviceTypeLabel: serviceLabel,
        platforms,
        title: title.trim(),
        details: details.trim(),
        expectedBudget,
        expectedTimeframe
      });

      // Redirect to Requests Page
      navigate('/requests');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في تقديم الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right font-['Tajawal',sans-serif]" dir="rtl">
      
      {/* Header back button */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            خدمات الاستوديو البرمجي
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-2">طلب عرض سعر جديد لمشروعك</h1>
          <p className="text-sm text-slate-600 mt-1">قم بتحديد المواصفات ونوع الخدمة وسيقوم الموظف بمراجعتها والتواصل معك فوراً</p>
        </div>

        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للتطبيق</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Quote Request Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
        
        {/* SERVICE SELECTION */}
        <div className="space-y-3">
          <label className="block text-sm font-extrabold text-slate-900">1. حدد نوع الخدمة البرمجية المطلوبة:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'app', title: 'تطبيق جوال', desc: 'iOS & Android', icon: Smartphone },
              { id: 'website', title: 'موقع إلكتروني', desc: 'منصة ويب متكاملة', icon: Globe },
              { id: 'system', title: 'تطبيق + موقع إلكتروني', desc: 'حل برمجي شامل', icon: Layers },
            ].map((srv) => {
              const Icon = srv.icon;
              const isSelected = serviceType === srv.id;
              return (
                <motion.button
                  type="button"
                  key={srv.id}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setServiceType(srv.id as ServiceType)}
                  className={`p-5 rounded-2xl border text-right space-y-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-black shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{srv.title}</h3>
                  <p className="text-[11px] text-slate-500">{srv.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* TARGET PLATFORMS */}
        <div className="space-y-3 pt-2">
          <label className="block text-sm font-extrabold text-slate-900">2. الأنظمة والمستهدفات:</label>
          <div className="flex flex-wrap gap-3">
            {['iOS (iPhone/iPad)', 'Android', 'صفحات الويب', 'لوحة تحكم سحابية'].map((p) => {
              const isChecked = platforms.includes(p);
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {isChecked ? '✓ ' : '+ '} {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* TITLE & DETAILS */}
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5">عنوان فكرة التطبيق أو الموقع</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تطبيق متجر إلكتروني لحجز المواعيد والمنتجات"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1.5">تفاصيل ومميزات الخدمة المطلوبة</label>
            <textarea
              required
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="اشرح الفكرة والصفحات المطلوبة وطريقة عمل التطبيق والميزات التفاعلية..."
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base rounded-xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span>{isLoading ? 'جاري تأكيد وإرسال الطلب...' : 'تأكيد وإرسال طلب عرض السعر'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
