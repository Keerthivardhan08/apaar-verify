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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Stakeholder Governance & Authorization Desk
              </h1>
              <p className="text-sm text-slate-400">
                AICTE Regulatory Access Control for External Verification Agencies, Examination Bodies, & Corporates
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStakeholders}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Registry</span>
          </button>
        </div>
      </div>

      {/* Mandatory Privacy & Student Consent Directive Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-900/60 p-5 shadow-xl">
        <div className="flex items-start space-x-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                MoE / AICTE Privacy Architecture
              </span>
              <span className="text-xs text-indigo-300 font-semibold">
                Strict Zero-Trust Credential Scoping
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Default Access Restricted Solely to Parent Institution & AICTE
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Approved stakeholders (e.g. NTA, TCS, Infosys) are <span className="text-amber-200 font-semibold">NOT permitted</span> to access or view any student’s academic records or APAAR transcripts without the student’s <span className="text-emerald-300 font-semibold">explicit prior digital authorization</span>. Whenever an external agency queries an APAAR ID, the platform verifies whether the applicant has granted consent. If not granted, access remains locked.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Registered</div>
            <div className="text-2xl font-bold text-white mt-1">{totalCount} Entities</div>
          </div>
          <Building2 className="w-8 h-8 text-indigo-400 opacity-80" />
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-400">AICTE Approved</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1">{approvedCount} Active</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-400">Pending Review</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">{pendingCount} Awaiting</div>
          </div>
          <Clock className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-400">Consent Gated</div>
            <div className="text-2xl font-bold text-blue-300 mt-1">100% Enforced</div>
          </div>
          <Lock className="w-8 h-8 text-blue-400 opacity-80" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by stakeholder name, email or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400">Filter:</span>
          {(['all', 'approved', 'pending_approval'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-md transition ${
                filterStatus === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
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

      {/* Stakeholders Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStakeholders.map((s) => {
          const isApproved = s.registration_status === 'approved';
          const isUpdating = updatingId === s.id;

          return (
            <div
              key={s.id}
              className={`rounded-2xl border p-5 bg-slate-800/50 backdrop-blur-sm transition-all duration-200 flex flex-col justify-between ${
                isApproved
                  ? 'border-slate-700/80 hover:border-indigo-500/50'
                  : 'border-amber-500/30 bg-amber-950/10'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        s.entity_type === 'GOVERNMENT_EXAM_BODY'
                          ? 'bg-purple-950/50 border-purple-500/30 text-purple-400'
                          : s.entity_type === 'CORPORATE_EMPLOYER'
                          ? 'bg-blue-950/50 border-blue-500/30 text-blue-400'
                          : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
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
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {s.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {s.contact_email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                      isApproved
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isApproved ? 'AICTE Approved' : 'Pending Review'}
                  </span>
                </div>

                {/* Purpose */}
                <div className="text-xs text-slate-300 bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Declared Verification Purpose
                  </span>
                  {s.purpose}
                </div>

                {/* Permitted claims */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Permitted Attribute Scopes (Zero-Trust Gated)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {s.permitted_fields.map((field) => (
                      <span
                        key={field}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-300 font-mono"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Approval details */}
                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-700/50 flex items-center justify-between">
                  <span>Registered: {s.applied_date}</span>
                  {s.approved_by && (
                    <span className="text-emerald-400 font-medium truncate max-w-[200px]">
                      By: {s.approved_by}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-700/50">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleToggleApproval(s.id, s.registration_status)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                    isApproved
                      ? 'bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  } disabled:opacity-50`}
                >
                  {isApproved ? (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Revoke / Suspend Authorization</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
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
