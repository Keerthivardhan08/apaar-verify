import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIssues, useInstitutions } from '../../hooks/useApi';
import { ValidationIssue } from '../../types';
import StatCard from '../../components/ui/StatCard';
import DataTable, { Column } from '../../components/ui/DataTable';
import FilterBar, { FilterConfig } from '../../components/ui/FilterBar';
import Pagination from '../../components/ui/Pagination';
import SeverityBadge from '../../components/ui/SeverityBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, Eye, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export const IntegrityMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({
    institution_id: searchParams.get('institution_id') || '',
    severity: searchParams.get('severity') || '',
    rule_code: '',
    status: '',
  });

  const { data: institutions = [] } = useInstitutions();

  const { data: issuesData, isLoading, isError, refetch } = useIssues({
    page,
    size: 10,
    institution_id: filters.institution_id || undefined,
    severity: filters.severity || undefined,
    rule_code: filters.rule_code || undefined,
    status: filters.status || undefined,
  });

  const issues = issuesData?.items || [];
  const totalPages = issuesData?.pages || 1;
  const totalItems = issuesData?.total || 0;

  const handleFilterChange = (k: string, v: any) => {
    setFilters((prev) => ({ ...prev, [k]: v }));
    setPage(1);
  };

  const handleClear = () => {
    setFilters({ institution_id: '', severity: '', rule_code: '', status: '' });
    setPage(1);
  };

  const handleBatchAcknowledge = () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one issue.');
      return;
    }
    toast.success(`Marked ${selectedIds.length} issues as under active review`);
    setSelectedIds([]);
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'institution_id',
      label: 'Institution',
      type: 'select',
      options: institutions.map((inst) => ({ label: inst.name, value: inst.id })),
    },
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
      key: 'rule_code',
      label: 'Rule Code',
      type: 'select',
      options: [
        { label: 'INTAKE_CAPACITY_EXCEEDED', value: 'INTAKE_CAPACITY_EXCEEDED' },
        { label: 'CATEGORY_QUOTA_MISMATCH', value: 'CATEGORY_QUOTA_MISMATCH' },
        { label: 'DUPLICATE_STUDENT_ID', value: 'DUPLICATE_STUDENT_ID' },
        { label: 'CROSS_INSTITUTE_DUPLICATE', value: 'CROSS_INSTITUTE_DUPLICATE' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Resolved', value: 'resolved' },
      ],
    },
  ];

  const columns: Column<ValidationIssue>[] = [
    {
      key: 'select',
      header: '',
      width: '40px',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => {
            e.stopPropagation();
            setSelectedIds((prev) =>
              prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]
            );
          }}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (row) => <SeverityBadge severity={row.severity} />,
    },
    {
      key: 'institution_name',
      header: 'Institution',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 text-xs">
          {row.institution_name || institutions.find((i) => i.id === row.institution_id)?.name || 'Institution'}
        </span>
      ),
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
        <div className="max-w-xs sm:max-w-md truncate text-xs text-gray-800" title={row.description}>
          {row.description}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Review',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/aicte/reviews/${row.id}`)}
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            Examine
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          National Integrity Monitoring
        </h1>
        <p className="text-sm text-gray-500">
          Cross-institutional surveillance for seat tampering, quota deviations, and synthetic duplicate enrollments.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="All Flagged Exceptions"
          value={totalItems}
          icon={<ShieldAlert className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          title="Critical Capacity Breaches"
          value={issues.filter((i) => i.severity === 'critical').length}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="danger"
        />
        <StatCard
          title="Under Active Review"
          value={issues.filter((i) => i.status === 'under_review').length}
          icon={<Clock className="w-5 h-5" />}
          variant="warning"
        />
        <StatCard
          title="Resolved Exceptions"
          value={issues.filter((i) => i.status === 'resolved').length}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="success"
        />
      </div>

      {/* Filters and Batch Actions */}
      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClear}
        searchPlaceholder="Filter all issues..."
        actionButton={
          selectedIds.length > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBatchAcknowledge}
              icon={<Layers className="w-3.5 h-3.5" />}
            >
              Mark Under Review ({selectedIds.length})
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={issues}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(row) => navigate(`/aicte/reviews/${row.id}`)}
        emptyTitle="No Integrity Violations Found"
        emptyDescription="No anomalies match your current filters."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={10}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};

export default IntegrityMonitoring;
