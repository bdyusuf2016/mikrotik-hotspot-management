import React, { useState } from 'react';
import { useAuthStore } from './stores/authStore.js';
import { LoginPage } from './pages/LoginPage.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar, type NavTab } from './components/Sidebar.js';
import { MockModeBanner } from './components/MockModeBanner.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { DiagnosticsPage } from './pages/DiagnosticsPage.js';
import { UsersPage } from './pages/UsersPage.js';
import { PackagesPage } from './pages/PackagesPage.js';
import { VouchersPage } from './pages/VouchersPage.js';
import { ActiveSessionsPage } from './pages/ActiveSessionsPage.js';
import { ConnectorsPage } from './pages/ConnectorsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { PaymentsPage } from './pages/PaymentsPage.js';
import { AuditLogsPage } from './pages/AuditLogsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} />;
      case 'diagnostics':
        return <DiagnosticsPage />;
      case 'users':
        return <UsersPage />;
      case 'packages':
        return <PackagesPage />;
      case 'vouchers':
        return <VouchersPage />;
      case 'sessions':
        return <ActiveSessionsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'connectors':
        return <ConnectorsPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <MockModeBanner />
      <Navbar />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};
