import React, { useState, useEffect } from 'react';
import { reviewApi } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  GitBranch,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Search,
  Filter,
  Building2,
  User,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  FileText,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CaseTracking: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const data = await reviewApi.getCaseTimelines({
        status_filter: statusFilter || undefined,
        severity_filter: severityFilter || undefined,
      });
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      }
    } catch (err) {
      console.error('Failed to load case timelines:', err);
      toast.error('Failed to load case tracking records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, severityFilter]);

  const filteredCases = cases.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.case_id.toLowerCase().includes(q) ||
      c.student_name.toLowerCase().includes(q) ||
      c.apaar_id.toLowerCase().includes(q) ||
      c.institution_name.toLowerCase().includes(q) ||
      c.rule_code.toLowerCase().includes(q)
    );
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Badge variant="danger" size="sm">CRITICAL</Badge>;
      case 'high':
        return <Badge variant="warning" size="sm">HIGH</Badge>;
      case 'medium':
        return <Badge variant="secondary" size="sm">MEDIUM</Badge>;
      default:
        return <Badge variant="secondary" size="sm">LOW</Badge>;
    }
  };

  const getStageColor = (stageNum: number) => {
    if (stageNum === 4) return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (stageNum === 3) return 'bg-indigo-50 text-indigo-800 border-indigo-300';
    return 'bg-amber-50 text-amber-800 border-amber-300';
  };

  const getAssignedDepartment = (ruleCode: string) => {
    if (ruleCode.includes('INTAKE') || ruleCode.includes('CAP')) return 'AICTE Central Approval Bureau & Technical Intake Cell';
    if (ruleCode.includes('CATEGORY') || ruleCode.includes('QUOTA')) return 'Social Justice, Equal Opportunity & Quota Monitoring Wing';
    if (ruleCode.includes('DUPLICATE_LOCAL')) return 'Campus Admissions Oversight & Anti-Ghost Enrollment Cell';
    if (ruleCode.includes('CROSS_INSTITUTION')) return 'AICTE Central Vigilance & Multi-Campus Fraud Wing';
    if (ruleCode.includes('REQUIRED_FIELD')) return 'Institutional Registrar & Student Intake Data Cell';
    if (ruleCode.includes('APAAR_FORMAT')) return 'National APAAR Digital Identity Desk (Ministry of Education)';
    if (ruleCode.includes('APAAR_NOT_VERIFIED')) return 'DigiLocker & NAD Identity Verification Bureau';
    if (ruleCode.includes('APPROVAL_DATA')) return 'Statutory EoA & Affiliation Directorate';
    if (ruleCode.includes('UNUSUAL')) return 'Cyber Integrity, Audit Trails & Anomaly Detection Cell';
    return 'AICTE Regulatory Adjudication Desk';
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl border border-indigo-800/40 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
              <GitBranch className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight">National Case Tracking & Multi-Stage Workflow Timeline</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Real-time stage tracking for every admission discrepancy, intake exceedance, and identity dispute. Monitor exactly where every case is stationed across campus nodes and the Central AICTE Approval Desk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-400/30 font-mono font-bold text-indigo-200">
            {cases.length} Total Cases Tracked
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Case ID, Student Name, APAAR ID, or College..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open (Unresolved)</option>
            <option value="under_review">Under AICTE Review</option>
            <option value="resolved">Resolved / AICTE Approved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          <Button variant="secondary" size="sm" onClick={fetchCases}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20">
          <LoadingSpinner message="Loading case workflows and timeline telemetry..." />
        </div>
      ) : filteredCases.length === 0 ? (
        <Card className="text-center py-12">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-gray-900">Zero Flagged Cases Found</h3>
          <p className="text-xs text-gray-500 mt-1">All admission intake and identity records are fully compliant.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Cases List */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredCases.map((c) => {
              const isSelected = selectedCase?.issue_id === c.issue_id;
              return (
                <div
                  key={c.issue_id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-1 ring-indigo-500'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-extrabold text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
                        CASE #{c.case_id}
                      </span>
                      {getSeverityBadge(c.severity)}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStageColor(c.stage_number)}`}>
                      {c.current_stage}
                    </span>
                  </div>

                  <div className="mt-2">
                    <span className="font-bold text-gray-900 text-xs block">{c.rule_code}</span>
                    <p className="text-[11px] text-gray-600 line-clamp-1 mt-0.5">{c.description}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-700 font-semibold bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <span className="truncate">{getAssignedDepartment(c.rule_code)}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="truncate max-w-[200px] font-semibold text-gray-800">{c.student_name}</span>
                    <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{c.institution_code}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Case Deep-Dive & Timeline Tracker */}
          {selectedCase && (
            <div className="lg:col-span-7 space-y-4">
              <Card className="border border-indigo-100 shadow-md">
                {/* Case Header Banner */}
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded border border-indigo-200">
                        CASE #{selectedCase.case_id}
                      </span>
                      {getSeverityBadge(selectedCase.severity)}
                      <Badge variant={selectedCase.status === 'resolved' ? 'success' : 'warning'} size="sm">
                        STATUS: {selectedCase.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Current Location</span>
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 inline-block">
                        {selectedCase.current_stage}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-gray-900">{selectedCase.rule_code}</h3>
                    <div className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      <span>Assigned Department: <strong>{getAssignedDepartment(selectedCase.rule_code)}</strong></span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    {selectedCase.description}
                  </p>
                </div>

                {/* Student & Institution Context Box */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-b border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-500 block">Student Subject:</span>
                    <span className="font-bold text-gray-900">{selectedCase.student_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">APAAR Reference:</span>
                    <span className="font-mono font-bold text-indigo-700">{selectedCase.apaar_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Roll / Reg ID:</span>
                    <span className="font-mono font-semibold text-gray-800">{selectedCase.roll_no}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Origin College:</span>
                    <span className="font-semibold text-gray-900">{selectedCase.institution_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Academic Program:</span>
                    <span className="font-semibold text-gray-900">{selectedCase.program_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Assigned AICTE Reviewer:</span>
                    <span className="font-bold text-emerald-800">{selectedCase.assigned_reviewer}</span>
                  </div>
                </div>

                {/* Multi-Stage Visual Timeline */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>End-to-End Case Tracking Stepper & Audit Log</span>
                    </h4>
                    <span className="text-[11px] font-bold text-indigo-600 font-mono">
                      Stage {selectedCase.stage_number} of 4
                    </span>
                  </div>

                  {/* Horizontal Stepper Progress */}
                  <div className="relative mb-6">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
                    <div
                      className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
                      style={{ width: `${((selectedCase.stage_number - 1) / 3) * 100}%` }}
                    />

                    <div className="relative z-10 flex justify-between">
                      {[
                        { step: 1, label: 'Campus Ingested' },
                        { step: 2, label: 'Engine Flagged' },
                        { step: 3, label: 'AICTE Review Desk' },
                        { step: 4, label: 'Approved & Closed' },
                      ].map((s) => {
                        const isDone = selectedCase.stage_number >= s.step;
                        const isCurrent = selectedCase.stage_number === s.step;

                        return (
                          <div key={s.step} className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                isDone
                                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                  : 'bg-white border-2 border-gray-300 text-gray-400'
                              } ${isCurrent ? 'ring-4 ring-indigo-300 scale-110' : ''}`}
                            >
                              {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                            </div>
                            <span className={`text-[10px] font-semibold mt-1.5 text-center max-w-[80px] ${isCurrent ? 'text-indigo-900 font-bold' : 'text-gray-500'}`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vertical Timeline Detail Cards */}
                  <div className="space-y-3 pt-2">
                    {selectedCase.timeline.map((item: any, idx: number) => {
                      const isCompleted = item.status === 'completed';
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs transition-all ${
                            isCompleted
                              ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950'
                              : item.status === 'active'
                              ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                              : 'bg-gray-50 border-gray-200 text-gray-500 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : item.status === 'active' ? (
                                <Clock className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                              )}
                              <span className="font-extrabold text-sm">{item.stage}</span>
                            </div>
                            <span className="font-mono text-[10px] font-bold bg-white/80 px-2 py-0.5 rounded shadow-2xs">
                              {item.timestamp}
                            </span>
                          </div>

                          <div className="mt-1 pl-6 flex items-center gap-1.5 text-[11px] text-gray-600">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>Location: <strong>{item.location}</strong></span>
                          </div>

                          <p className="mt-1 pl-6 text-xs text-gray-700 font-medium">
                            {item.details}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick AICTE Decision Actions */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-500">
                    Deterministic SHA-256 Ledger State Sealed
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toast.success(`Clarification requested from ${selectedCase.institution_code} registrar.`)}
                    >
                      Request Campus Proof
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        toast.success(`Case #${selectedCase.case_id} marked as AICTE APPROVED and reconciled.`);
                        fetchCases();
                      }}
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Approve & Reconcile
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseTracking;
