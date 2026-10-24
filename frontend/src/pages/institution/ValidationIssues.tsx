import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useIssues, useResolveIssue, useRunValidation } from '../../hooks/useApi';
import { RefreshCw } from 'lucide-react';
import { ValidationIssue } from '../../types';
import DataTable, { Column } from '../../components/ui/DataTable';
import FilterBar, { FilterConfig } from '../../components/ui/FilterBar';
import Pagination from '../../components/ui/Pagination';
import SeverityBadge from '../../components/ui/SeverityBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const ValidationIssues: React.FC = () => {
  const { getUserInstitutionId, isInstitutionAdmin, isAICTEAdmin } = useAuth();
  const institutionId = getUserInstitutionId() || undefined;

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({
    severity: '',
    status: '',
    rule_code: '',
  });

  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);
  const [selectedIssueToResolve, setSelectedIssueToResolve] = useState<ValidationIssue | null>(null);
  const [resolutionReason, setResolutionReason] = useState('');

  const { data: issuesData, isLoading, isError, refetch } = useIssues(
    {
      institution_id: institutionId,
      page,
      size: 10,
      severity: filters.severity || undefined,
      status: filters.status || undefined,
      rule_code: filters.rule_code || undefined,
    },
    { refetchInterval: 8000 }
  );

  const resolveMutation = useResolveIssue();
  const runValidationMutation = useRunValidation();

  const handleRunBatchValidation = async () => {
    await runValidationMutation.mutateAsync({
      institution_id: institutionId,
    });
    refetch();
  };

  const issues = issuesData?.items || [];
  const totalPages = issuesData?.pages || 1;
  const totalItems = issuesData?.total || 0;

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ severity: '', status: '', rule_code: '' });
    setPage(1);
  };

  const handleResolveSubmit = async () => {
    if (!selectedIssueToResolve || !resolutionReason.trim()) {
      toast.error('Please provide a valid resolution reason.');
      return;
    }

    await resolveMutation.mutateAsync({
      id: selectedIssueToResolve.id,
      reason: resolutionReason,
    });

    setSelectedIssueToResolve(null);
    setResolutionReason('');
  };

  const maskId = (idStr: string | null) => {
    if (!idStr) return '—';
    if (idStr.length <= 4) return idStr;
    return '••••' + idStr.slice(-4);
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'severity',
      label: 'Severity',
      type: 'select',
      options: [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Warning', value: 'warning' },
        { label: 'Info', value: 'info' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Under Review', value: 'under_review' },
      ],
    },
    {
      key: 'rule_code',
      label: 'Rule Code',
      type: 'select',
      options: [
        { label: 'INTAKE_CAPACITY_EXCEEDED', value: 'INTAKE_CAPACITY_EXCEEDED' },
        { label: 'CATEGORY_QUOTA_MISMATCH', value: 'CATEGORY_QUOTA_MISMATCH' },
        { label: 'DUPLICATE_STUDENT_ID', value: 'DUPLICATE_STUDENT_ID' },
        { label: 'INVALID_DOB_FORMAT', value: 'INVALID_DOB_FORMAT' },
        { label: 'APAAR_UNVERIFIED', value: 'APAAR_UNVERIFIED' },
      ],
    },
  ];

  const columns: Column<ValidationIssue>[] = [
    {
      key: 'expand',
      header: '',
      width: '40px',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedIssueId(expandedIssueId === row.id ? null : row.id);
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          {expandedIssueId === row.id ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (row) => <SeverityBadge severity={row.severity} />,
    },
    {
      key: 'rule_code',
      header: 'Rule Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
          {row.rule_code}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <div className="max-w-md truncate text-gray-800" title={row.description}>
          {row.description}
        </div>
      ),
    },
    {
      key: 'record_id',
      header: 'Record ID',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600">
          {maskId(row.institution_student_id || row.record_id)}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Flagged Date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => {
        const canResolve = isInstitutionAdmin() || isAICTEAdmin();
        if (row.status === 'resolved' || !canResolve) return null;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIssueToResolve(row)}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Resolve
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Validation Issues</h1>
          <p className="text-sm text-gray-500">
            Review discrepancies detected by the rule engine including capacity breaches, quota
            disparities, and identity hash flags.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            Real-Time Sync Active (8s)
          </span>
          <Button
            variant="primary"
            onClick={handleRunBatchValidation}
            isLoading={runValidationMutation.isPending}
            icon={<RefreshCw className={`w-4 h-4 ${runValidationMutation.isPending ? 'animate-spin' : ''}`} />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Re-run Real-Time Validation
          </Button>
        </div>
      </div>

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        searchPlaceholder="Filter issues..."
      />

      <DataTable
        columns={columns}
        data={issues}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(row) => setExpandedIssueId(expandedIssueId === row.id ? null : row.id)}
        emptyTitle="No Validation Issues"
        emptyDescription="All records satisfy AICTE intake limits and formatting constraints."
      />

      {/* Expanded Issue Detail Panel */}
      {expandedIssueId && (
        <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-200 animate-in fade-in duration-200">
          {(() => {
            const issue = issues.find((i) => i.id === expandedIssueId);
            if (!issue) return null;
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-indigo-900">
                      {issue.rule_code}
                    </span>
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedIssueId(null)}
                  >
                    Close
                  </Button>
                </div>
                <p className="text-sm text-gray-800 font-medium">{issue.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-lg border border-gray-200">
                  <div>
                    <span className="font-semibold text-gray-500 block mb-1">
                      Expected Condition:
                    </span>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded block">
                      {issue.expected_condition || 'Compliant with statutory intake capacity'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 block mb-1">
                      Observed Condition:
                    </span>
                    <span className="font-mono text-rose-700 bg-rose-50 px-2 py-1 rounded block">
                      {issue.observed_condition || 'Breach identified during validation'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={10}
        onPageChange={(p) => setPage(p)}
      />

      {/* Resolve Issue Modal */}
      <Modal
        isOpen={Boolean(selectedIssueToResolve)}
        onClose={() => setSelectedIssueToResolve(null)}
        title="Resolve Validation Issue"
        subtitle={`Rule: ${selectedIssueToResolve?.rule_code}`}
        maxWidth="md"
        onConfirm={handleResolveSubmit}
        confirmLabel="Confirm Resolution"
        isConfirmLoading={resolveMutation.isPending}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{selectedIssueToResolve?.description}</p>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Resolution Reason / Evidence *
            </label>
            <textarea
              required
              rows={3}
              value={resolutionReason}
              onChange={(e) => setResolutionReason(e.target.value)}
              placeholder="State the justification, regulatory sanction order, or data correction made to resolve this issue."
              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ValidationIssues;
