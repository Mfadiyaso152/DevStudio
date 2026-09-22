import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, FileCode2, Download, ExternalLink, ArrowRight, Lock, Check } from 'lucide-react';
import { Project } from '../types';
import { acceptProjectWarranty } from '../lib/db';

export const WarrantyPage: React.FC<{ project: Project; navigate: (path: string) => void }> = ({ project, navigate }) => {
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigned, setIsSigned] = useState(project.warrantyAgreed);

  const handleConfirmSignature = async () => {
    if (!agreed && !isSigned) return;
    setIsLoading(true);

    try {
      await acceptProjectWarranty(project.id);
      setIsSigned(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right font-['Tajawal',sans-serif]" dir="rtl">
      
      {/* Top Header back button */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
            وثيقة الضمان الفني والبرمجي
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-2">اتفاقية ضمان الجودة واستلام الأكواد المصدرية</h1>
          <p className="text-sm text-slate-600 mt-1">المشروع: {project.title}</p>
        </div>

        <button
          onClick={() => navigate('/requests')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لصفحة طلباتي</span>
        </button>
      </div>

      {/* Main Warranty Agreement Document Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
        
        <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4">
          <div className="flex items-center gap-3 text-emerald-400 font-extrabold text-base">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>بنود ضمان الجودة البرمجية والتشغيلية المعتمدة (12 شهراً):</span>
          </div>

          <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed list-disc list-inside">
            <li>التزام استوديو البرمجة بإصلاح أي أخطاء ثغرات أو مشاكل برمجية (Bugs) لمدة 12 شهراً مجاناً.</li>
            <li>الضمان يسري على جميع الميزات المتفق عليها في وثيقة عروض الأسعار.</li>
            <li>تسليم العميل الشفرة المصدرية (Source Code) كاملة بدون أي تشفير أو حجب.</li>
            <li>المحافظة على سرية البيانات ومعايير حماية وخصوصية مستخدمي التطبيق.</li>
          </ul>
        </div>

        {/* SIGNATURE & AGREE CHECKBOX */}
        {!isSigned ? (
          <div className="space-y-6 pt-2">
            <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
              />
              <span className="text-xs text-slate-800 font-bold leading-relaxed">
                أقر وأوافق بصفتي صاحب المشروع على جميع بنود الضمان الفني واستلام شفرات البرمجة والملفات الخاصة بالتطبيق.
              </span>
            </label>

            <button
              onClick={handleConfirmSignature}
              disabled={!agreed || isLoading}
              className={`w-full py-4 rounded-xl text-white font-extrabold text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                agreed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isLoading ? 'جاري توثيق الموافقة...' : 'تأكيد الموافقة على الضمان واستلام الكود'}</span>
            </button>
          </div>
        ) : (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>تم تأكيد الموافقة على الضمان بنجاح! شفرات المصدر وروابط التحميل متاحة أدناه:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {project.deliverables?.repositoryUrl && (
                <a
                  href={project.deliverables.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-slate-900 text-white hover:bg-slate-950 rounded-xl text-xs font-bold flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-indigo-400" />
                    <span>مستودع الكود (GitHub Repository)</span>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {project.deliverables?.appDownloadUrl && (
                <a
                  href={project.deliverables.appDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-slate-900 text-white hover:bg-slate-950 rounded-xl text-xs font-bold flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-teal-400" />
                    <span>تحميل نسخة التطبيق (APK/IPA)</span>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
