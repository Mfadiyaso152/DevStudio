import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Code2, 
  Smartphone, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  Terminal, 
  Database, 
  ShieldCheck, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { PortfolioProject } from '../types';
import { subscribePortfolioProjects } from '../lib/db';

export const LandingPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);

  useEffect(() => {
    const unsub = subscribePortfolioProjects(setPortfolio);
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Tajawal',sans-serif] selection:bg-indigo-500 selection:text-white" dir="rtl">
      
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col items-center justify-center min-h-screen text-center">
        
        {/* Ambient Glowing Glass Orbs Background */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-300 text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>DevStudio</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight"
          >
            نبني تطبيقات ومواقع <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-teal-300 to-indigo-200">
              احترافية بمقاييس عالمية
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            نصمم ونبني أفكارك التقنية بأعلى جودة برمجية وأفضل ممارسات تطوير تطبيقات الجوال والمواقع الإلكترونية. استعرض نماذج أعمالنا وابدأ رحلة نجاح مشروعك فوراً.
          </motion.p>

          {/* START NOW CTA BUTTON -> NAVIGATES TO LOGIN PAGE */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-extrabold text-lg shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all flex items-center justify-center gap-3 cursor-pointer group scale-100 hover:scale-105 active:scale-95"
            >
              <span>ابدأ الآن (تسجيل الدخول)</span>
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </button>
          </motion.div>

          {/* Quick Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { num: '+45', label: 'مشروع منجز' },
              { num: '100%', label: 'ملاءمة المعايير' },
              { num: 'iOS & Android', label: 'تطبيقات الجوال' },
              { num: '24/7', label: 'دعم وضمان فني' },
            ].map((st, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-2xl font-black text-indigo-300 font-mono">{st.num}</div>
                <div className="text-xs text-slate-400 font-bold mt-1">{st.label}</div>
              </div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ABOUT ME & TECH STACK SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/80 border-t border-slate-800 relative">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-white">خبرة برمجية متكاملة لتحويل فكرتك لحقيقة</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              نعتمد أحدث الأطر البرمجية وقواعد البيانات السحابية مع تصميم واجهات مستخدم جذابة وسلسة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Smartphone,
                title: 'تطبيقات الجوال الذكية',
                desc: 'تطبيقات متكاملة للأيفون والأندرويد بتصميم عصري وأداء فائق ونظام تنبيهات لحظية.'
              },
              {
                icon: Globe,
                title: 'المواقع والمنصات الإلكترونية',
                desc: 'تطوير مواقع ويب سريعة جداً، متوافقة مع محركات البحث SEO وتعمل بكفاءة على كافة الشاشات.'
              },
              {
                icon: Database,
                title: 'قواعد البيانات والسحابة',
                desc: 'ربط آمن للغاية مع قواعد البيانات اللحظية (Firestore) وإدارة الصلاحيات.'
              }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-all space-y-4">
                  <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* PORTFOLIO SHOWCASE */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-400 px-3 py-1 bg-teal-500/10 rounded-full border border-teal-500/20">
                نماذج من الأعمال
              </span>
              <h2 className="text-3xl font-black text-white mt-2">مشاريعنا</h2>
            </div>

            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-2 self-start cursor-pointer"
            >
              <span>تسجيل الدخول للبدء</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {portfolio.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm font-medium">سيتم إضافة أحدث أعمالنا ومشاريعنا قريباً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((project) => (
                <div 
                  key={project.id}
                  className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="h-48 overflow-hidden relative group">
                    <img 
                      src={project.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'} 
                      alt={project.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">{project.title}</h3>
                      {project.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{project.description}</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      {project.linkUrl ? (
                        <a
                          href={project.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                        >
                          <span>معاينة المشروع</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">تم الإنجاز</span>
                      )}
                      <button
                        onClick={() => navigate('/auth')}
                        className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>اطلب مشروع</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* FINAL BOTTOM CTA */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-slate-950 to-indigo-950 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white">جاهز لبدء مشروعك القادم؟</h2>
          <button
            onClick={() => navigate('/auth')}
            className="px-10 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-lg shadow-2xl shadow-indigo-600/50 transition-all inline-flex items-center gap-3 cursor-pointer"
          >
            <span>ابدأ الآن وتسجيل الدخول</span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </section>

    </div>
  );
};
