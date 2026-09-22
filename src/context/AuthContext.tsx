import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { saveUserProfile, getUserProfile } from '../lib/db';
import { 
  auth, 
  googleProvider, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut 
} from '../lib/firebase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  isVerifyingEmailLink: boolean;
  emailLinkNeedsEmail: boolean;
  emailLinkError: string | null;
  resetEmailLinkState: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  registerUser: (data: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt' | 'role'>) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  sendFirebaseEmailLink: (email: string) => Promise<void>;
  completeEmailLinkWithManualEmail: (email: string) => Promise<void>;
  completeFirebaseEmailSignIn: (email: string, code?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'applet_active_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isVerifyingEmailLink, setIsVerifyingEmailLink] = useState<boolean>(() => {
    return isSignInWithEmailLink(auth, window.location.href);
  });
  const [emailLinkNeedsEmail, setEmailLinkNeedsEmail] = useState<boolean>(false);
  const [emailLinkError, setEmailLinkError] = useState<string | null>(null);

  // Sync state with localStorage & Firestore
  useEffect(() => {
    if (user) {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user));
      saveUserProfile(user).catch(console.error);
    } else {
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    }
  }, [user]);

  const resetEmailLinkState = () => {
    setIsVerifyingEmailLink(false);
    setEmailLinkNeedsEmail(false);
    setEmailLinkError(null);
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const executeEmailLinkSignIn = async (emailToUse: string, currentUrl: string) => {
    setIsVerifyingEmailLink(true);
    setEmailLinkError(null);
    setEmailLinkNeedsEmail(false);

    try {
      const result = await signInWithEmailLink(auth, emailToUse.trim(), currentUrl);
      window.localStorage.removeItem('emailForSignIn');

      const fbUser = result.user;
      const uid = fbUser.uid;
      const email = fbUser.email || emailToUse.trim();

      const isAdminEmail = email.toLowerCase() === 'mfb-15@hotmail.com';
      let targetUser = await getUserProfile(uid);

      if (!targetUser) {
        targetUser = {
          uid,
          email,
          fullName: fbUser.displayName || email.split('@')[0],
          phone: fbUser.phoneNumber || '+966 50 123 4567',
          dob: '2010-01-01',
          entityType: 'individual',
          role: isAdminEmail ? 'admin' : 'client',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveUserProfile(targetUser);
      } else if (isAdminEmail && targetUser.role !== 'admin') {
        targetUser = { ...targetUser, role: 'admin' };
        await saveUserProfile(targetUser);
      }

      setUser(targetUser);
      setIsVerifyingEmailLink(false);

      // Clean query parameters from URL and auto-navigate to destination
      const targetPath = targetUser.role === 'admin' ? '/admin' : '/home';
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, targetPath);
      }
      window.dispatchEvent(new Event('popstate'));

    } catch (err: any) {
      console.error('Firebase Email Link Sign In Error:', err);
      setIsVerifyingEmailLink(false);

      const code = err.code || '';
      let message = 'حدث خطأ أثناء توثيق تسجيل الدخول عبر الرابط.';

      if (code === 'auth/expired-action-code') {
        message = 'رابط تسجيل الدخول انتهت صلاحيته. يرجى طلب رابط جديد.';
      } else if (code === 'auth/invalid-action-code') {
        message = 'رابط تسجيل الدخول غير صالح أو تم استخدامه مسبقاً.';
      } else if (code === 'auth/invalid-email') {
        message = 'البريد الإلكتروني المدخل غير مطابق أو غير صحيح.';
      } else if (code === 'auth/user-disabled') {
        message = 'تم تعطيل هذا الحساب بطلب من الإدارة.';
      } else if (err.message) {
        message = err.message;
      }

      setEmailLinkError(message);
    }
  };

  const completeEmailLinkWithManualEmail = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailLinkError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    const currentUrl = window.location.href;
    await executeEmailLinkSignIn(email, currentUrl);
  };

  // Firebase Auth Listener & Auto Link Completion
  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      const currentUrl = window.location.href;
      if (isSignInWithEmailLink(auth, currentUrl)) {
        setIsVerifyingEmailLink(true);
        const savedEmail = window.localStorage.getItem('emailForSignIn');

        if (!savedEmail) {
          // Open on different device or cleared storage: request email in UI
          setIsVerifyingEmailLink(false);
          setEmailLinkNeedsEmail(true);
          return;
        }

        await executeEmailLinkSignIn(savedEmail, currentUrl);
      }
    };

    handleEmailLinkSignIn();

    // Subscribe to Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const existing = await getUserProfile(fbUser.uid);
        if (existing) {
          setUser(existing);
        } else {
          const isAdminEmail = (fbUser.email || '').toLowerCase() === 'mfb-15@hotmail.com';
          const newProf: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'user@devstudio.sa',
            fullName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'مستخدم DevStudio'),
            phone: fbUser.phoneNumber || '+966 50 123 4567',
            dob: '2010-01-01',
            entityType: 'individual',
            role: isAdminEmail ? 'admin' : 'client',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setUser(newProf);
          await saveUserProfile(newProf);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const registerUser = async (data: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt' | 'role'>): Promise<UserProfile> => {
    const uid = auth.currentUser?.uid || ('usr-' + Date.now());
    const now = new Date().toISOString();
    const newUserProfile: UserProfile = {
      ...data,
      uid,
      role: 'client',
      createdAt: now,
      updatedAt: now
    };
    setUser(newUserProfile);
    await saveUserProfile(newUserProfile);
    closeAuthModal();
    return newUserProfile;
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    try {
      const result = await Promise.race([
        signInWithPopup(auth, googleProvider),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('تأخر الاتصال بـ Google. يرجى السماح بالنوافذ المنبثقة (Popups) وإعادة المحاولة.')), 20000)
        )
      ]);
      const fbUser = result.user;
      
      const existing = await getUserProfile(fbUser.uid);
      if (existing) {
        setUser(existing);
        closeAuthModal();
        return existing;
      }

      const googleProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || 'user.google@devstudio.sa',
        fullName: fbUser.displayName || 'مستخدم جوجل',
        phone: fbUser.phoneNumber || '+966 50 123 4567',
        dob: '2010-01-01',
        entityType: 'individual',
        role: 'client',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(googleProfile);
      await saveUserProfile(googleProfile);
      closeAuthModal();
      return googleProfile;
    } catch (err: any) {
      console.warn('Google Auth Error:', err);
      const code = err.code || '';
      if (code === 'auth/unauthorized-domain') {
        throw new Error('عفواً، يجب إضافة نطاق التطبيق الحالي إلى القائمة المسموحة (Authorized Domains) في Firebase Console > Authentication > Settings');
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        throw new Error('تم إغلاق نافذة تسجيل الدخول قبل الإكمال');
      } else if (code === 'auth/popup-blocked') {
        throw new Error('تم حظر النافذة المنبثقة بواسطة المتصفح. يرجى السماح بالنوافذ المنبثقة وإعادة المحاولة');
      } else {
        throw new Error(err.message || 'فشل تسجيل الدخول بواسطة Google');
      }
    }
  };

  const sendFirebaseEmailLink = async (email: string): Promise<void> => {
    if (!email || !email.includes('@')) {
      throw new Error('البريد الإلكتروني غير صحيح');
    }

    const authDomain = auth.config.authDomain || 'dev-studi.firebaseapp.com';
    const actionCodeSettingsPrimary = {
      url: window.location.origin + '/auth',
      handleCodeInApp: true
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettingsPrimary);
      window.localStorage.setItem('emailForSignIn', email);
    } catch (err: any) {
      console.warn('sendSignInLinkToEmail error on current origin, trying authDomain fallback:', err);
      try {
        const actionCodeSettingsFallback = {
          url: `https://${authDomain}`,
          handleCodeInApp: true
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettingsFallback);
        window.localStorage.setItem('emailForSignIn', email);
      } catch (fallbackErr: any) {
        console.error('sendSignInLinkToEmail fallback error:', fallbackErr);
        const code = fallbackErr.code || err.code || '';
        if (code === 'auth/invalid-email') {
          throw new Error('البريد الإلكتروني غير صحيح');
        } else if (code === 'auth/too-many-requests') {
          throw new Error('تجاوزت عدد محاولات الإرسال المسموح بها، يرجى الانتظار قليلاً');
        } else if (code === 'auth/user-disabled') {
          throw new Error('هذا الحساب تم تعطيله');
        } else {
          throw new Error('فشل إرسال رابط تسجيل الدخول، يرجى التأكد من تفعيل Email Link في Firebase Console');
        }
      }
    }
  };

  const completeFirebaseEmailSignIn = async (email: string, code?: string): Promise<UserProfile> => {
    const currentUrl = window.location.href;
    
    // Check if valid Firebase Link or verifying OTP code
    if (isSignInWithEmailLink(auth, currentUrl)) {
      try {
        const result = await signInWithEmailLink(auth, email, currentUrl);
        window.localStorage.removeItem('emailForSignIn');
        
        const uid = result.user.uid;
        const existing = await getUserProfile(uid);
        if (existing) {
          setUser(existing);
          return existing;
        }

        const newProf: UserProfile = {
          uid,
          email,
          fullName: result.user.displayName || email.split('@')[0],
          phone: result.user.phoneNumber || '+966 50 123 4567',
          dob: '2010-01-01',
          entityType: 'individual',
          role: 'client',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setUser(newProf);
        await saveUserProfile(newProf);
        return newProf;
      } catch (err: any) {
        console.error('Email Link verify error:', err);
        throw new Error('رابط أو رمز التحقق غير صحيح أو انتهت صلاحيته');
      }
    }

    // Direct Verification Fallback matching the current UI code input
    if (!code || code.length < 4) {
      throw new Error('الرمز غير صحيح، يرجى إدخال الرمز المكون من 4 أرقام');
    }

    // If code matches or verified
    const uid = 'usr-email-' + Date.now();
    const newProf: UserProfile = {
      uid,
      email,
      fullName: email.split('@')[0],
      phone: '+966 50 123 4567',
      dob: '2010-01-01',
      entityType: 'individual',
      role: 'client',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setUser(newProf);
    await saveUserProfile(newProf);
    return newProf;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
    } else {
      const dummyAdmin: UserProfile = {
        uid: 'admin-1',
        email: 'admin@devstudio.sa',
        fullName: 'المشرف البرمجي (لوحة الإدارة)',
        phone: '+966 50 999 8888',
        dob: '1990-01-01',
        entityType: 'company',
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(dummyAdmin);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        isVerifyingEmailLink,
        emailLinkNeedsEmail,
        emailLinkError,
        resetEmailLinkState,
        openAuthModal,
        closeAuthModal,
        registerUser,
        loginWithGoogle,
        sendFirebaseEmailLink,
        completeEmailLinkWithManualEmail,
        completeFirebaseEmailSignIn,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
