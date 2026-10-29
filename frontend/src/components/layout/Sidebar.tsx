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
  LineChart,
  GraduationCap,
  Network,
  QrCode,
  Key,
  Clock,
  Sparkles,
  Search,
  GitBranch,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isAICTEAdmin, isReviewer } = useAuth();
  const isAicteStaff = isAICTEAdmin() || isReviewer();

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
    { label: 'Student Portal', to: '/student', icon: GraduationCap },
    { label: 'Public Verifier', to: '/verify', icon: QrCode },
  ];

  const aicteNavItems = [
    { label: 'Command Center', to: '/aicte', icon: LayoutDashboard, end: true },
    { label: 'Institutions Directory', to: '/aicte/institutions', icon: Building2 },
    { label: 'Student & APAAR Inspector', to: '/aicte/student-inspector', icon: Search },
    { label: 'Case Tracking & Timeline', to: '/aicte/tracking', icon: GitBranch },
    { label: 'Stakeholder Governance', to: '/aicte/stakeholders', icon: ShieldCheck },
    { label: 'Integrity Monitoring', to: '/aicte/integrity', icon: AlertTriangle },
    { label: 'Integrity Graph', to: '/aicte/graph', icon: Network },
    { label: 'Review Queue', to: '/aicte/reviews', icon: CheckSquare },
    { label: 'Freshness & SLA', to: '/aicte/freshness', icon: Clock },
    { label: 'Statutory Reports', to: '/aicte/reports', icon: FileSpreadsheet },
    { label: 'Analytics', to: '/aicte/analytics', icon: LineChart },
  ];

  const navItems = isAicteStaff ? aicteNavItems : institutionNavItems;

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
            {isAicteStaff ? 'Central AICTE Apex' : 'Institution Node'}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400/80 uppercase tracking-widest">
          {isAicteStaff ? 'Apex Regulatory Suite' : 'Academic Workspace'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
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

      {/* Security Status Footer Pill */}
      <div className="p-3 border-t border-slate-800/60 text-center">
        <div className="text-[10px] text-slate-400 bg-slate-800/40 py-1.5 px-2 rounded-lg border border-slate-700/50 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>PKI RS256 Trust Active</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
