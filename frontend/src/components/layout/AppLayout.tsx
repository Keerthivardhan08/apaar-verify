import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DemoBanner from './DemoBanner';
import ErrorBoundary from '../ui/ErrorBoundary';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen relative flex flex-col bg-slate-50/90 text-slate-900 font-sans overflow-x-hidden">
      {/* Ambient Liquid Light Orbs behind the frosted glass cards */}
      <div className="liquid-orb-1" />
      <div className="liquid-orb-2" />
      <div className="liquid-orb-3" />

      {/* Subtle Grid Accent Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.025] z-0"
        style={{
          backgroundImage: `radial-gradient(#4338ca 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Persistent Demonstration Notice Banner */}
      <div className="relative z-40">
        <DemoBanner />
      </div>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header />
          <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto relative z-10">
            <ErrorBoundary fallbackTitle="View Rendering Encountered an Issue">
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
