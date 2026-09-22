import React, { useState } from 'react';
import { 
  Code2, 
  Home, 
  FileText, 
  CreditCard, 
  User, 
  ShieldCheck, 
  Sparkles, 
  Menu, 
  X, 
  LogOut, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
  openQuoteModal: () => void;
  isMobileShell: boolean;
  setIsMobileShell: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPath, 
  navigate, 
  openQuoteModal,
  isMobileShell,
  setIsMobileShell
}) => {
  const { user, isAuthenticated, openAuthModal, logout, switchRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'الرئيسية', path: '/home', icon: Home },
    { label: 'طلباتي ومشاريعي', path: '/requests', icon: FileText },
    { label: 'الدفع والتحويل', path: '/payment', icon: CreditCard },
    { label: 'ملفي الشخصي', path: '/profile', icon: User },
  ];

  if (user?.role === 'staff' || user?.role === 'admin') {
    navItems.push({ label: 'لوحة الإدارة والموظفين', path: '/admin', icon: ShieldCheck });
  }

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">استوديو البرمجة</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">مُعتمَد</span>
              </div>
              <span className="text-xs text-slate-500 font-medium block">تطوير التطبيقات والمواقع المتكاملة</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path === '/home' && currentPath === '/');
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Quick Mobile Shell Preview Toggle */}
            <button
              onClick={() => setIsMobileShell(!isMobileShell)}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isMobileShell 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title="معاينة الشاشة بحجم الجوال"
            >
              <Layers className="w-4 h-4" />
              <span>{isMobileShell ? 'عرض شاشة كاملة' : 'معاينة الجوال'}</span>
            </button>

            {/* Primary Action Button: ابدأ الآن */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal();
                } else {
                  openQuoteModal();
                }
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>ابدأ الآن (طلب سعر)</span>
            </button>

            {!isAuthenticated || !user ? (
              <button
                onClick={openAuthModal}
                className="px-4 py-2.5 text-slate-700 hover:text-indigo-600 font-bold text-sm"
              >
                تسجيل الدخول
              </button>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-r border-slate-200 pr-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center border border-indigo-200">
                  {user.fullName ? user.fullName.charAt(0) : 'ع'}
                </div>
                <button
                  onClick={logout}
                  title="تسجيل الخروج"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path === '/home' && currentPath === '/');
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-right ${
                    isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5 text-indigo-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (!isAuthenticated) openAuthModal();
                else openQuoteModal();
              }}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>ابدأ الآن (طلب عرض سعر)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
