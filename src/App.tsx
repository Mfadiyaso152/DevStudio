import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BottomBar } from './components/BottomBar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { RequestsPage } from './pages/RequestsPage';
import { QuoteRequestPage } from './pages/QuoteRequestPage';
import { WarrantyPage } from './pages/WarrantyPage';
import { PaymentPage } from './pages/PaymentPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { MOCK_PROJECTS } from './lib/mockData';

export function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();

  const isAdmin = user?.email?.toLowerCase() === 'mfb.15@icloud.com' || 
                  user?.email?.toLowerCase() === 'mfb-15@hotmail.com' || 
                  user?.role === 'admin';

  const [currentPath, setCurrentPath] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.includes('/auth') || path.includes('/login')) return '/auth';
    if (path.includes('/home')) return '/home';
    if (path.includes('/requests')) return '/requests';
    if (path.includes('/quote-request')) return '/quote-request';
    if (path.includes('/warranty')) return '/warranty';
    if (path.includes('/payment')) return '/payment';
    if (path.includes('/profile')) return '/profile';
    if (path.includes('/admin')) return '/admin';
    return '/landing';
  });

  // If user is already authenticated and visits root or landing, seamlessly direct to /home or /admin
  useEffect(() => {
    if (isAuthenticated) {
      if (currentPath === '/landing' || currentPath === '/' || currentPath === '/auth') {
        const target = isAdmin ? '/admin' : '/home';
        setCurrentPath(target);
        window.history.replaceState({}, '', target);
      }
    }
  }, [isAuthenticated, isAdmin, currentPath]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '' || path.includes('/landing')) setCurrentPath('/landing');
      else if (path.includes('/auth') || path.includes('/login')) setCurrentPath('/auth');
      else if (path.includes('/home')) setCurrentPath('/home');
      else if (path.includes('/requests')) setCurrentPath('/requests');
      else if (path.includes('/quote-request')) setCurrentPath('/quote-request');
      else if (path.includes('/warranty')) setCurrentPath('/warranty');
      else if (path.includes('/payment')) setCurrentPath('/payment');
      else if (path.includes('/profile')) setCurrentPath('/profile');
      else if (path.includes('/admin')) setCurrentPath('/admin');
      else setCurrentPath('/landing');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is Admin (mfb.15@icloud.com), they are strictly in the Admin workspace
  if (isAdmin && isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-['Tajawal',sans-serif] selection:bg-indigo-500 selection:text-white" dir="rtl">
        <AdminPage />
      </div>
    );
  }

  const isLandingOrAuth = currentPath === '/landing' || currentPath === '/' || currentPath === '/auth';

  const renderPage = () => {
    switch (currentPath) {
      case '/landing':
      case '/':
        return <LandingPage navigate={navigate} />;

      case '/auth':
      case '/login':
        return <AuthPage navigate={navigate} />;

      case '/home':
        return <HomePage openQuoteModal={() => navigate('/quote-request')} navigate={navigate} />;

      case '/requests':
      case '/my-requests':
        return <RequestsPage navigate={navigate} />;

      case '/quote-request':
        return <QuoteRequestPage navigate={navigate} />;

      case '/warranty':
        return <WarrantyPage project={MOCK_PROJECTS[0]} navigate={navigate} />;

      case '/payment':
      case '/payments':
        return <PaymentPage />;

      case '/profile':
      case '/account':
        return <ProfilePage openAuthModal={() => navigate('/auth')} />;

      case '/admin':
        // Secret Admin route: If not admin, redirect to home or landing
        return isAuthenticated ? <HomePage openQuoteModal={() => navigate('/quote-request')} navigate={navigate} /> : <LandingPage navigate={navigate} />;

      default:
        return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div className={`min-h-screen font-['Tajawal',sans-serif] flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative ${
      isLandingOrAuth ? 'bg-slate-950 text-slate-100 pb-0' : 'bg-slate-50 text-slate-900 pb-28'
    }`} dir="rtl">
      
      {/* NO TOP NAVBAR AT ALL ON LANDING OR FULL APP AS REQUESTED */}
      
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* FLOATING CYLINDRICAL GLASS BOTTOM NAVIGATION BAR */}
      {!isLandingOrAuth && (
        <BottomBar currentPath={currentPath} navigate={navigate} />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
