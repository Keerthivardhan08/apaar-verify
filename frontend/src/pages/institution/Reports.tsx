import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable, { Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FileSpreadsheet, Download, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Printer, BarChart3, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const { getUserInstitutionId, isAICTEAdmin } = useAuth();
  const institutionId = getUserInstitutionId() || undefined;

  const [reportType, setReportType] = useState<'accreditation' | 'regulatory' | 'policymaking' | 'enrolment' | 'integrity'>('accreditation');
  const [cycle, setCycle] = useState('2026-27');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<Column<any>[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    handleGeneratePreview();
  }, [reportType, cycle]);

  const handleGeneratePreview = async () => {
    setIsPreviewLoading(true);
    try {
      const res = await apiClient.get<any[]>(`/reports/preview/${reportType}`, {
        params: {
          institution_id: isAICTEAdmin() ? undefined : institutionId,
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
            if (val.includes('COMPLIANT') || val.includes('Clearance') || val.includes('A++') || val.includes('CLEAN') || val.includes('Verified')) {
              return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {val}
                </span>
              );
            }
            if (val.includes('BREACH') || val.includes('VIOLATION') || val.includes('Pending') || val.includes('HIGH')) {
              return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  {val}
                </span>
              );
            }
            if (key === 'apaar_saturation' || key === 'fulfillment_rate' || key === 'capacity_utilization') {
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

  const handleDownloadCSV = async () => {
    setIsDownloading(true);
    try {
      const res = await apiClient.get(`/reports/download/${reportType}`, {
        params: {
          institution_id: isAICTEAdmin() ? undefined : institutionId,
          admission_cycle: cycle,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${cycle}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded ${reportType} regulatory report.`);
    } catch {
      toast.error('Failed to download report CSV.');
    } finally {
      setIsDownloading(false);
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
            Automated statutory reporting for accreditation (NAAC/NBA/NIRF), regulatory compliance (AICTE Form-A), and national policy-making.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="secondary"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Print Summary
          </Button>
          <Button
            variant="primary"
            onClick={handleDownloadCSV}
            isLoading={isDownloading}
            icon={<Download className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Download CSV Export
          </Button>
        </div>
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
              <option value="policymaking">National Educational Policy-Making (Macro Seat Vacancy & Demographic Equity)</option>
              <option value="enrolment">Academic Program Enrolment & Capacity Saturation</option>
              <option value="integrity">Data Integrity & Anomaly Exceptions Audit Roster</option>
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
      </Card>

      {/* Preview Table */}
      <Card
        title={
          reportType === 'accreditation' ? 'Accreditation Benchmark Metrics Preview (NAAC / NBA / NIRF)' :
          reportType === 'regulatory' ? 'AICTE Mandatory Compliance Form-A Roster' :
          reportType === 'policymaking' ? 'Macro Policy & Demographic Analytics' :
          reportType === 'enrolment' ? 'Approved Intake vs Enrolment Utilization' : 'Flagged Compliance Exceptions Audit'
        }
        subtitle={`Live authoritative data compiled for ${cycle}. Verified under AICTE National Trust Framework.`}
        noPadding
      >
        {isPreviewLoading ? (
          <div className="p-12">
            <LoadingSpinner message="Compiling verified regulatory metrics from authoritative database..." />
          </div>
        ) : previewData.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            No report data previewed.
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
