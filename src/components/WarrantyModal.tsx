import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  FileSignature, 
  Sparkles, 
  Download, 
  ExternalLink, 
  Code,
  FileCode2,
  Lock
} from 'lucide-react';
import { Project } from '../types';
import { signProjectWarranty } from '../lib/db';
import confetti from 'canvas-confetti';

interface WarrantyModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onWarrantySigned: () => void;
}

export const WarrantyModal: React.FC<WarrantyModalProps> = ({
  project,
  isOpen,
  onClose,
  onWarrantySigned
}) => {
  const [agreed, setAgreed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen || !project) return null;

  const handleSign = async () => {
    if (!agreed) return;
    setIsLoading(true);

    try {
      await signProjectWarranty(project.id);
      
      // Fire celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      onWarrantySigned();
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right"
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
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              اعتماد سياسة الضمان والتسليم
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">سياسة الضمان البرمجي والدعم الفني (12 شهراً)</h3>
            <p className="text-sm text-slate-600">
              مشروعك: <span className="font-bold text-indigo-600">{project.title}</span> مكتمل بنسبة 100%. قبل فتح رابط تحميل الكود البرمجي والتسليم، يرجى قراءة وقبول سياسة الضمان.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl max-h-56 overflow-y-auto space-y-3 text-xs text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-900 text-sm">البنود والشروط الأساسية للضمان البرمجي:</p>
            
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>إصلاح الأخطاء البرمجية (Bugs):</strong> ضمان شامـل ومجاني لمدة 12 شهراً لإصلاح أي أخطاء أو أعطال تقنية تظهر في الكود المسلّم.</span>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>الملكية الكاملة للأكواد:</strong> يضمن الاستوديو تحويل شفرة المصدر المصدرية (Source Code) والحقوق الفكرية كاملاً للعميل.</span>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>السرية وأمان البيانات:</strong> الالتزام التام بعدم إفشاء أو مشاركة بيانات المشروع أو قواعد البيانات مع أي طرف ثالث.</span>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>التعديلات الجوهرية:</strong> أي ميزات جديدة تماماً خارج نطاق العقد الأصلي تخضع لاتفاقية جديدة منفصلة.</span>
            </div>
          </div>

          {/* Checkbox agreement */}
          <label className="flex items-center gap-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-colors">
            <input 
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-indigo-950">
              أقر بأني قرأت سياسة الضمان البرمجي والدعم الفني وأوافق على كافة بنودها.
            </span>
          </label>

          <button
            onClick={handleSign}
            disabled={!agreed || isLoading}
            className={`w-full py-4 rounded-xl text-white font-extrabold text-base shadow-xl transition-all flex items-center justify-center gap-2 ${
              agreed
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <FileSignature className="w-5 h-5" />
            <span>الموافقة على الضمان واستلام الكود والملفات البرمجية</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
