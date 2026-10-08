import React from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ModalVehicleDetail from './components/ModalVehicleDetail';

// Views
import DashboardView from './views/DashboardView';
import CctvView from './views/CctvView';
import CheckInView from './views/CheckInView';
import CheckOutView from './views/CheckOutView';
import SlotsView from './views/SlotsView';
import VehicleFinderView from './views/VehicleFinderView';
import DailySummaryView from './views/DailySummaryView';
import ReportsView from './views/ReportsView';
import RegisteredVehiclesView from './views/RegisteredVehiclesView';
import CameraSettingsView from './views/CameraSettingsView';
import SettingsView from './views/SettingsView';

export default function App() {
  const { currentTab } = useApp();

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'cctv':
        return <CctvView />;
      case 'checkin':
        return <CheckInView />;
      case 'checkout':
        return <CheckOutView />;
      case 'slots':
        return <SlotsView />;
      case 'finder':
        return <VehicleFinderView />;
      case 'summary':
        return <DailySummaryView />;
      case 'reports':
        return <ReportsView />;
      case 'registered':
        return <RegisteredVehiclesView />;
      case 'cameras':
        return <CameraSettingsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-darkest)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Top Header */}
        <TopBar />

        {/* Dynamic Viewport */}
        <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          {renderCurrentView()}
        </main>
      </div>

      {/* Telemetry Inspector Modal */}
      <ModalVehicleDetail />
    </div>
  );
}
