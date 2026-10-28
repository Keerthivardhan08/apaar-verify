import React, { useState, useEffect } from 'react';
import { InstitutionPortfolio } from '../../types';
import { institutionApi } from '../../services/api';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  Award,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  PieChart,
  BarChart3,
  ExternalLink,
  School,
  XCircle,
  HelpCircle,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface InstitutePortfolioModalProps {
  institutionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenComplianceDesk?: (id: string) => void;
}

export const InstitutePortfolioModal: React.FC<InstitutePortfolioModalProps> = ({
  institutionId,
  isOpen,
  onClose,
  onOpenComplianceDesk,
}) => {
  const [portfolio, setPortfolio] = useState<InstitutionPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analytical' | 'categories' | 'accreditation' | 'complaints' | 'approvals'>('analytical');

  useEffect(() => {
    if (isOpen && institutionId) {
      loadPortfolio(institutionId);
    } else {
      setPortfolio(null);
      setError(null);
    }
  }, [isOpen, institutionId]);

  const loadPortfolio = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await institutionApi.getInstitutionPortfolio(id);
      setPortfolio(data);
    } catch (err: any) {
      console.error('Failed to load portfolio:', err);
      setError(err?.response?.data?.detail || 'Failed to load institution portfolio.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={portfolio ? portfolio.institution_name : 'Loading Institution Portfolio...'}
      subtitle={portfolio ? `Code: ${portfolio.institution_code} • ${portfolio.city}, ${portfolio.state} • AICTE Affiliated` : ''}
      maxWidth="2xl"
    >
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner message="Fetching accreditation, intake and governance portfolio..." />
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-gray-900 font-bold">Failed to load portfolio</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => institutionId && loadPortfolio(institutionId)}>
            Retry
          </Button>
        </div>
      ) : portfolio ? (
        <div className="space-y-5">
          {/* Top Accreditation Badges Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white shadow-md border border-indigo-800/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg text-white">{portfolio.institution_name}</span>
                    <span className="bg-indigo-600/60 text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-indigo-400/40">
                      {portfolio.institution_code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                    <span>{portfolio.institution_type.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>{portfolio.city}, {portfolio.state}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      AICTE {portfolio.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-3 py-1.5 text-center">
                  <div className="text-[10px] text-amber-200 uppercase font-bold tracking-wider">NAAC Grade</div>
                  <div className="text-sm font-extrabold text-amber-300">{portfolio.naac_grade} ({portfolio.naac_cgpa})</div>
                </div>
                <div className="bg-cyan-500/20 border border-cyan-400/40 rounded-xl px-3 py-1.5 text-center">
                  <div className="text-[10px] text-cyan-200 uppercase font-bold tracking-wider">NBA Status</div>
                  <div className="text-sm font-extrabold text-cyan-300">{portfolio.nba_tier} {portfolio.nba_status}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Analytics Quick Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Approved Intake</span>
              <span className="text-2xl font-black text-indigo-950 font-mono mt-0.5 block">
                {portfolio.total_approved_intake.toLocaleString()}
              </span>
              <span className="text-[10px] text-indigo-600 font-medium">AY 2026-27 Sanctioned Seats</span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Present Enrolled</span>
              <span className="text-2xl font-black text-emerald-950 font-mono mt-0.5 block">
                {portfolio.total_enrolled.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Verified Active APAAR Records</span>
            </div>

            <div className={`rounded-xl p-3 border ${portfolio.utilization_pct > 100 ? 'bg-rose-50/80 border-rose-200 text-rose-950' : 'bg-blue-50/70 border-blue-100 text-blue-950'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider">Capacity Utilization</span>
                {portfolio.utilization_pct > 100 && (
                  <span className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded">BREACH</span>
                )}
              </div>
              <span className="text-2xl font-black font-mono mt-0.5 block">
                {portfolio.utilization_pct}%
              </span>
              <span className="text-[10px] font-medium opacity-80">
                {portfolio.vacant_seats > 0 ? `${portfolio.vacant_seats} Vacant Seats` : 'Intake Limit Exceeded'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Complaints Desk</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {portfolio.complaints_pending}
                </span>
                <span className="text-xs text-slate-500 font-medium">Pending / {portfolio.complaints_total} Total</span>
              </div>
              <span className="text-[10px] text-slate-600 font-medium">
                {portfolio.complaints_resolution_rate}% Resolution Rate
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto">
              {[
                { id: 'analytical', label: 'Present Enrolled vs Approved', icon: BarChart3 },
                { id: 'categories', label: 'Category Seat Division', icon: PieChart },
                { id: 'accreditation', label: 'NBA & NAAC Details', icon: Award },
                { id: 'complaints', label: 'Complaints Desk', icon: ShieldCheck },
                { id: 'approvals', label: 'New Intake Approvals', icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab 1: Analytical Enrolled vs Approved Intake */}
          {activeTab === 'analytical' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Branch-Wise Intake vs Enrollment Analytics</h4>
                  <p className="text-xs text-gray-500">
                    Comparative analytical metrics across all {portfolio.programs.length} registered engineering branches.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Optimal (85–100%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Breach (&gt;100%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Vacancy Available (&lt;85%)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 font-bold text-gray-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Branch / Program</th>
                      <th className="py-2.5 px-3 text-center">Approved Intake</th>
                      <th className="py-2.5 px-3 text-center">Present Enrolled</th>
                      <th className="py-2.5 px-4 text-left">Utilization Progress</th>
                      <th className="py-2.5 px-3 text-center">Vacant Seats</th>
                      <th className="py-2.5 px-3 text-center">Integrity Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {portfolio.programs.map((prog) => {
                      const isBreach = prog.utilization_pct > 100;
                      const isLow = prog.utilization_pct < 85;
                      const barColor = isBreach ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500';

                      return (
                        <tr key={prog.program_id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-gray-900 block">{prog.program_name}</span>
                            <span className="font-mono text-[10px] text-gray-500">{prog.program_code} • {prog.branch}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-800">
                            {prog.approved_capacity}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-900">
                            {prog.enrolled_count}
                          </td>
                          <td className="py-2.5 px-4 min-w-[150px]">
                            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                              <span className="font-bold text-gray-700">{prog.utilization_pct}%</span>
                              <span className="text-gray-400">{prog.enrolled_count}/{prog.approved_capacity}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${barColor}`}
                                style={{ width: `${Math.min(prog.utilization_pct, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold">
                            {prog.vacant_seats > 0 ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {prog.vacant_seats} Seats
                              </span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isBreach ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                INTAKE EXCEEDED
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                                AVAILABLE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                OPTIMAL
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Analytical Summary Callout */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block">AICTE Automated Audit Insight:</span>
                  Institutional intake compliance is at{' '}
                  <strong className="text-slate-900">{portfolio.utilization_pct}%</strong> with{' '}
                  <strong className="text-slate-900">{portfolio.vacant_seats} vacant seats</strong> remaining. Any program exceeding
                  100% capacity triggers automated notice under AICTE Regulations Chapter II for over-admission scrutiny.
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Category Seat Division Matrix */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Statutory Seat Division & Quota Allocation Matrix</h4>
                <p className="text-xs text-gray-500">
                  AICTE and State reservation breakdown compared with actual admitted student demographics.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'general', label: 'Open / General Merit', quota: '40.5%', color: 'border-blue-300 bg-blue-50/60 text-blue-950' },
                  { key: 'obc', label: 'Other Backward Classes (OBC-NCL)', quota: '27.0%', color: 'border-emerald-300 bg-emerald-50/60 text-emerald-950' },
                  { key: 'sc', label: 'Scheduled Castes (SC)', quota: '15.0%', color: 'border-purple-300 bg-purple-50/60 text-purple-950' },
                  { key: 'st', label: 'Scheduled Tribes (ST)', quota: '7.5%', color: 'border-amber-300 bg-amber-50/60 text-amber-950' },
                  { key: 'ews', label: 'Economically Weaker Section (EWS)', quota: '10.0%', color: 'border-indigo-300 bg-indigo-50/60 text-indigo-950' },
                  { key: 'supernumerary', label: 'Supernumerary (NRI / FN / TFW)', quota: '5.0%', color: 'border-cyan-300 bg-cyan-50/60 text-cyan-950' },
                ].map((item) => {
                  const actualCount = portfolio.category_distribution[item.key] || 0;
                  const pctOfEnrolled = portfolio.total_enrolled > 0
                    ? ((actualCount / portfolio.total_enrolled) * 100).toFixed(1)
                    : '0';

                  return (
                    <div key={item.key} className={`border rounded-xl p-3 ${item.color}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                        <span className="font-mono text-[10px] font-bold bg-white/80 px-1.5 py-0.5 rounded shadow-2xs">
                          Quota: {item.quota}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xl font-black font-mono">{actualCount} Admitted</span>
                        <span className="text-xs font-semibold">{pctOfEnrolled}% of intake</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 space-y-2">
                <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Reservation Rule Verification:
                </span>
                <p>
                  Institutional category quotas align with the Supreme Court 50% reservation mandate plus 10% EWS allocation.
                  Supernumerary seats for Tuition Fee Waiver (TFW), Jammu & Kashmir Migrants, and Foreign Nationals (FN) are
                  admitted over and above sanctioned branch capacity up to AICTE limits.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: NBA & NAAC Details */}
          {activeTab === 'accreditation' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">National Accreditation Profile (NBA & NAAC)</h4>
                <p className="text-xs text-gray-500">
                  National Board of Accreditation (Washington Accord) and NAAC peer team assessment scores.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NAAC Card */}
                <div className="border border-amber-200 bg-amber-50/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      NAAC Institutional Accreditation
                    </span>
                    <span className="bg-amber-500 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                      {portfolio.naac_grade} Grade
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-amber-200/60">
                      <span className="text-gray-600">Cumulative GPA (CGPA):</span>
                      <span className="font-bold font-mono text-gray-900">{portfolio.naac_cgpa} / 4.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-amber-200/60">
                      <span className="text-gray-600">Assessment Cycle:</span>
                      <span className="font-bold text-gray-900">{portfolio.naac_cycle}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-amber-200/60">
                      <span className="text-gray-600">Accreditation Validity:</span>
                      <span className="font-bold text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        Valid through {portfolio.naac_valid_until}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        Active & Valid
                      </span>
                    </div>
                  </div>
                </div>

                {/* NBA Card */}
                <div className="border border-cyan-200 bg-cyan-50/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-cyan-600" />
                      NBA Program Accreditation
                    </span>
                    <span className="bg-cyan-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                      {portfolio.nba_tier}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-cyan-200/60">
                      <span className="text-gray-600">Accreditation Status:</span>
                      <span className="font-bold text-gray-900">{portfolio.nba_status}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-cyan-200/60">
                      <span className="text-gray-600">Accredited Engineering Branches:</span>
                      <span className="font-semibold text-gray-900 text-right">{portfolio.nba_accredited_branches}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-cyan-200/60">
                      <span className="text-gray-600">NBA File Reference:</span>
                      <span className="font-mono font-bold text-gray-800">{portfolio.nba_file_ref}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Valid Through:</span>
                      <span className="font-bold text-gray-900">{portfolio.nba_valid_until}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Complaints & Grievance Governance */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Institutional Grievance & Complaints Governance</h4>
                <p className="text-xs text-gray-500">
                  National Anti-Ragging and AICTE Ombudsman portal reconciliation records.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 text-center">
                  <span className="text-[11px] font-bold text-gray-500 uppercase">Total Complaints</span>
                  <span className="text-2xl font-black font-mono text-gray-900 block mt-1">
                    {portfolio.complaints_total}
                  </span>
                </div>
                <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50 text-center">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">Resolved Cases</span>
                  <span className="text-2xl font-black font-mono text-emerald-900 block mt-1">
                    {portfolio.complaints_resolved}
                  </span>
                </div>
                <div className="border border-amber-200 rounded-xl p-3 bg-amber-50 text-center">
                  <span className="text-[11px] font-bold text-amber-700 uppercase">Pending Review</span>
                  <span className="text-2xl font-black font-mono text-amber-900 block mt-1">
                    {portfolio.complaints_pending}
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-white text-xs space-y-2">
                <span className="font-bold text-gray-900 block">AICTE Ombudsman Compliance Audit Summary:</span>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200 font-medium">
                  {portfolio.complaints_summary}
                </p>
                <div className="flex items-center gap-4 pt-2 text-gray-600">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Internal Complaints Committee (ICC) Active
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    National Anti-Ragging Cell Certified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: New Intake Approvals */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">AICTE Intake Approval & Expansion Application</h4>
                <p className="text-xs text-gray-500">
                  Extension of Approval (EOA) order reference and proposed seat enhancement status.
                </p>
              </div>

              <div className="border border-indigo-200 bg-indigo-50/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                  <div>
                    <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider block">Extension of Approval (EOA)</span>
                    <span className="font-mono font-bold text-sm text-indigo-950">{portfolio.eoa_reference}</span>
                  </div>
                  <Badge variant="success" size="sm">
                    SANCTIONED & ACTIVE
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-gray-500 block">Applied Expansion Branch:</span>
                    <span className="font-bold text-gray-900">{portfolio.new_intake_branch}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Additional Seats Requested:</span>
                    <span className="font-bold font-mono text-gray-900">+{portfolio.new_intake_applied} Seats</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">AICTE Scrutiny Committee Status:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {portfolio.new_intake_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Committee Remarks:</span>
                    <span className="text-gray-700 italic">{portfolio.new_intake_remarks}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-mono">
              Academic Cycle: 2026-27 • AICTE Master Registry
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close Portfolio
              </Button>
              {onOpenComplianceDesk && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenComplianceDesk(portfolio.institution_id);
                  }}
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  Open Full Compliance Desk
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default InstitutePortfolioModal;
