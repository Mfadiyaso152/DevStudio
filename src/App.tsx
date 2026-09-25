import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { BottomBar } from './components/BottomBar';
import { PageTransitionView } from './components/PageTransitionView';
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
  const { isAuthenticated, user } = useAuth();
  const { currentPath, navigate } = useNavigation();

  const isAdmin = 
    user?.email?.toLowerCase() === 'mfb.15@icloud.com' || 
    user?.email?.toLowerCase() === 'mfb-15@hotmail.com' || 
    user?.role === 'admin';

  const isProfileComplete = Boolean(
    user?.fullName?.trim() && 
    user?.phone?.trim() && 
    user?.dob?.trim()
  );

  // Auto-redirect upon authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        if (currentPath === '/landing' || currentPath === '/' || currentPath === '/auth') {
          navigate('/admin');
        }
      } else if (!isProfileComplete) {
        if (currentPath !== '/auth') {
          navigate('/auth');
        }
      } else {
        if (currentPath === '/landing' || currentPath === '/' || currentPath === '/auth') {
          navigate('/home');
        }
      }
    }
  }, [isAuthenticated, isAdmin, isProfileComplete, currentPath, navigate]);

  // If user is Admin, they are strictly in the Admin workspace
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
        return isAuthenticated ? <HomePage openQuoteModal={() => navigate('/quote-request')} navigate={navigate} /> : <LandingPage navigate={navigate} />;

      default:
        return <LandingPage navigate={navigate} />;
    }
  };

  return (
    <div 
      className={`min-h-screen font-['Tajawal',sans-serif] flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-x-hidden ${
        isLandingOrAuth 
          ? 'bg-slate-950 text-slate-100 pb-0' 
          : 'bg-slate-50 text-slate-900 pb-28 sm:pb-32'
      }`} 
      dir="rtl"
    >
      <main className="flex-1 flex flex-col w-full">
        <PageTransitionView pageKey={currentPath}>
          {renderPage()}
        </PageTransitionView>
      </main>

      {/* Modern iOS Glassmorphic Bottom Navigation Bar */}
      {!isLandingOrAuth && (
        <BottomBar />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}
