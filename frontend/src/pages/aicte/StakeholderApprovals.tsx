import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  FileBadge,
  Eye,
  Key,
  HelpCircle,
  Clock,
  Briefcase,
  Users,
  Shield,
  Sparkles,
  Check,
} from 'lucide-react';
import { consentApi } from '../../services/api';
import toast from 'react-hot-toast';

interface Stakeholder {
  id: string;
  name: string;
  entity_type: string;
  purpose: string;
  contact_email: string;
  registration_status: 'approved' | 'pending_approval' | 'suspended';
  applied_date: string;
  approved_by?: string | null;
  permitted_fields: string[];
}

export const StakeholderApprovals: React.FC = () => {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStakeholders = async () => {
    setLoading(true);
    try {
      const data = await consentApi.getStakeholders();
      setStakeholders(data);
    } catch (err: any) {
      toast.error('Failed to load stakeholder registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStakeholders();
  }, []);

  const handleToggleApproval = async (id: string, currentStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await consentApi.toggleStakeholderApproval(id);
      toast.success(
        res.stakeholder.registration_status === 'approved'
          ? 'Stakeholder approved and authorized for student-consent verification requests'
          : 'Stakeholder authorization suspended'
      );
      setStakeholders((prev) =>
        prev.map((s) => (s.id === id ? res.stakeholder : s))
      );
    } catch (err: any) {
      toast.error('Failed to update stakeholder status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStakeholders = stakeholders.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || s.registration_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalCount = stakeholders.length;
  const approvedCount = stakeholders.filter((s) => s.registration_status === 'approved').length;
  const pendingCount = stakeholders.filter((s) => s.registration_status === 'pending_approval').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
      {/* Executive Command Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/40 p-6 sm:p-8 text-white shadow-xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>AICTE Zero-Trust Access Protocol • Enforced</span>
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">IST Realtime Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Stakeholder Governance & Authorization Desk</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Regulatory access control for third-party verification agencies (NTA, recruitments, screening agencies). External entities can access candidate records <span className="text-emerald-300 font-bold">ONLY AFTER explicit student consent</span> from their APAAR Student Portal.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={fetchStakeholders}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition border border-indigo-400/40 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Registry</span>
            </button>
          </div>
        </div>

        {/* Mandatory Student Consent Directive Pill */}
        <div className="relative mt-5 pt-4 border-t border-slate-800/80 flex items-start gap-3 text-xs text-slate-300">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-amber-200 font-bold uppercase tracking-wider text-[11px] mr-1.5">Zero-Trust Scoping Rule:</span>
            No third-party stakeholder may view student academic credentials without prior student-approved verification authorization. Queries without consent are permanently blocked.
          </div>
        </div>
      </div>

      {/* KPI Stats — High-Contrast Solid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="bg-white rounded-2xl border-2 border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Registered</div>
            <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
              {totalCount} <span className="text-sm font-bold text-slate-500">Entities</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Verification agencies & employers</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* AICTE Approved */}
        <div className="bg-white rounded-2xl border-2 border-emerald-300 p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-800">AICTE Approved</div>
            <div className="text-3xl font-black text-emerald-950 mt-1 tracking-tight">
              {approvedCount} <span className="text-sm font-bold text-emerald-700">Active</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Authorized for consent requests</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-800">Pending Review</div>
            <div className="text-3xl font-black text-amber-950 mt-1 tracking-tight">
              {pendingCount} <span className="text-sm font-bold text-amber-700">Awaiting</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">Pending AICTE vetting & clearance</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-300 text-amber-700 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Consent Gated */}
        <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-blue-800">Consent Gated</div>
            <div className="text-3xl font-black text-blue-950 mt-1 tracking-tight">
              100% <span className="text-sm font-bold text-blue-700">Enforced</span>
            </div>
            <div className="text-[11px] text-blue-700 font-medium mt-1">Zero-trust student approval lock</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-300 text-blue-700 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Lock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar — Clean Solid White Container */}
      <div className="bg-white p-4 rounded-2xl border-2 border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by stakeholder name, email or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-extrabold text-slate-600">Filter:</span>
          {(['all', 'approved', 'pending_approval'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition ${
                filterStatus === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tab === 'all'
                ? 'All Stakeholders'
                : tab === 'approved'
                ? 'Approved'
                : 'Pending Review'}
            </button>
          ))}
        </div>
      </div>

      {/* Stakeholders Cards Grid — High Contrast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredStakeholders.map((s) => {
          const isApproved = s.registration_status === 'approved';
          const isUpdating = updatingId === s.id;

          return (
            <div
              key={s.id}
              className={`rounded-2xl border-2 p-6 bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                isApproved
                  ? 'border-slate-200/90 hover:border-indigo-400'
                  : 'border-amber-300 bg-amber-50/15'
              }`}
            >
              <div className="space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                        s.entity_type === 'GOVERNMENT_EXAM_BODY'
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : s.entity_type === 'CORPORATE_EMPLOYER'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      {s.entity_type === 'GOVERNMENT_EXAM_BODY' ? (
                        <FileBadge className="w-5 h-5" />
                      ) : s.entity_type === 'CORPORATE_EMPLOYER' ? (
                        <Briefcase className="w-5 h-5" />
                      ) : (
                        <Users className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                        {s.name}
                      </h3>
                      <p className="text-xs text-indigo-700 font-mono mt-0.5 font-bold">
                        {s.contact_email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase shadow-sm ${
                      isApproved
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : 'bg-amber-500 text-white shadow-amber-500/20'
                    }`}
                  >
                    {isApproved ? 'AICTE APPROVED' : 'PENDING REVIEW'}
                  </span>
                </div>

                {/* Purpose */}
                <div className="text-xs text-slate-700 bg-slate-50 rounded-xl p-3.5 border border-slate-200 leading-relaxed font-medium">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Declared Verification Purpose
                  </span>
                  {s.purpose}
                </div>

                {/* Permitted claims */}
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                    Permitted Attribute Scopes (Zero-Trust Gated)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {s.permitted_fields.map((field) => (
                      <span
                        key={field}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Approval details */}
                <div className="pt-3 text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between font-medium">
                  <span>Registered: <strong className="text-slate-700">{s.applied_date}</strong></span>
                  {s.approved_by && (
                    <span className="text-emerald-700 font-bold truncate max-w-[200px]">
                      Approved by: {s.approved_by}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleToggleApproval(s.id, s.registration_status)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 shadow-sm ${
                    isApproved
                      ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                  } disabled:opacity-50`}
                >
                  {isApproved ? (
                    <>
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Revoke / Suspend Authorization</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Grant AICTE Approval</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StakeholderApprovals;
