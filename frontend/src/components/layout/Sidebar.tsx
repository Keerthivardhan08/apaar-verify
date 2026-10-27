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
    <aside className="w-64 liquid-glass-dark text-slate-300 min-h-screen flex flex-col shrink-0 border-r border-slate-800/80 z-20 backdrop-blur-2xl">
      {/* Brand logo & title with subtle glowing accent */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/60 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-white text-base tracking-tight block leading-tight">
            APAAR Verify
          </span>
          <span className="text-[10px] text-indigo-300/80 font-bold tracking-wider uppercase">
            {isAICTEAdmin() ? 'Central AICTE Portal' : 'Institution Node'}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400/80 uppercase tracking-widest">
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
                `group flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white hover:translate-x-0.5'
                }`
              }
            >
              <Icon className="w-4 h-4 mr-3 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer System Status Badge */}
      <div className="p-4 border-t border-slate-800/60 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">Integrity Node</span>
          </div>
          <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">v0.1.0</span>
        </div>
        <p className="text-slate-400/80 text-[10px] leading-tight mt-1">
          MoE / AICTE Academic Data Compliance
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
