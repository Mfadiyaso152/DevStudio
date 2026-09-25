import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface NavTabItem {
  id: string;
  path: string;
  label: string;
  badge?: number | string;
}

export const MAIN_TABS: NavTabItem[] = [
  { id: 'home', path: '/home', label: 'الرئيسية' },
  { id: 'requests', path: '/requests', label: 'طلباتي' },
  { id: 'payment', path: '/payment', label: 'الدفع' },
  { id: 'profile', path: '/profile', label: 'حسابي' },
];

interface NavigationContextType {
  currentPath: string;
  previousPath: string;
  currentTabIndex: number;
  direction: number; // 1 for forward, -1 for backward
  navigate: (path: string, customDirection?: number) => void;
  goBack: () => void;
  nextTab: () => void;
  prevTab: () => void;
  isMainTab: boolean;
  canSwipe: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const getTabIndex = (path: string): number => {
  if (path === '/' || path.includes('/landing')) return -1;
  if (path.includes('/auth') || path.includes('/login')) return -1;
  if (path.includes('/home')) return 0;
  if (path.includes('/requests') || path.includes('/my-requests')) return 1;
  if (path.includes('/payment') || path.includes('/payments')) return 2;
  if (path.includes('/profile') || path.includes('/account')) return 3;
  if (path.includes('/quote-request')) return 10;
  if (path.includes('/warranty')) return 11;
  if (path.includes('/admin')) return 99;
  return 0;
};

const normalizePath = (path: string): string => {
  if (path.includes('/auth') || path.includes('/login')) return '/auth';
  if (path.includes('/home')) return '/home';
  if (path.includes('/requests') || path.includes('/my-requests')) return '/requests';
  if (path.includes('/quote-request')) return '/quote-request';
  if (path.includes('/warranty')) return '/warranty';
  if (path.includes('/payment') || path.includes('/payments')) return '/payment';
  if (path.includes('/profile') || path.includes('/account')) return '/profile';
  if (path.includes('/admin')) return '/admin';
  return '/landing';
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizePath(window.location.pathname);
  });
  const [previousPath, setPreviousPath] = useState<string>('/landing');
  const [direction, setDirection] = useState<number>(0);

  const currentTabIndex = useMemo(() => getTabIndex(currentPath), [currentPath]);
  const isMainTab = currentTabIndex >= 0 && currentTabIndex <= 3;
  const canSwipe = isMainTab;

  const navigate = useCallback((targetPath: string, customDirection?: number) => {
    const norm = normalizePath(targetPath);
    if (norm === currentPath) return;

    const oldIndex = getTabIndex(currentPath);
    const newIndex = getTabIndex(norm);

    let calculatedDirection = 0;
    if (customDirection !== undefined) {
      calculatedDirection = customDirection;
    } else if (oldIndex !== -1 && newIndex !== -1) {
      // In RTL Arabic, increasing index goes forward (leftward)
      calculatedDirection = newIndex > oldIndex ? 1 : -1;
    } else {
      calculatedDirection = 1;
    }

    setDirection(calculatedDirection);
    setPreviousPath(currentPath);
    setCurrentPath(norm);
    window.history.pushState({}, '', norm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPath]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/home', -1);
    }
  }, [navigate]);

  const nextTab = useCallback(() => {
    if (currentTabIndex >= 0 && currentTabIndex < MAIN_TABS.length - 1) {
      const nextTabItem = MAIN_TABS[currentTabIndex + 1];
      navigate(nextTabItem.path, 1);
    }
  }, [currentTabIndex, navigate]);

  const prevTab = useCallback(() => {
    if (currentTabIndex > 0 && currentTabIndex <= MAIN_TABS.length - 1) {
      const prevTabItem = MAIN_TABS[currentTabIndex - 1];
      navigate(prevTabItem.path, -1);
    }
  }, [currentTabIndex, navigate]);

  // Sync with browser popstate (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const norm = normalizePath(window.location.pathname);
      const oldIndex = getTabIndex(currentPath);
      const newIndex = getTabIndex(norm);
      setDirection(newIndex < oldIndex ? -1 : 1);
      setPreviousPath(currentPath);
      setCurrentPath(norm);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPath]);

  return (
    <NavigationContext.Provider
      value={{
        currentPath,
        previousPath,
        currentTabIndex,
        direction,
        navigate,
        goBack,
        nextTab,
        prevTab,
        isMainTab,
        canSwipe,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
