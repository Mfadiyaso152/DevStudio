import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  LogOut, 
  AlertTriangle,
  Edit2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveUserProfile, convertArabicToEnglishDigits } from '../lib/db';

export const ProfilePage: React.FC<{ openAuthModal: () => void }> = ({ openAuthModal }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editPhone, setEditPhone] = useState<string>(user?.phone || '');
  const [editDob, setEditDob] = useState<string>(user?.dob || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 text-right font-['Tajawal',sans-serif]" dir="rtl">
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

  const isMissingData = !user.phone || !user.phone.trim() || !user.dob || !user.dob.trim();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const cleanPhone = convertArabicToEnglishDigits(editPhone.trim());
      const updatedUser = {
        ...user,
        phone: cleanPhone,
        dob: editDob,
        updatedAt: new Date().toISOString()
      };

      await saveUserProfile(updatedUser);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-right font-['Tajawal',sans-serif]" dir="rtl">
      
      {/* Missing Data Warning Banner */}
      {isMissingData && !isEditing && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block font-bold">تنبيه: البيانات المسجلة غير مكتملة</strong>
              <span className="text-amber-800">يرجى إضافة رقم الجوال وتاريخ الميلاد لضمان التواصل معك وإتمام طلباتك.</span>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shrink-0 cursor-pointer"
          >
            إكمال البيانات الآن
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم حفظ تحديثات الملف الشخصي بنجاح!</span>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-indigo-100">
            {user.fullName ? user.fullName.charAt(0) : user.email.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{user.fullName || user.email.split('@')[0]}</h1>
            <p className="text-xs text-slate-500 mt-1">{user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* Profile Info or Edit Form */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-900">
            البيانات المسجلة بملفك الشخصي
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>تعديل البيانات</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">رقم الجوال</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(convertArabicToEnglishDigits(e.target.value))}
                  placeholder="0512345678"
                  dir="ltr"
                  className="w-full text-left pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">تاريخ الميلاد</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="date"
                  required
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  className="w-full text-right pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>الاسم الكامل</span>
              </span>
              <span className="block font-bold text-slate-900 text-sm">{user.fullName || 'غير محدد'}</span>
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
              {user.phone ? (
                <span className="block font-bold text-slate-900 text-sm" dir="ltr">{user.phone}</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                  <AlertTriangle className="w-3 h-3" />
                  <span>غير مُدخل (يرجى الإكمال)</span>
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>تاريخ الميلاد</span>
              </span>
              {user.dob ? (
                <span className="block font-bold text-slate-900 text-sm">{user.dob}</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                  <AlertTriangle className="w-3 h-3" />
                  <span>غير مُدخل (يرجى الإكمال)</span>
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>نوع الحساب</span>
              </span>
              <span className="block font-bold text-slate-900 text-sm">
                {user.entityType === 'company' ? `شركة / مؤسسة (${user.companyName || 'مؤسسة إعلامية'})` : 'فرد / مستقل'}
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
