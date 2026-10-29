import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useInstitutions } from '../../hooks/useApi';
import { apiClient } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable, { Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  FileSpreadsheet,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Building2,
  Search,
  FolderArchive,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const { getUserInstitutionId, isAICTEAdmin } = useAuth();
  const userInstId = getUserInstitutionId() || undefined;

  const { data: institutions = [] } = useInstitutions();

  const [reportType, setReportType] = useState<
    'accreditation' | 'regulatory' | 'policymaking' | 'enrolment' | 'integrity'
  >('accreditation');
  const [cycle, setCycle] = useState('2026-27');
  const [selectedInstId, setSelectedInstId] = useState<string>(
    isAICTEAdmin() ? '' : userInstId || ''
  );
  const [searchFilter, setSearchFilter] = useState('');

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<Column<any>[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  // Filter institutions for search dropdown
  const filteredInstitutions = useMemo(() => {
    if (!searchFilter.trim()) return institutions;
    const term = searchFilter.toLowerCase().trim();
    return institutions.filter(
      (inst) =>
        inst.name.toLowerCase().includes(term) ||
        inst.institution_code.toLowerCase().includes(term) ||
        inst.city.toLowerCase().includes(term) ||
        inst.state.toLowerCase().includes(term)
    );
  }, [institutions, searchFilter]);

  // Current selected institution metadata
  const currentInstitution = useMemo(() => {
    if (!selectedInstId) return null;
    return institutions.find((inst) => inst.id === selectedInstId) || null;
  }, [institutions, selectedInstId]);

  useEffect(() => {
    handleGeneratePreview();
  }, [reportType, cycle, selectedInstId]);

  const handleGeneratePreview = async () => {
    setIsPreviewLoading(true);
    try {
      const activeInstId = selectedInstId || (isAICTEAdmin() ? undefined : userInstId);
      const res = await apiClient.get<any[]>(`/reports/preview/${reportType}`, {
        params: {
          institution_id: activeInstId || undefined,
          admission_cycle: cycle,
        },
      });

      const data = res.data || [];
      setPreviewData(data);

      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        const cols: Column<any>[] = keys.map((key) => ({
          key,
          header: key.replace(/_/g, ' ').toUpperCase(),
          render: (row) => {
            const val = String(row[key] ?? '—');
            if (
              val.includes('COMPLIANT') ||
              val.includes('Clearance') ||
              val.includes('A++') ||
              val.includes('CLEAN') ||
              val.includes('Verified')
            ) {
              return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {val}
                </span>
              );
            }
            if (
              val.includes('BREACH') ||
              val.includes('VIOLATION') ||
              val.includes('Pending') ||
              val.includes('HIGH')
            ) {
              return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  {val}
                </span>
              );
            }
            if (
              key === 'apaar_saturation' ||
              key === 'fulfillment_rate' ||
              key === 'capacity_utilization'
            ) {
              return <span className="font-mono font-bold text-indigo-700">{val}</span>;
            }
            return <span className="text-gray-800 text-xs">{val}</span>;
          },
        }));
        setPreviewColumns(cols);
      } else {
        setPreviewColumns([]);
      }
    } catch {
      toast.error('Failed to generate report preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadSingleReport = async (type: string) => {
    setIsDownloading(true);
    try {
      const activeInstId = selectedInstId || (isAICTEAdmin() ? undefined : userInstId);
      const res = await apiClient.get(`/reports/download/${type}`, {
        params: {
          institution_id: activeInstId || undefined,
          admission_cycle: cycle,
        },
        responseType: 'blob',
      });

      const prefix = currentInstitution ? `${currentInstitution.institution_code}_` : '';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${prefix}${type}_report_${cycle}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(
        `Downloaded ${type.toUpperCase()} report${currentInstitution ? ` for ${currentInstitution.name}` : ''}.`
      );
    } catch {
      toast.error(`Failed to download ${type} report.`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAllReports = async () => {
    const reportsToDownload = ['accreditation', 'regulatory', 'enrolment', 'integrity'];
    setIsDownloadingAll(true);
    const targetName = currentInstitution ? currentInstitution.name : 'All AICTE Colleges';
    toast.loading(`Generating full statutory report package for ${targetName}...`, { id: 'download-all' });

    try {
      const activeInstId = selectedInstId || (isAICTEAdmin() ? undefined : userInstId);
      const prefix = currentInstitution ? `${currentInstitution.institution_code}_` : 'AICTE_NATIONAL_';

      for (let i = 0; i < reportsToDownload.length; i++) {
        const type = reportsToDownload[i];
        const res = await apiClient.get(`/reports/download/${type}`, {
          params: {
            institution_id: activeInstId || undefined,
            admission_cycle: cycle,
          },
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${prefix}${type}_report_${cycle}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Small delay to prevent browser download congestion
        await new Promise((r) => setTimeout(r, 400));
      }

      toast.success(`Successfully downloaded all 4 statutory reports for ${targetName}!`, {
        id: 'download-all',
      });
    } catch {
      toast.error('Failed to generate all reports. Please try individual downloads.', {
        id: 'download-all',
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getReportDescription = () => {
    switch (reportType) {
      case 'accreditation':
        return 'Accreditation Matrix for NAAC (Criteria 2.1), NBA (Criteria 4), and NIRF Student Strength parameters with automated APAAR saturation calculation.';
      case 'regulatory':
        return 'AICTE Mandatory Compliance Form-A: Real-time audit of approved intake vs actual enrolments, supernumerary quotas, NRI/FN/OCI admissions, and breach flags.';
      case 'policymaking':
        return 'National & State Educational Policy Planning: Inter-state demographic mobility, gender parity index, and institutional capacity vacancy analytics.';
      case 'enrolment':
        return 'Program-level capacity saturation audit with approved intake vs verified admissions.';
      case 'integrity':
        return 'Algorithmic cross-validation anomaly log identifying duplicate enrollments, identity conflicts, and regulatory discrepancies.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Statutory & Regulatory Reports</h1>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
              Feature 9
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Automated statutory reporting for accreditation (NAAC/NBA/NIRF), regulatory compliance (AICTE Form-A), and institute-specific audit dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden flex-wrap">
          <Button
            variant="secondary"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Print Summary
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownloadAllReports}
            isLoading={isDownloadingAll}
            icon={<FolderArchive className="w-4 h-4 text-indigo-600" />}
            className="border-indigo-300 hover:bg-indigo-50 text-indigo-900 font-semibold"
          >
            {currentInstitution
              ? `Download All 4 Reports (${currentInstitution.institution_code})`
              : 'Download All Reports Bundle'}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleDownloadSingleReport(reportType)}
            isLoading={isDownloading}
            icon={<Download className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Download {reportType.toUpperCase()} CSV
          </Button>
        </div>
      </div>

      {/* Institution Search & Selection Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-5 text-white shadow-lg print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                College-Specific Statutory Reporting
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Target Filter
                </span>
              </h2>
              <p className="text-xs text-indigo-200">
                Filter and download all statutory audits, Form-A compliance, and accreditation reports for any recognized member college.
              </p>
            </div>
          </div>

          {/* Quick College Select Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedInstId('');
                setSearchFilter('');
              }}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                !selectedInstId
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white/10 hover:bg-white/20 text-indigo-200'
              }`}
            >
              All Colleges
            </button>
            {institutions
              .filter((i) => ['DSCE-BLR', 'IITB-MUM', 'COEP-PUN', 'NIT-DEMO'].includes(i.institution_code))
              .map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => {
                    setSelectedInstId(inst.id);
                    setSearchFilter('');
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    selectedInstId === inst.id
                      ? 'bg-indigo-500 text-white font-bold ring-2 ring-white/30 shadow'
                      : 'bg-white/10 hover:bg-white/20 text-indigo-100'
                  }`}
                >
                  {inst.institution_code === 'DSCE-BLR' ? '⭐ DSCE Bangalore' : inst.institution_code}
                </button>
              ))}
          </div>
        </div>

        {/* Institution Search & Dropdown Filter */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/10">
          <div>
            <label className="block text-xs font-semibold text-indigo-200 uppercase mb-1 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Search College Name or Code (e.g. "DSCE", "Dayananda Sagar")
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Type 'DSCE' or college name to quickly filter..."
                className="w-full text-xs px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-indigo-300/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/20"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-2 text-xs text-indigo-300 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-indigo-200 uppercase mb-1">
              Select AICTE Recognised College
            </label>
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
            >
              <option value="">All Member Institutions (National Ledger / Macro Analytics)</option>
              {filteredInstitutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.institution_code} — {inst.name} ({inst.city}, {inst.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active College Banner & Direct Download Bar */}
        {currentInstitution && (
          <div className="mt-4 p-3.5 bg-indigo-900/60 border border-indigo-400/30 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                {currentInstitution.institution_code.slice(0, 4)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{currentInstitution.name}</h3>
                  <span className="text-[10px] font-mono bg-indigo-700/80 px-2 py-0.5 rounded text-indigo-100 font-bold border border-indigo-400/40">
                    {currentInstitution.institution_code}
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {currentInstitution.city}, {currentInstitution.state} • Tier-1 AICTE Recognised • Status:{' '}
                  <span className="text-emerald-300 font-semibold uppercase">{currentInstitution.status}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleDownloadAllReports}
                disabled={isDownloadingAll}
                className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md shadow flex items-center gap-1.5 transition-all"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                Download All 4 Reports for {currentInstitution.institution_code}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Bar */}
      <Card title="Report Purpose & Scope Selection" className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Statutory Report Category (Policy, Accreditation, Monitoring, Regulatory)
            </label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as any);
              }}
              className="w-full text-sm px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white font-medium"
            >
              <option value="accreditation">Accreditation Report (NAAC Criteria 2.1, NBA Criteria 4, NIRF Metric SS)</option>
              <option value="regulatory">AICTE Regulatory Compliance & Intake Monitoring (Mandatory Form-A)</option>
              <option value="enrolment">Academic Program Enrolment & Capacity Saturation</option>
              <option value="integrity">Data Integrity & Anomaly Exceptions Audit Roster</option>
              <option value="policymaking">National Educational Policy-Making (Macro Seat Vacancy & Demographic Equity)</option>
            </select>
            <p className="text-xs text-indigo-700 mt-1.5 font-medium">{getReportDescription()}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Admission Cycle
            </label>
            <select
              value={cycle}
              onChange={(e) => {
                setCycle(e.target.value);
              }}
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white"
            >
              <option value="2026-27">Admission Cycle 2026-27 (Current)</option>
              <option value="2025-26">Admission Cycle 2025-26</option>
              <option value="2024-25">Admission Cycle 2024-25</option>
            </select>
          </div>
        </div>

        {/* Quick Report Type Selector Tabs */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Quick Report Tabs:</span>
          {(
            [
              { id: 'accreditation', label: 'Accreditation Matrix' },
              { id: 'regulatory', label: 'AICTE Form-A Roster' },
              { id: 'enrolment', label: 'Program Intake Saturation' },
              { id: 'integrity', label: 'Integrity & Exceptions' },
              { id: 'policymaking', label: 'Macro Policy & Vacancy' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                reportType === tab.id
                  ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Preview Table */}
      <Card
        title={
          reportType === 'accreditation'
            ? `Accreditation Benchmark Metrics Preview (NAAC / NBA / NIRF)${
                currentInstitution ? ` — ${currentInstitution.name} (${currentInstitution.institution_code})` : ''
              }`
            : reportType === 'regulatory'
            ? `AICTE Mandatory Compliance Form-A Roster${
                currentInstitution ? ` — ${currentInstitution.name} (${currentInstitution.institution_code})` : ''
              }`
            : reportType === 'policymaking'
            ? `Macro Policy & Demographic Analytics${
                currentInstitution ? ` — ${currentInstitution.name}` : ''
              }`
            : reportType === 'enrolment'
            ? `Approved Intake vs Enrolment Utilization${
                currentInstitution ? ` — ${currentInstitution.name} (${currentInstitution.institution_code})` : ''
              }`
            : `Flagged Compliance Exceptions Audit${
                currentInstitution ? ` — ${currentInstitution.name} (${currentInstitution.institution_code})` : ''
              }`
        }
        subtitle={`Live authoritative data compiled for ${cycle}.${
          currentInstitution
            ? ` Filtered specifically for ${currentInstitution.name} (${currentInstitution.institution_code}).`
            : ' Consolidated view across all member institutions.'
        } Verified under AICTE National Trust Framework.`}
        noPadding
      >
        {isPreviewLoading ? (
          <div className="p-12">
            <LoadingSpinner message="Compiling verified regulatory metrics from authoritative database..." />
          </div>
        ) : previewData.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No report data previewed for this criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={previewColumns}
              data={previewData}
              keyExtractor={(_, idx) => idx}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Reports;