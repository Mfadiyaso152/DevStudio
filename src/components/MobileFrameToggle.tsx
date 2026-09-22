import React from 'react';
import { Smartphone, Monitor, Layers } from 'lucide-react';

interface MobileFrameToggleProps {
  isMobileShell: boolean;
  setIsMobileShell: (val: boolean) => void;
}

export const MobileFrameToggle: React.FC<MobileFrameToggleProps> = ({ isMobileShell, setIsMobileShell }) => {
  return (
    <div className="fixed bottom-4 left-4 z-40 bg-slate-900/90 backdrop-blur-md text-white p-2 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-1">
      <button
        onClick={() => setIsMobileShell(false)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
          !isMobileShell ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>كمبيوتر / متصفح</span>
      </button>

      <button
        onClick={() => setIsMobileShell(true)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
          isMobileShell ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>عرض الجوال</span>
      </button>
    </div>
  );
};
