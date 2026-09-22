import React from 'react';
import { 
  Home, 
  FileText, 
  CreditCard, 
  User, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomBarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ currentPath, navigate }) => {
  const { user } = useAuth();

  const navItems = [
    { path: '/home', label: 'الرئيسية', icon: Home },
    { path: '/requests', label: 'طلباتي', icon: FileText },
    { path: '/payment', label: 'الدفع', icon: CreditCard },
    { path: '/profile', label: 'حسابي', icon: User },
  ];

  if (user?.role === 'admin' || user?.role === 'staff') {
    navItems.push({ path: '/admin', label: 'الإدارة', icon: ShieldCheck });
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 font-['Tajawal',sans-serif]">
      {/* iOS 26 Ultra Glassmorphic Capsule - Icons Only */}
      <nav className="bg-slate-900/60 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-full px-6 py-3 flex items-center justify-center gap-6 sm:gap-8 transition-all">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === '/home' && currentPath === '/');

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={item.label}
              className={`p-2.5 rounded-full transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-indigo-600/30 text-indigo-400 scale-110 shadow-lg shadow-indigo-500/20 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
