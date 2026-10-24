import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  History,
  AlertTriangle,
  FileEdit,
  BarChart3,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  CheckSquare,
  FileSearch,
  LineChart,
  GraduationCap,
  Network,
  QrCode,
  Key,
  Clock,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isAICTEAdmin } = useAuth();

  const institutionNavItems = [
    { label: 'Overview', to: '/institution', icon: LayoutDashboard, end: true },
    { label: 'Students', to: '/institution/students', icon: Users },
    { label: 'Upload Data', to: '/institution/upload', icon: UploadCloud },
    { label: 'APAAR Quick Desk', to: '/institution/apaar-desk', icon: Sparkles },
    { label: 'Upload History', to: '/institution/uploads', icon: History },
    { label: 'Validation Issues', to: '/institution/issues', icon: AlertTriangle },
    { label: 'Corrections', to: '/institution/corrections', icon: FileEdit },
    { label: 'Intake & Quotas Desk', to: '/institution/compliance', icon: BarChart3 },
    { label: 'Intake Monitoring', to: '/institution/intake', icon: FileSpreadsheet },
    { label: 'Reports', to: '/institution/reports', icon: FileSpreadsheet },
    { label: 'Campus ERP & APIs', to: '/institution/api-keys', icon: Key },
    { label: 'Public Verifier', to: '/verify', icon: QrCode },
  ];

  const aicteNavItems = [
    { label: 'Overview', to: '/aicte', icon: LayoutDashboard, end: true },
    { label: 'Institutions', to: '/aicte/institutions', icon: Building2 },
    { label: 'Integrity Monitoring', to: '/aicte/integrity', icon: ShieldCheck },
    { label: 'Integrity Graph', to: '/aicte/graph', icon: Network },
    { label: 'Integrations & Trust', to: '/aicte/integrations', icon: Key },
    { label: 'Freshness & SLA', to: '/aicte/freshness', icon: Clock },
    { label: 'Review Queue', to: '/aicte/reviews', icon: CheckSquare },
    { label: 'Audit Explorer', to: '/aicte/audit', icon: FileSearch },
    { label: 'Statutory Reports', to: '/aicte/reports', icon: FileSpreadsheet },
    { label: 'Analytics', to: '/aicte/analytics', icon: LineChart },
    { label: 'Public Verifier', to: '/verify', icon: QrCode },
  ];

  const navItems = isAICTEAdmin() ? aicteNavItems : institutionNavItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand logo & title */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight block leading-tight">
            APAAR Verify
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
            {isAICTEAdmin() ? 'Central AICTE Portal' : 'Institution Node'}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {isAICTEAdmin() ? 'Regulatory Operations' : 'Academic Workspace'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-3 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span>APAAR Integrity Node</span>
          <span className="text-emerald-400 font-mono">v0.1.0</span>
        </div>
        <p className="text-slate-400 leading-tight">
          Ministry of Education / AICTE Academic Data Compliance
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
