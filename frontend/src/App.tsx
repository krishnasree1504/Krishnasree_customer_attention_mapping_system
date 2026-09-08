import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { StoresPage } from './pages/StoresPage';
import { CamerasPage } from './pages/CamerasPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { VideoAnalysisPage } from './pages/VideoAnalysisPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const getRoleDashboardPath = useCallback((role?: string) => {
    if (role === 'Admin') return '/admin';
    if (role === 'Analyst') return '/analyst';
    if (role === 'Store Manager') return '/store-manager';
    return '/dashboard';
  }, []);

  // Synchronize route and enforce route guarding
  useEffect(() => {
    if (isLoading) return;

    const path = window.location.pathname;

    // SCENARIO 1: Unauthenticated user
    if (!isAuthenticated || !user) {
      if (path === '/register') {
        setAuthView('register');
      } else {
        setAuthView('login');
        if (path !== '/login') {
          window.history.replaceState(null, '', '/login');
        }
      }
      return;
    }

    // SCENARIO 2: Authenticated user
    // If arriving from login, register, or root: redirect to role-based dashboard
    if (path === '/login' || path === '/register' || path === '/' || path === '/dashboard') {
      const target = getRoleDashboardPath(user.role);
      setActiveTab('dashboard');
      window.history.replaceState(null, '', target);
      return;
    }

    // Check specific protected routes
    if (path === '/admin') {
      if (user.role === 'Admin') {
        setActiveTab('dashboard');
      } else {
        // Redirect unauthorized role to their appropriate dashboard
        const target = getRoleDashboardPath(user.role);
        setActiveTab('dashboard');
        window.history.replaceState(null, '', target);
      }
    } else if (path === '/analyst') {
      if (user.role === 'Analyst' || user.role === 'Admin') {
        setActiveTab('dashboard');
      } else {
        const target = getRoleDashboardPath(user.role);
        setActiveTab('dashboard');
        window.history.replaceState(null, '', target);
      }
    } else if (path === '/store-manager') {
      if (user.role === 'Store Manager' || user.role === 'Admin') {
        setActiveTab('dashboard');
      } else {
        const target = getRoleDashboardPath(user.role);
        setActiveTab('dashboard');
        window.history.replaceState(null, '', target);
      }
    } else if (path === '/attention-analytics' || path === '/analytics') {
      setActiveTab('analytics');
    } else if (path === '/video-analysis' || path === '/video') {
      setActiveTab('video');
    } else if (path === '/stores') {
      setActiveTab('stores');
    } else if (path === '/cameras') {
      setActiveTab('cameras');
    } else if (path === '/reports') {
      setActiveTab('reports');
    } else if (path === '/settings') {
      setActiveTab('settings');
    }
  }, [isLoading, isAuthenticated, user, getRoleDashboardPath]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;

      if (!isAuthenticated || !user) {
        if (path === '/register') {
          setAuthView('register');
        } else {
          setAuthView('login');
          window.history.replaceState(null, '', '/login');
        }
        return;
      }

      if (path === '/admin' || path === '/analyst' || path === '/store-manager' || path === '/dashboard' || path === '/') {
        setActiveTab('dashboard');
      } else if (path === '/stores') {
        setActiveTab('stores');
      } else if (path === '/cameras') {
        setActiveTab('cameras');
      } else if (path === '/attention-analytics' || path === '/analytics') {
        setActiveTab('analytics');
      } else if (path === '/video-analysis' || path === '/video') {
        setActiveTab('video');
      } else if (path === '/reports') {
        setActiveTab('reports');
      } else if (path === '/settings') {
        setActiveTab('settings');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, user]);

  const handleNavigateTab = (tab: NavTab) => {
    setActiveTab(tab);
    let targetPath = '/dashboard';
    if (tab === 'dashboard') {
      targetPath = getRoleDashboardPath(user?.role);
    } else if (tab === 'stores') {
      targetPath = '/stores';
    } else if (tab === 'cameras') {
      targetPath = '/cameras';
    } else if (tab === 'analytics') {
      targetPath = '/attention-analytics';
    } else if (tab === 'video') {
      targetPath = '/video-analysis';
    } else if (tab === 'reports') {
      targetPath = '/reports';
    } else if (tab === 'settings') {
      targetPath = '/settings';
    }
    window.history.pushState(null, '', targetPath);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00E676]/30 border-t-[#00E676] rounded-full animate-spin" />
          <p className="text-xs font-bold tracking-wider uppercase text-[#64748B]">
            Initializing CAM System...
          </p>
        </div>
      </div>
    );
  }

  // If user is not logged in, strictly render authentication flow
  if (!isAuthenticated || !user) {
    if (authView === 'register') {
      return (
        <RegisterPage
          onNavigateToLogin={() => {
            setAuthView('login');
            window.history.replaceState(null, '', '/login');
          }}
        />
      );
    }
    return (
      <LoginPage
        onNavigateToRegister={() => {
          setAuthView('register');
          window.history.replaceState(null, '', '/register');
        }}
      />
    );
  }

  // Main Dashboard Shell with Clean White theme layout (#F8FAFC canvas, #FFFFFF cards)
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex transition-colors font-sans selection:bg-[#00E676] selection:text-slate-950">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Sticky Top Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
        />

        {/* Dynamic Tab Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardPage onNavigateTab={handleNavigateTab} />
          )}
          {activeTab === 'stores' && <StoresPage />}
          {activeTab === 'cameras' && <CamerasPage />}
          {activeTab === 'analytics' && (
            <AnalyticsPage onNavigateTab={handleNavigateTab} />
          )}
          {activeTab === 'video' && <VideoAnalysisPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
