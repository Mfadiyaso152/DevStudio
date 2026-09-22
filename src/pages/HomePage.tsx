import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Smartphone, 
  Globe, 
  Cpu, 
  Code2, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Star, 
  Zap, 
  Layers, 
  MessageCircle, 
  Terminal,
  ChevronRight,
  Lock,
  Download,
  Users
} from 'lucide-react';
import { PORTFOLIO_PROJECTS } from '../lib/mockData';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  openQuoteModal: () => void;
  navigate: (p: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredProjects = activeCategory === 'all'
    ? PORTFOLIO_PROJECTS
    : PORTFOLIO_PROJECTS.filter(p => p.category.includes(activeCategory));

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
                أهلاً بك! أنا مهندس برمجيات مستقل متخصص في بناء وتشييد تطبيقات الهواتف الذكية (iOS & Android) والمنصات السحابية. أقدم حلاً متكاملاً من الفكرة وحتى التسليم النهائي مع ضمان صيانة شامل لمدة 6 أشهر.
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
                  <span>ابدأ الآن (طلب عرض سعر)</span>
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
                  <span className="block text-2xl font-black text-emerald-600">6 أشهر</span>
                  <span className="text-xs text-slate-500 font-semibold">دعم وصيانة مجانية</span>
                </motion.div>
              </div>

            </motion.div>

            {/* Left side Interactive Terminal / Code Mockup Card */}
            <div className="lg:col-span-5">
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                whileHover={{ y: -4 }}
                className="relative mx-auto max-w-md bg-slate-900 text-slate-100 rounded-3xl shadow-2xl p-6 border border-slate-800 space-y-4"
              >
                {/* Window header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">developer_studio.ts</span>
                </div>

                {/* Code snippet */}
                <div className="font-mono text-xs space-y-2 leading-relaxed text-slate-300 text-left" dir="ltr">
                  <p><span className="text-purple-400">const</span> <span className="text-teal-300">developer</span> = &#123;</p>
                  <p className="pl-4"><span className="text-blue-400">name</span>: <span className="text-amber-300">'Software Engineer Studio'</span>,</p>
                  <p className="pl-4"><span className="text-blue-400">stack</span>: [<span className="text-amber-300">'React'</span>, <span className="text-amber-300">'Flutter'</span>, <span className="text-amber-300">'Firebase'</span>, <span className="text-amber-300">'Node.js'</span>],</p>
                  <p className="pl-4"><span className="text-blue-400">qualityGuarantee</span>: <span className="text-emerald-400">true</span>,</p>
                  <p className="pl-4"><span className="text-blue-400">supportYears</span>: <span className="text-orange-400">1</span></p>
                  <p>&#125;;</p>
                  <div className="p-3 bg-slate-800/80 rounded-xl text-emerald-400 font-semibold text-[11px] flex items-center justify-between mt-4">
                    <span>✓ System Ready & Firebase Active</span>
                    <span className="animate-ping w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                </div>

                {/* Quick CTA card inside preview */}
                <div className="p-4 bg-gradient-to-r from-indigo-900/60 to-slate-800 rounded-2xl border border-indigo-700/50 flex items-center justify-between text-right" dir="rtl">
                  <div>
                    <span className="block text-xs font-bold text-white">هل لديك فكرة مشروع؟</span>
                    <span className="text-[11px] text-slate-300">اطلب عرض السعر الآن وسيصلك الرد سريعاً</span>
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

      {/* ABOUT ME & MY WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-lg shadow-slate-100 space-y-12"
        >
          
          <div className="max-w-3xl space-y-4 text-right">
            <span className="text-xs font-extrabold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
              نبذة تعريفية
            </span>
            <h2 className="text-3xl font-black text-slate-900">عن الاستوديو والمهارات البرمجية</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              أعمل كمهندس ومطور حلول برمجية مستقل بخبرة تزيد عن 6 سنوات في بناء التطبيقات عالية الكفاءة والمواقع المتجاوبة. نتميز بالدقة في المواعيد والتصميم الحديث وربط قواعد البيانات المتقدمة.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'تطبيقات الجوال', icon: Smartphone, desc: 'iOS & Android' },
              { name: 'المواقع والتطبيقات', icon: Globe, desc: 'React & Next.js' },
              { name: 'قواعد البيانات', icon: Cpu, desc: 'Firebase Firestore' },
              { name: 'الأنظمة السحابية', icon: Layers, desc: 'Cloud & Node.js' },
              { name: 'الأمان والتشفير', icon: Lock, desc: 'SSL & OAuth' },
              { name: 'الضمان البرمجي', icon: ShieldCheck, desc: '6 أشهر مجاناً' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div 
                  key={idx} 
                  whileHover={{ scale: 1.04, translateY: -4 }}
                  className="p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/70 hover:border-indigo-200 rounded-2xl transition-all text-right shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 mb-3 shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                  <span className="text-xs text-slate-500">{item.desc}</span>
                </motion.div>
              );
            })}
          </div>

        </motion.div>
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
              أعمالنا السابقة
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">معرض المخرجات والتطبيقات المنفذة</h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'تطبيق', label: 'تطبيقات جوال' },
              { id: 'موقع', label: 'مواقع إلكترونية' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProjects.map((proj, idx) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-xl transition-all text-right group"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img 
                  src={proj.image} 
                  alt={proj.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-extrabold text-indigo-700 shadow-xs">
                  {proj.category}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{proj.clientType}</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{proj.rating}</span>
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900">{proj.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{proj.description}</p>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {proj.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">مدة التنفيذ: {proj.deliveryDays} يوم</span>
                  <button 
                    onClick={handleStartNow}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>طلب مشروع مماثل</span>
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
};
