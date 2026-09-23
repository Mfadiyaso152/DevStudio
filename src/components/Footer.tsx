import React from 'react';
import { 
  Code2, 
  MessageCircle, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Heart,
  ExternalLink
} from 'lucide-react';

export const Footer: React.FC<{ navigate: (p: string) => void }> = ({ navigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-right pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & About */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white">استوديو البرمجة</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              استوديو مستقل متخصص في برمجة وتطوير تطبيقات الهواتف الذكية (iOS & Android)، المواقع الإلكترونية، والأنظمة السحابية المعقدة بأحدث التقنيات وبأعلى معايير الأمان والضمان.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>جميع المشاريع معتمدة ومضمونة 12 شهراً</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">صفحات المنصة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/home')} className="hover:text-indigo-400 transition-colors">
                  الصفحة الرئيسية
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/requests')} className="hover:text-indigo-400 transition-colors">
                  طلباتي ومتابعة المشاريع
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/payment')} className="hover:text-indigo-400 transition-colors">
                  معلومات وسداد الدفعات
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/profile')} className="hover:text-indigo-400 transition-colors">
                  الملف الشخصي والبيانات
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">خدماتنا البرمجية</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• تطوير تطبيقات الهواتف (iOS & Android)</li>
              <li>• تطوير المواقع والمتاجر الإلكترونية</li>
              <li>• تصميم لوحات التحكم وإدارة البيانات</li>
              <li>• ربط بوابات الدفع الإلكتروني والخرائط</li>
              <li>• استشارات وتقييم الأكواد البرمجية</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm">التواصل المباشر</h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <a 
                href="https://wa.me/966500000000" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2.5 p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 text-emerald-400 font-bold transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
                <span>التواصل المباشر عبر الواتساب</span>
                <ExternalLink className="w-3 h-3 mr-auto" />
              </a>

              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>support@developer-studio.sa</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4 text-indigo-400" />
                <span dir="ltr">+966 50 123 4567</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} استوديو البرمجة والتطوير المستقل. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>تم التطوير باستخدام أحدث التقنيات</span>
            <Code2 className="w-4 h-4 text-indigo-400 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
