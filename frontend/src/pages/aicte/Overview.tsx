import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDashboardSummary,
  useInstitutions,
  useIssues,
  useDataQualityTrend,
} from '../../hooks/useApi';
import { studentApi } from '../../services/api';
import AddMemberCollegeModal from '../../components/institutions/AddMemberCollegeModal';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import SeverityBadge from '../../components/ui/SeverityBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import IssueDistributionChart from '../../components/charts/IssueDistributionChart';
import SubmissionCompletionChart from '../../components/charts/SubmissionCompletionChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  Search,
  Lock,
  Compass,
  Zap,
  Globe2,
  FileCheck,
  TrendingUp,
  Cpu,
  Fingerprint,
  PlusCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const AICTEOverview: React.FC = () => {
  const navigate = useNavigate();
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [hasLiveSearched, setHasLiveSearched] = useState(false);
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useDashboardSummary();

  const { data: institutions = [], isLoading: isInstLoading, refetch: refetchInstitutions } = useInstitutions();
  const { data: trendData = [], isLoading: isTrendLoading } = useDataQualityTrend();
  const { data: highIssuesData, isLoading: isIssuesLoading } = useIssues({
    severity: 'critical',
    size: 5,
  });

  // Debounced Quick Live Search
  useEffect(() => {
    if (!quickSearchQuery.trim()) {
      setLiveResults([]);
      setHasLiveSearched(false);
      setShowLiveDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLiveSearching(true);
        setShowLiveDropdown(true);
        const res = await studentApi.searchInspector(quickSearchQuery.trim());
        setLiveResults(res.slice(0, 6));
        setHasLiveSearched(true);
      } catch (err) {
        console.error('Failed to perform live quick search:', err);
      } finally {
        setIsLiveSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [quickSearchQuery]);

  if (isSummaryError) {
    return <ErrorState onRetry={refetchSummary} />;
  }

  const highSeverityIssues = highIssuesData?.items || [];

  // Generate completion data for institutions
  const completionData = institutions.slice(0, 8).map((inst) => {
    const total = inst.total_records || 100;
    const flagged = inst.flagged_records || 0;
    const valid = Math.max(0, total - flagged);
    const pct = total > 0 ? (valid / total) * 100 : 100;
    return {
      institution_name: inst.name.length > 25 ? inst.name.substring(0, 22) + '...' : inst.name,
      completion_pct: Number(pct.toFixed(1)),
      total_records: total,
    };
  });

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearchQuery.trim()) {
      setShowLiveDropdown(false);
      navigate(`/aicte/student-inspector?query=${encodeURIComponent(quickSearchQuery.trim())}`);
    }
  };

  // Verification status breakdown from summary
  const verificationDist = summary?.identity_verification_distribution || {
    verified: 17820,
    pending: 480,
    failed: 32,
  };

  return (
    <div className="space-y-6">
      {/* High-Tech Executive AICTE Command Center Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 text-white shadow-2xl">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>AICTE National Surveillance Telemetry • Active</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">IST Realtime Sync</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <span>AICTE Central Command Center</span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/80 text-white font-mono font-semibold uppercase tracking-wider">
                  MoE National Gateway
                </span>
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                Algorithmic oversight platform managing {institutions.length || 58}+ AICTE recognised colleges, 690+ engineering branches, and nationwide APAAR student records. Enforcing zero-trust student consent privacy, capacity caps, and multi-stage case resolution.
              </p>
            </div>

            {/* Quick Action Matrix */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Member College</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/aicte/student-inspector')}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Student & APAAR Inspector</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/aicte/tracking')}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Case Tracking</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/aicte/stakeholders')}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Stakeholder Governance</span>
              </button>
            </div>
          </div>

          {/* Quick Universal Student Search Bar */}
          <div className="relative bg-slate-900/80 p-4 rounded-2xl border border-indigo-500/30 shadow-inner">
            <form onSubmit={handleQuickSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Quick Search Student Nationwide by APAAR ID, Full Name, Roll No, or AICTE recognised college..."
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  onFocus={() => { if (quickSearchQuery.trim()) setShowLiveDropdown(true); }}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md transition flex items-center justify-center space-x-1.5 shrink-0"
              >
                <span>Launch Universal Inspector</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Live Instant Search Dropdown */}
            {showLiveDropdown && quickSearchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-3 shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Instant Matches for "{quickSearchQuery}"
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLiveDropdown(false)}
                    className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
                  >
                    Close
                  </button>
                </div>

                {isLiveSearching ? (
                  <div className="py-4 text-center text-xs text-indigo-300">
                    <LoadingSpinner size="sm" message="Scanning nationwide records across AICTE recognised colleges..." />
                  </div>
                ) : liveResults.length > 0 ? (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {liveResults.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          setShowLiveDropdown(false);
                          navigate(`/aicte/student-inspector?query=${encodeURIComponent(student.apaar_id || student.student_name)}`);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/80 border border-slate-700/60 hover:border-indigo-500/50 cursor-pointer transition"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-white truncate">{student.student_name}</span>
                            <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                              {student.apaar_id || 'APAAR Pending'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {student.roll_no}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 truncate">
                            <span className="text-indigo-300 font-semibold">{student.institution_name}</span>
                            <span>•</span>
                            <span>{student.program_name}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            student.open_issues_count > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {student.open_issues_count > 0 ? `${student.open_issues_count} Issue(s)` : 'Verified'}
                          </span>
                          <button
                            type="button"
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-1 rounded-lg"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 text-center border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLiveDropdown(false);
                          navigate(`/aicte/student-inspector?query=${encodeURIComponent(quickSearchQuery.trim())}`);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        View all matching results in Universal Inspector →
                      </button>
                    </div>
                  </div>
                ) : hasLiveSearched ? (
                  <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">No students found matching "{quickSearchQuery}"</p>
                    <p className="text-[11px]">Search by student name (e.g. Aarav, Sneha), 12-digit APAAR ID (with/without hyphens), roll number, or AICTE recognised college name/code (e.g. DSCE, IIT Bombay, RVCE).</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* National Overview KPI Dials */}
      {isSummaryLoading ? (
        <LoadingSpinner message="Aggregating nationwide institutional telemetry..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Institutions Monitored"
            value={`${institutions.length || 58} AICTE Recognised Colleges`}
            icon={<Building2 className="w-5 h-5 text-indigo-400" />}
            subtitle="696 Active Approved Branches"
            variant="default"
            onClick={() => navigate('/aicte/institutions')}
          />
          <StatCard
            title="Total Student Records"
            value={(summary?.total_records ?? 18450).toLocaleString()}
            icon={<Users className="w-5 h-5 text-blue-400" />}
            subtitle="National intake pool"
            variant="default"
            onClick={() => navigate('/aicte/student-inspector')}
          />
          <StatCard
            title="Compliant Enrolled"
            value={(summary?.valid_records ?? 17820).toLocaleString()}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            subtitle="97.2% intake compliance"
            variant="success"
          />
          <StatCard
            title="Active Regulatory Flags"
            value={(summary?.unresolved_high_severity ?? 6).toLocaleString()}
            icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
            subtitle="Intake & quota exceptions"
            variant={summary?.unresolved_high_severity ? 'danger' : 'default'}
            onClick={() => navigate('/aicte/tracking')}
          />
          <StatCard
            title="Stakeholder Gates"
            value="5 Registered"
            icon={<Lock className="w-5 h-5 text-amber-400" />}
            subtitle="Student consent enforced"
            variant="default"
            onClick={() => navigate('/aicte/stakeholders')}
          />
        </div>
      )}

      {/* Interactive State Geographic Compliance Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { state: 'Karnataka', colleges: 6, intake: '4,200', compliance: '98.5%', status: 'Optimal' },
          { state: 'Maharashtra', colleges: 5, intake: '3,800', compliance: '97.2%', status: 'Optimal' },
          { state: 'Delhi NCR', colleges: 4, intake: '3,100', compliance: '99.1%', status: 'Optimal' },
          { state: 'Tamil Nadu', colleges: 4, intake: '2,900', compliance: '96.8%', status: 'Audited' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-sm flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>{item.state} Region</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {item.colleges} Colleges • {item.intake} Enrolled
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-extrabold text-emerald-400 font-mono">{item.compliance}</div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid: Completion by Institution & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="Submission Compliance Rate by AICTE Recognised Colleges"
            subtitle="Percentage of verified student records within sanctioned AICTE intake ceilings"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/aicte/institutions')}
              >
                <span>All {institutions.length || 58} Colleges</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            }
          >
            {isInstLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <SubmissionCompletionChart data={completionData} height={300} />
            )}
          </Card>
        </div>

        <div>
          <Card
            title="Regulatory Discrepancy Breakdown"
            subtitle="Active exceptions monitored across national engineering nodes"
          >
            <IssueDistributionChart
              distribution={{
                critical: summary?.unresolved_high_severity || 4,
                high: 8,
                warning: 14,
                info: 22,
              }}
              height={300}
            />
          </Card>
        </div>
      </div>

      {/* Quality Trend Line Chart & Verification Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title="National Academic Ledger Quality Trend"
            subtitle="Historical timeline of verified APAAR records vs flagged exceptions"
          >
            {isTrendLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={
                      trendData.length > 0
                        ? trendData
                        : [
                            { date: 'Oct 23', compliant_pct: 91, issues_count: 28 },
                            { date: 'Oct 24', compliant_pct: 93, issues_count: 22 },
                            { date: 'Oct 25', compliant_pct: 94, issues_count: 17 },
                            { date: 'Oct 26', compliant_pct: 95, issues_count: 14 },
                            { date: 'Oct 27', compliant_pct: 96, issues_count: 11 },
                            { date: 'Oct 28', compliant_pct: 97.4, issues_count: 6 },
                          ]
                    }
                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="compliant_pct"
                      name="Intake Compliance Rate (%)"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="issues_count"
                      name="Active Regulatory Flags"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Verification Status Distribution Card */}
        <div>
          <Card
            title="Synthetic Identity Resolution"
            subtitle="APAAR / Aadhaar HMAC cryptographic matching"
          >
            <div className="space-y-4 pt-2">
              {Object.entries(verificationDist).map(([statusKey, count]) => {
                const total = Object.values(verificationDist).reduce((a, b) => a + b, 0) || 1;
                const pct = ((count / total) * 100).toFixed(1);
                return (
                  <div key={statusKey} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="capitalize text-slate-300">{statusKey} Verification</span>
                      <span className="text-white font-mono">
                        {count.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${
                          statusKey === 'verified'
                            ? 'bg-emerald-500'
                            : statusKey === 'pending'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-3.5 bg-slate-900 rounded-xl border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Demonstration system enforces zero-trust privacy. Only the parent college and AICTE have direct access; external stakeholders must obtain student consent.
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Urgent High-Severity Exceptions List */}
      <Card
        title="High-Priority AICTE Discrepancy & Intake Review Radar"
        subtitle="Capacity overruns and duplicate enrollment alerts requiring regulatory determination"
        headerAction={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/aicte/tracking')}
            >
              <span>View Case Timelines</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/aicte/reviews')}
            >
              <span>Open Review Queue</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        }
        noPadding
      >
        {isIssuesLoading ? (
          <div className="p-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : highSeverityIssues.length === 0 ? (
          <div className="p-8 text-center text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
            All institutions operating within approved AICTE intake quotas.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {highSeverityIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => navigate(`/aicte/reviews/${issue.id}`)}
                className="p-4 hover:bg-slate-800/60 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {issue.rule_code}
                    </span>
                    <SeverityBadge severity={issue.severity} />
                    <span className="text-xs text-indigo-400 font-semibold">
                      {issue.institution_name || 'Institution Node'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{issue.description}</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <StatusBadge status={issue.status} />
                  <Button variant="secondary" size="sm">
                    Inspect Case
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Register New AICTE Member College Modal */}
      <AddMemberCollegeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetchInstitutions();
          refetchSummary();
        }}
      />
    </div>
  );
};

export default AICTEOverview;
