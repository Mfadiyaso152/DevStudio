import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  FileText, 
  CreditCard, 
  User, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigation, MAIN_TABS } from '../context/NavigationContext';

const ICONS = {
  home: Home,
  requests: FileText,
  payment: CreditCard,
  profile: User,
};

export const BottomBar: React.FC = () => {
  const { user } = useAuth();
  const { currentPath, navigate } = useNavigation();

  // If user is admin, they have their dedicated workspace header
  const isAdmin = 
    user?.email?.toLowerCase() === 'mfb.15@icloud.com' || 
    user?.email?.toLowerCase() === 'mfb-15@hotmail.com' || 
    user?.role === 'admin';

  if (isAdmin) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 sm:bottom-6 inset-x-0 z-50 flex justify-center items-center px-4 pointer-events-none select-none font-['Tajawal',sans-serif]"
      dir="rtl"
      style={{
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}
    >
      {/* iOS Floating Island Dock with Dynamic Glassmorphism */}
      <motion.nav 
        initial={{ y: 60, opacity: 0, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          mass: 0.8
        }}
        className="pointer-events-auto relative flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-900/75 backdrop-blur-3xl border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.12)_inset] rounded-full ring-1 ring-black/40"
      >
        {/* Subtle Specular Top Highlight (iOS style) */}
        <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {MAIN_TABS.map((item) => {
          const Icon = ICONS[item.id as keyof typeof ICONS] || Home;
          const isActive = currentPath === item.path || (item.path === '/home' && (currentPath === '/' || currentPath === '/landing'));

          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-label={item.label}
              role="tab"
              aria-selected={isActive}
            >
              {/* Sliding Active Pill Background with Spring Physics */}
              {isActive && (
                <motion.div
                  layoutId="ios-nav-active-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 shadow-[0_4px_20px_rgba(99,102,241,0.5),0_0_0_1px_rgba(255,255,255,0.3)_inset]"
                  transition={{
                    type: "spring",
                    stiffness: 480,
                    damping: 34,
                    mass: 0.75,
                  }}
                />
              )}

              {/* Icon Container with subtle micro-scale and spring on active */}
              <motion.div
                className="relative z-10 flex items-center justify-center"
                animate={isActive ? { scale: 1.12, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
              >
                <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]' : 'text-slate-400'}`} />
              </motion.div>

              {/* Active Tab Label with Smooth Spring Morph */}
              <motion.span
                className={`relative z-10 text-xs sm:text-sm tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ${
                  isActive ? 'block font-extrabold text-white max-w-[80px] opacity-100' : 'hidden sm:block text-xs text-slate-400 max-w-[0px] sm:max-w-[70px] opacity-70'
                }`}
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  maxWidth: isActive ? 90 : 0,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              >
                {item.label}
              </motion.span>

              {/* Glowing Active Indicator Dot underneath */}
              {isActive && (
                <motion.span
                  layoutId="ios-nav-active-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.nav>
    </div>
  );
};
