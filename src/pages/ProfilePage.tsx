import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2,
  Sparkles,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC<{ openAuthModal: () => void }> = ({ openAuthModal }) => {
  const { user, isAuthenticated, logout, switchRole } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 text-right" dir="rtl">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100">
          <User className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">الملف الشخصي والبيانات</h2>
        <p className="text-slate-600 text-sm">قم بتسجيل الدخول أو إنشاء حساب لاستعراض بياناتك الشخصية ومتابعة مشروعاتك.</p>
        <button
          onClick={openAuthModal}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
        >
          تسجيل الدخول / إنشاء حساب
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right" dir="rtl">
      
      {/* Header card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-indigo-200">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{user.fullName}</h1>
              <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {user.role === 'admin' ? 'مشرف النظام' : 'مستخدم'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* Profile Info Grid */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
          البيانات المسجلة بملفك الشخصي
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>الاسم الكامل</span>
            </span>
            <span className="block font-bold text-slate-900 text-sm">{user.fullName}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>البريد الإلكتروني</span>
            </span>
            <span className="block font-bold text-slate-900 text-sm" dir="ltr">{user.email}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              <span>رقم الجوال</span>
            </span>
            <span className="block font-bold text-slate-900 text-sm" dir="ltr">{user.phone}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>تاريخ الميلاد</span>
            </span>
            <span className="block font-bold text-slate-900 text-sm">{user.dob}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>نوع الحساب</span>
            </span>
            <span className="block font-bold text-slate-900 text-sm">
              {user.entityType === 'company' ? `شركة / مؤسسة (${user.companyName || 'مؤسسة إعلامية'})` : 'فرد / مستقل'}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};
