import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { institutionApi } from '../../services/api';
import { InstitutionComplianceData, ComplianceStudentRosterItem } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowLeft,
  Calendar,
  Globe,
  Compass,
  Download,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const InstitutionComplianceDashboard: React.FC = () => {
  const { id: routeInstId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAICTEAdmin, getUserInstitutionId } = useAuth();

  // If viewed from AICTE admin, routeInstId is present; if institution operator, fallback to user's institution
  const effectiveInstitutionId = routeInstId || getUserInstitutionId();

  const [cycle, setCycle] = useState('2026-27');
  const [data, setData] = useState<InstitutionComplianceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter state for Student Roster
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supernumeraryFilter, setSupernumeraryFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  const fetchDashboard = async () => {
    if (!effectiveInstitutionId) {
      setIsError(true);
      setErrorMessage('No institution specified or accessible.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      const res = await institutionApi.getComplianceDashboard(effectiveInstitutionId, cycle);
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch institution compliance dashboard', err);
      setIsError(true);
      setErrorMessage(err?.response?.data?.detail || 'Failed to load college compliance dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [effectiveInstitutionId, cycle]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading college intake and compliance metrics..." />;
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <ErrorState
          title="Compliance Dashboard Error"
          message={errorMessage || 'Unable to retrieve institutional compliance metrics.'}
          onRetry={fetchDashboard}
        />
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => (isAICTEAdmin() ? navigate('/aicte/institutions') : navigate('/institution'))}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { institution, metrics, supernumerary_breakdown, category_distribution, programs, students } = data;

  // Filter students roster
  const filteredStudents = students.filter((s: ComplianceStudentRosterItem) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.student_name.toLowerCase().includes(q);
      const matchId = s.institution_student_id.toLowerCase().includes(q);
      const matchApaar = (s.identity_reference || '').toLowerCase().includes(q);
      if (!matchName && !matchId && !matchApaar) return false;
    }
    if (categoryFilter && s.admission_category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (supernumeraryFilter) {
      if (supernumeraryFilter === 'any_supernumerary') {
        if (!s.supernumerary_category || s.supernumerary_category === 'none') return false;
      } else if ((s.supernumerary_category || 'none').toLowerCase() !== supernumeraryFilter.toLowerCase()) {
        return false;
      }
    }
    if (programFilter && s.program_code !== programFilter) {
      return false;
    }
    return true;
  });

  const getUtilizationBadge = (pct: number) => {
    if (pct > 100) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertOctagon className="w-3 h-3 mr-1" />
          {pct.toFixed(1)}% (Breached)
        </span>
      );
    }
    if (pct >= 80) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {pct.toFixed(1)}% (Near Capacity)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {pct.toFixed(1)}% (Compliant)
      </span>
    );
  };

  const exportRosterCsv = () => {
    if (!students || students.length === 0) {
      toast.error('No student records available to export.');
      return;
    }

    const headers = [
      'Student Name',
      'Roll / Student ID',
      'APAAR ID',
      'Date of Birth',
      'Gender',
      'Program Code',
      'Program Name',
      'Admission Status',
      'Admission Category',
      'Supernumerary Category',
      'NRI Category',
      'OCI Status',
      'Foreign National Status',
      'Record Status',
      'Open Issues Count',
    ];

    const rows = students.map((s) => [
      `"${s.student_name}"`,
      `"${s.institution_student_id}"`,
      `"${s.identity_reference || ''}"`,
      `"${s.date_of_birth || ''}"`,
      `"${s.gender || ''}"`,
      `"${s.program_code}"`,
      `"${s.program_name}"`,
      `"${s.admission_status}"`,
      `"${s.admission_category}"`,
      `"${s.supernumerary_category || 'none'}"`,
      `"${s.nri_category || 'not_applicable'}"`,
      `"${s.oci_status || 'not_applicable'}"`,
      `"${s.foreign_national_status || 'not_applicable'}"`,
      `"${s.record_status}"`,
      `"${s.open_issues_count}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${institution.institution_code}_compliance_roster_${cycle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Roster CSV downloaded successfully!');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          {isAICTEAdmin() && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/aicte/institutions')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              All Colleges
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {institution.institution_code}
              </span>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">{institution.name}</h1>
              <StatusBadge status={institution.status} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {institution.city}, {institution.state} • Type: {institution.institution_type} • AICTE Regulatory Node
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>Cycle:</span>
            <select
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="bg-transparent font-semibold text-gray-900 focus:outline-none cursor-pointer"
            >
              <option value="2026-27">2026-27 (Current)</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboard}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={exportRosterCsv}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* 4 Core Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Approved Intake vs Actual Enrolment */}
        <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-900">
              Approved vs Actual Enrolment
            </span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 font-mono">
              {metrics.actual_enrolment}
            </span>
            <span className="text-sm text-gray-500 font-medium font-mono">
              / {metrics.approved_intake} seats
            </span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-gray-500">Intake Utilization</span>
              <span className={metrics.utilization_pct > 100 ? 'text-rose-600 font-bold' : 'text-gray-700 font-semibold'}>
                {metrics.utilization_pct}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  metrics.utilization_pct > 100
                    ? 'bg-rose-600'
                    : metrics.utilization_pct >= 80
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(metrics.utilization_pct, 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Status</span>
            {getUtilizationBadge(metrics.utilization_pct)}
          </div>
        </Card>

        {/* Metric 2: Supernumerary Seats */}
        <Card className="border-violet-100 bg-gradient-to-br from-white to-violet-50/20 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-900">
              Supernumerary Seats
            </span>
            <span className="p-2 rounded-lg bg-violet-50 text-violet-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 font-mono">
              {metrics.supernumerary_seats}
            </span>
            <span className="text-xs text-gray-500 font-medium">Admitted under special quota</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                NRI Quota
              </span>
              <span className="font-mono font-semibold text-gray-900">{supernumerary_breakdown.nri || 0}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Foreign National (FN)
              </span>
              <span className="font-mono font-semibold text-gray-900">{supernumerary_breakdown.foreign_national || 0}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Kashmiri Migrant (KM)
              </span>
              <span className="font-mono font-semibold text-gray-900">{supernumerary_breakdown.kashmiri_migrant || 0}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Other Supernumerary</span>
            <span className="font-mono font-bold text-gray-700">{supernumerary_breakdown.other || 0}</span>
          </div>
        </Card>

        {/* Metric 3: NRI Category & OCI Status */}
        <Card className="border-sky-100 bg-gradient-to-br from-white to-sky-50/20 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-900">
              NRI & OCI Status
            </span>
            <span className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Globe className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 font-mono">
              {metrics.nri_count}
            </span>
            <span className="text-xs text-gray-500 font-medium">NRI Enrolments</span>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100 flex justify-between items-center">
              <div>
                <span className="font-semibold text-sky-950 block">NRI Quota / Category</span>
                <span className="text-[11px] text-sky-700">Non-Resident Indian</span>
              </div>
              <Badge variant="primary" size="sm">
                {metrics.nri_count} Verified
              </Badge>
            </div>
            <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-100 flex justify-between items-center">
              <div>
                <span className="font-semibold text-teal-950 block">OCI Cardholders</span>
                <span className="text-[11px] text-teal-700">Overseas Citizen of India</span>
              </div>
              <Badge variant="secondary" size="sm">
                {metrics.oci_count} Enrolled
              </Badge>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Cross-Border Compliance</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Validated
            </span>
          </div>
        </Card>

        {/* Metric 4: Foreign National (FN) Status */}
        <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
              Foreign National (FN) Status
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Compass className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 font-mono">
              {metrics.foreign_national_count}
            </span>
            <span className="text-xs text-gray-500 font-medium">International Students</span>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-emerald-900 font-medium">Ministry of External Affairs:</span>
              <span className="text-emerald-800 font-bold">Clearance Sync</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-emerald-900 font-medium">Study in India (SII) Quota:</span>
              <span className="text-emerald-800 font-bold">{metrics.foreign_national_count > 0 ? 'Active' : 'Zero'}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Passport / Visa Audit</span>
            <Badge variant="success" size="sm">
              Approved Node
            </Badge>
          </div>
        </Card>
      </div>

      {/* Program Capacity & Utilization Breakdown Table */}
      <Card
        title="Approved Intake vs. Enrolment by Academic Program"
        subtitle="Verification against AICTE statutory sanctions and program-level limits"
        headerAction={
          <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
            Total Programs: {programs.length}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Program Name & Branch</th>
                <th className="py-3 px-4">Program Code</th>
                <th className="py-3 px-4 text-right">Approved Intake</th>
                <th className="py-3 px-4 text-right">Actual Enrolled</th>
                <th className="py-3 px-4 text-center">Utilization</th>
                <th className="py-3 px-4 text-center">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {programs.map((prog) => (
                <tr key={prog.program_id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900 block">{prog.program_name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                      {prog.program_code}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                    {prog.approved_capacity}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                    {prog.enrolled_count}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden mb-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            prog.utilization_pct > 100
                              ? 'bg-rose-600'
                              : prog.utilization_pct >= 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(prog.utilization_pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-gray-600">{prog.utilization_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getUtilizationBadge(prog.utilization_pct)}
                  </td>
                </tr>
              ))}
              {programs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No academic programs found for this cycle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Category Breakdown & Demographics */}
      <Card
        title="Social & Admission Category Distribution"
        subtitle="Cross-sectional distribution across statutory quotas and reservation categories"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(category_distribution).map(([cat, count]) => (
            <div
              key={cat}
              className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center"
            >
              <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                {cat.replace(/_/g, ' ')}
              </span>
              <span className="text-2xl font-black text-gray-900 font-mono mt-1">{count}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">
                {metrics.actual_enrolment > 0
                  ? `${((count / metrics.actual_enrolment) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
          ))}
          {Object.keys(category_distribution).length === 0 && (
            <div className="col-span-full py-4 text-center text-gray-500 text-xs">
              No category data recorded for admitted students.
            </div>
          )}
        </div>
      </Card>

      {/* Enrolled Students Roster (Other relevant student information) */}
      <Card
        title="Enrolled Student Roster & Special Quota Register"
        subtitle="Complete student profile verifying APAAR ID, NRI category, OCI status, Supernumerary quota & integrity flags"
        headerAction={
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{filteredStudents.length}</span> of {students.length} students
            </span>
          </div>
        }
      >
        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, roll no, APAAR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Admission Categories</option>
              <option value="general">General</option>
              <option value="obc">OBC</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
              <option value="ews">EWS</option>
              <option value="nri">NRI</option>
              <option value="foreign_national">Foreign National</option>
            </select>
          </div>

          <div>
            <select
              value={supernumeraryFilter}
              onChange={(e) => setSupernumeraryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Quotas (Standard & Supernumerary)</option>
              <option value="any_supernumerary">Any Supernumerary Only</option>
              <option value="nri">Supernumerary: NRI Quota</option>
              <option value="foreign_national">Supernumerary: Foreign National</option>
              <option value="kashmiri_migrant">Supernumerary: Kashmiri Migrant</option>
              <option value="other">Supernumerary: Other</option>
              <option value="none">Standard Seats (None)</option>
            </select>
          </div>

          <div>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Academic Programs</option>
              {programs.map((p) => (
                <option key={p.program_code} value={p.program_code}>
                  {p.program_code} - {p.program_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Roll / Student ID</th>
                <th className="py-3 px-3">APAAR ID</th>
                <th className="py-3 px-3">Program</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Supernumerary</th>
                <th className="py-3 px-3 text-center">NRI</th>
                <th className="py-3 px-3 text-center">OCI</th>
                <th className="py-3 px-3 text-center">FN</th>
                <th className="py-3 px-3 text-center">Integrity Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-gray-900 block">{s.student_name}</span>
                    <span className="text-[10px] text-gray-400">
                      {s.gender || 'N/A'} • DOB: {s.date_of_birth || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                      {s.institution_student_id}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {s.identity_reference ? (
                      <span className="font-mono text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[11px]">
                        {s.identity_reference}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Not Assigned</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-gray-800 block">{s.program_code}</span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[140px] block">
                      {s.program_name}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="uppercase text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {s.admission_category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {s.supernumerary_category && s.supernumerary_category !== 'none' ? (
                      <span className="inline-block uppercase font-bold text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                        {s.supernumerary_category.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {s.nri_category === 'applicable' ? (
                      <span className="inline-block font-bold text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                        YES
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {s.oci_status === 'applicable' ? (
                      <span className="inline-block font-bold text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                        YES
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {s.foreign_national_status === 'applicable' ? (
                      <span className="inline-block font-bold text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        YES
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {s.open_issues_count > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        {s.open_issues_count} Issue{s.open_issues_count > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Clean
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (isAICTEAdmin()) {
                          navigate(`/aicte/integrity?search=${encodeURIComponent(s.student_name)}`);
                        } else {
                          navigate(`/institution/students/${s.id}`);
                        }
                      }}
                      icon={<ExternalLink className="w-3 h-3" />}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-500">
                    No students matching the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default InstitutionComplianceDashboard;
