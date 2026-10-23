import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIssue, useMakeDecision, useAssignReviewer } from '../../hooks/useApi';
import { IssueDecisionRequest } from '../../types';
import Card from '../../components/ui/Card';
import SeverityBadge from '../../components/ui/SeverityBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: issue, isLoading, isError, refetch } = useIssue(id);
  const makeDecisionMutation = useMakeDecision();
  const assignMutation = useAssignReviewer();

  const [decision, setDecision] = useState<IssueDecisionRequest['decision']>('confirmed_discrepancy');
  const [reason, setReason] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState('reviewer-01');

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading regulatory exception case..." />;
  }

  if (isError || !issue) {
    return (
      <ErrorState
        title="Case File Not Found"
        message="The requested review case could not be retrieved from the central docket."
        onRetry={refetch}
      />
    );
  }

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Statutory rationale and documentation reason are mandatory.');
      return;
    }

    await makeDecisionMutation.mutateAsync({
      issueId: issue.id,
      decision,
      reason,
    });
    setReason('');
  };

  const handleMarkFalsePositive = async () => {
    await makeDecisionMutation.mutateAsync({
      issueId: issue.id,
      decision: 'false_positive',
      reason: 'Algorithmic check identified edge-case legitimate exemption or duplicate hash artifact.',
    });
  };

  const handleReopen = async () => {
    await makeDecisionMutation.mutateAsync({
      issueId: issue.id,
      decision: 'unresolved',
      reason: 'Reopened for additional inspection by senior regulatory auditor.',
    });
  };

  const handleAssign = async () => {
    await assignMutation.mutateAsync({
      issueId: issue.id,
      userId: selectedReviewer,
    });
  };

  return (
    <div className="space-y-6">
      {/* Back and Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/aicte/reviews')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Review Queue
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                {issue.rule_code}
              </span>
              <SeverityBadge severity={issue.severity} />
              <StatusBadge status={issue.status} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">
              Case Ref #{issue.id.slice(0, 8)}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {issue.status === 'resolved' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReopen}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Reopen Case
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkFalsePositive}
              icon={<XCircle className="w-4 h-4 text-gray-500" />}
            >
              Mark False Positive
            </Button>
          )}
        </div>
      </div>

      {/* Grid: Issue Details & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Evidence & Record Comparison */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Violation Details & Ingestion Evidence">
            <p className="text-base font-semibold text-gray-900 mb-4">{issue.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
              <div>
                <span className="font-semibold text-gray-500 uppercase block mb-1">
                  Expected Statutory Condition:
                </span>
                <div className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg font-mono">
                  {issue.expected_condition || 'Approved capacity threshold and category quota alignment'}
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-500 uppercase block mb-1">
                  Observed Non-Compliant Condition:
                </span>
                <div className="p-2.5 bg-rose-50 text-rose-900 border border-rose-200 rounded-lg font-mono">
                  {issue.observed_condition || 'Over-enrollment beyond sanctioned limit'}
                </div>
              </div>
            </div>

            {issue.affected_field && (
              <div className="mt-4 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Affected Data Field:</span>{' '}
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">
                  {issue.affected_field}
                </span>
              </div>
            )}
          </Card>

          {/* Record Comparison */}
          <Card title="Institutional Record Inspection">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Attribute</th>
                    <th className="px-4 py-2.5">Original Batch Submission</th>
                    <th className="px-4 py-2.5">AICTE Regulatory Benchmark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  <tr>
                    <td className="px-4 py-2 font-medium text-gray-900">Program / Branch</td>
                    <td className="px-4 py-2 text-gray-700">
                      {issue.program_name || 'Computer Science Engineering'}
                    </td>
                    <td className="px-4 py-2 text-indigo-700 font-medium">Valid Sanctioned Branch</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-gray-900">Student Roll Ref</td>
                    <td className="px-4 py-2 font-mono text-gray-700">
                      {issue.institution_student_id || issue.record_id || '2024CS-FLAGGED'}
                    </td>
                    <td className="px-4 py-2 text-gray-500">Unique identifier mandated</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-gray-900">Severity Assessment</td>
                    <td className="px-4 py-2">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="px-4 py-2 text-gray-500">High impact on statutory audit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Decision History Timeline */}
          <Card title="Docket Audit Trail & Decision History">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900">Exception Algorithmic Trigger</span>
                  <p className="text-gray-500 mt-0.5">
                    Triggered on CSV ingestion by rule engine on{' '}
                    {new Date(issue.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {issue.resolved_at && (
                <div className="flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-emerald-800">
                      Determined Decision Recorded
                    </span>
                    <p className="text-gray-700 mt-0.5 font-medium">
                      Resolution: {issue.resolution_reason || 'Officially adjudicated'}
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {new Date(issue.resolved_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Adjudication Form & Reviewer Assignment */}
        <div className="space-y-6">
          {/* Adjudication Form */}
          <Card title="Record AICTE Determination">
            <form onSubmit={handleSubmitDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Determination Decision *
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white font-medium"
                >
                  <option value="confirmed_discrepancy">Confirmed Discrepancy (Violation)</option>
                  <option value="corrected">Corrected via Institutional Amendment</option>
                  <option value="legitimate_exception">Legitimate Statutory Exception</option>
                  <option value="duplicate_confirmed">Duplicate Enrollment Confirmed</option>
                  <option value="false_positive">False Positive System Flag</option>
                  <option value="unresolved">Unresolved (Defer for Higher Hearing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Regulatory Finding & Reason *
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the statutory findings, legal references, or institutional sanction orders justifying this decision..."
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={makeDecisionMutation.isPending}
              >
                Submit Regulatory Decision
              </Button>
            </form>
          </Card>

          {/* Assign Reviewer */}
          <Card title="Assign Regulatory Officer">
            <div className="space-y-3">
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white"
              >
                <option value="officer-01">Dr. S. K. Sharma (Technical Director)</option>
                <option value="officer-02">P. V. Narayanan (Intake Compliance)</option>
                <option value="officer-03">Ananya Sen (APAAR Liaison Officer)</option>
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleAssign}
                isLoading={assignMutation.isPending}
                className="w-full"
                icon={<UserCheck className="w-4 h-4" />}
              >
                Assign Case
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetail;
