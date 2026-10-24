import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  useDashboardSummary,
  useInstitution,
  useUploads,
  useIssues,
  useIntakeSummary,
} from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import SeverityBadge from '../../components/ui/SeverityBadge';
import EnrolmentChart from '../../components/charts/EnrolmentChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UploadCloud,
  ArrowRight,
  School,
  FileSpreadsheet,
} from 'lucide-react';

export const InstitutionOverview: React.FC = () => {
  const { user, getUserInstitutionId } = useAuth();
  const navigate = useNavigate();
  const institutionId = getUserInstitutionId() || undefined;

  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useDashboardSummary({ institution_id: institutionId });

  const { data: institution } = useInstitution(institutionId);

  const { data: uploadsData, isLoading: isUploadsLoading } = useUploads({
    institution_id: institutionId,
    size: 5,
  });

  const { data: issuesData, isLoading: isIssuesLoading } = useIssues({
    institution_id: institutionId,
    size: 5,
  });

  const { data: intakeData, isLoading: isIntakeLoading } = useIntakeSummary({
    institution_id: institutionId,
  });

  if (isSummaryError) {
    return <ErrorState onRetry={refetchSummary} />;
  }

  const institutionName = institution?.name || 'Academic Institution Node';
  const recentUploads = uploadsData?.items || [];
  const recentIssues = issuesData?.items || [];

  return (
    <div className="space-y-6">
      {/* Welcome & Institution Banner */}
      <div className="bg-gradient-to-r from-indigo-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-indigo-200 text-xs font-semibold tracking-wider uppercase">
            <School className="w-4 h-4" />
            <span>Institution Workspace • Code: {institution?.institution_code || 'INST-001'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{institutionName}</h1>
          <p className="text-sm text-indigo-100/90 max-w-2xl">
            National Academic Records Intake & APAAR Identity Verification Management console. Review
            intake limits, submission batches, and resolve flagged validation exceptions.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="primary"
            onClick={() => navigate('/institution/upload')}
            icon={<UploadCloud className="w-4 h-4" />}
            className="bg-white text-indigo-900 hover:bg-indigo-50 border-white shadow-sm"
          >
            Upload Data
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/institution/issues')}
            icon={<AlertTriangle className="w-4 h-4" />}
            className="text-white border-indigo-300 hover:bg-white/10"
          >
            View Issues
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/institution/students')}
            icon={<Users className="w-4 h-4" />}
            className="text-white border-indigo-300 hover:bg-white/10"
          >
            View Students
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/institution/compliance')}
            icon={<FileSpreadsheet className="w-4 h-4" />}
            className="text-white border-indigo-300 hover:bg-white/10"
          >
            Quota & Intake Desk
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {isSummaryLoading ? (
        <LoadingSpinner message="Loading institution statistics..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={(summary?.total_records ?? 0).toLocaleString()}
            icon={<Users className="w-5 h-5" />}
            subtitle="Uploaded student records"
            variant="default"
            onClick={() => navigate('/institution/students')}
          />
          <StatCard
            title="Valid Records"
            value={(summary?.valid_records ?? 0).toLocaleString()}
            icon={<CheckCircle2 className="w-5 h-5" />}
            subtitle="Fully compliant with AICTE rules"
            variant="success"
            onClick={() => navigate('/institution/students?record_status=accepted')}
          />
          <StatCard
            title="Flagged Records"
            value={(summary?.flagged_records ?? 0).toLocaleString()}
            icon={<AlertTriangle className="w-5 h-5" />}
            subtitle="Requires operator review"
            variant={summary?.flagged_records ? 'danger' : 'default'}
            onClick={() => navigate('/institution/students?record_status=flagged')}
          />
          <StatCard
            title="Pending Issues"
            value={(summary?.pending_review ?? 0).toLocaleString()}
            icon={<Clock className="w-5 h-5" />}
            subtitle={`${summary?.unresolved_high_severity ?? 0} high severity`}
            variant={summary?.pending_review ? 'warning' : 'default'}
            onClick={() => navigate('/institution/issues?status=open')}
          />
        </div>
      )}

      {/* Grid: Intake Mini-Chart & Recent Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intake Utilization Mini-Chart */}
        <div className="lg:col-span-2">
          <Card
            title="Program Intake Utilization"
            subtitle="Enrolled students vs AICTE approved capacity"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/institution/intake')}
              >
                <span>Full Intake View</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            }
          >
            {isIntakeLoading ? (
              <LoadingSpinner message="Loading intake data..." />
            ) : (
              <EnrolmentChart
                data={
                  intakeData?.map((item) => ({
                    program_name: item.program_name,
                    enrolled: item.enrolled_count,
                    capacity: item.approved_capacity,
                    utilization_pct: item.utilization_pct,
                  })) || []
                }
                height={280}
              />
            )}
          </Card>
        </div>

        {/* Recent Validation Issues List */}
        <div>
          <Card
            title="Recent Validation Issues"
            subtitle="Latest discrepancies detected"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/institution/issues')}
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            }
            noPadding
          >
            {isIssuesLoading ? (
              <div className="p-6">
                <LoadingSpinner size="sm" />
              </div>
            ) : recentIssues.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500">
                No open validation issues found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {recentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => navigate('/institution/issues')}
                    className="p-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-semibold text-gray-900">
                        {issue.rule_code}
                      </span>
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{issue.description}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Status: {issue.status}</span>
                      <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Upload Batches Table */}
      <Card
        title="Recent Upload Batches"
        subtitle="Recent CSV ingestion runs and validation states"
        headerAction={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/institution/uploads')}
          >
            <span>Batch History</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        }
        noPadding
      >
        {isUploadsLoading ? (
          <div className="p-6">
            <LoadingSpinner size="sm" />
          </div>
        ) : recentUploads.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p>No upload batches found yet.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/institution/upload')}
              className="mt-3"
            >
              Upload First Batch
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3">File Name</th>
                  <th className="px-6 py-3">Admission Cycle</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Total Rows</th>
                  <th className="px-6 py-3 text-right">Valid</th>
                  <th className="px-6 py-3 text-right">Invalid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {recentUploads.map((batch) => (
                  <tr
                    key={batch.id}
                    onClick={() => navigate(`/institution/uploads`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-3.5 font-medium text-gray-900">{batch.file_name}</td>
                    <td className="px-6 py-3.5 text-gray-600">{batch.admission_cycle}</td>
                    <td className="px-6 py-3.5 text-gray-500">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-gray-700">
                      {batch.total_rows.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-emerald-600 font-semibold">
                      {batch.valid_rows.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-rose-600 font-semibold">
                      {batch.invalid_rows.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InstitutionOverview;
