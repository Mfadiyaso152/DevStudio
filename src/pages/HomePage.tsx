import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Smartphone, 
  Globe, 
  Cpu, 
  Code2, 
  CheckCircle2, 
  ArrowLeft, 
  ExternalLink,
  Layers, 
  ChevronRight
} from 'lucide-react';
import { PortfolioProject } from '../types';
import { subscribePortfolioProjects } from '../lib/db';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  openQuoteModal: () => void;
  navigate: (p: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { isAuthenticated } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);

  useEffect(() => {
    const unsub = subscribePortfolioProjects(setPortfolio);
    return () => unsub();
  }, []);

  const handleStartNow = () => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else {
      navigate('/quote-request');
    }
  };

  return (
    <div className="space-y-20 pb-20 font-['Tajawal',sans-serif] relative overflow-x-hidden" dir="rtl">
      
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-80 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 subtle-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Right side text */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-7 space-y-6 text-right"
            >
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-2xs">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>استوديو برمجيات معتمد وتطبيقات مخصصة</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.2]">
                نحوّل أفكارك التقنية إلى <span className="gradient-text">تطبيقات ومواقع عالمية</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
                أهلاً بك! أنا مهندس برمجيات مستقل متخصص في بناء وتشييد تطبيقات الهواتف الذكية (iOS & Android) والمنصات السحابية. أقدم حلاً متكاملاً من الفكرة وحتى التسليم النهائي مع ضمان صيانة شامل.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartNow}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-3 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>تقديم طلب برمجة</span>
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Metrics Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <span className="block text-2xl font-black text-slate-900">+45</span>
                  <span className="text-xs text-slate-500 font-semibold">مشروع منفذ بنجاح</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <span className="block text-2xl font-black text-indigo-600">100%</span>
                  <span className="text-xs text-slate-500 font-semibold">ضمان جودة الأكواد</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <span className="block text-2xl font-black text-emerald-600">12 شهر</span>
                  <span className="text-xs text-slate-500 font-semibold">ضمان وصيانة مجانية</span>
                </motion.div>
              </div>

            </motion.div>

            {/* Left side Interactive Terminal */}
            <div className="lg:col-span-5">
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                whileHover={{ y: -4 }}
                className="relative mx-auto max-w-md bg-slate-900 text-slate-100 rounded-3xl shadow-2xl p-6 border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">developer_studio.ts</span>
                </div>

                <div className="font-mono text-xs space-y-2 leading-relaxed text-slate-300 text-left" dir="ltr">
                  <p><span className="text-purple-400">const</span> <span className="text-teal-300">developer</span> = &#123;</p>
                  <p className="pl-4"><span className="text-blue-400">name</span>: <span className="text-amber-300">'Software Engineer Studio'</span>,</p>
                  <p className="pl-4"><span className="text-blue-400">stack</span>: [<span className="text-amber-300">'React'</span>, <span className="text-amber-300">'Flutter'</span>, <span className="text-amber-300">'Firebase'</span>],</p>
                  <p className="pl-4"><span className="text-blue-400">qualityGuarantee</span>: <span className="text-emerald-400">true</span>,</p>
                  <p className="pl-4"><span className="text-blue-400">supportWarranty</span>: <span className="text-emerald-400">'12 Months'</span></p>
                  <p>&#125;;</p>
                  <div className="p-3 bg-slate-800/80 rounded-xl text-emerald-400 font-semibold text-[11px] flex items-center justify-between mt-4">
                    <span>✓ System Active & Ready</span>
                    <span className="animate-ping w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-indigo-900/60 to-slate-800 rounded-2xl border border-indigo-700/50 flex items-center justify-between text-right" dir="rtl">
                  <div>
                    <span className="block text-xs font-bold text-white">هل لديك فكرة مشروع؟</span>
                    <span className="text-[11px] text-slate-300">قدم طلب البرمجة الآن وسيصلك الرد سريعاً</span>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartNow} 
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    ابدأ
                  </motion.button>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* PORTFOLIO SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-right"
        >
          <div>
            <span className="text-xs font-extrabold px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
              أعمالنا
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">مشاريعنا</h2>
          </div>
        </motion.div>

        {portfolio.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-500 text-sm font-semibold">سيتم إضافة أحدث أعمالنا ومشاريعنا قريباً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {portfolio.map((proj, idx) => (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all text-right group flex flex-col justify-between"
              >
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img 
                    src={proj.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'} 
                    alt={proj.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900">{proj.title}</h3>
                    {proj.description && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{proj.description}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    {proj.linkUrl ? (
                      <a 
                        href={proj.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                      >
                        <span>معاينة الرابط</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">مشروع مكتمل</span>
                    )}

                    <button 
                      onClick={handleStartNow}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>تقديم طلب</span>
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
