import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCorrections } from '../../hooks/useApi';
import { CorrectionRequest } from '../../types';
import DataTable, { Column } from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import FilterBar, { FilterConfig } from '../../components/ui/FilterBar';
import { FileEdit, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const Corrections: React.FC = () => {
  const { getUserInstitutionId } = useAuth();
  const institutionId = getUserInstitutionId() || undefined;

  const [statusFilter, setStatusFilter] = useState('');

  const { data: corrections = [], isLoading, isError, refetch } = useCorrections({
    institution_id: institutionId,
    status: statusFilter || undefined,
  });

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ];

  const columns: Column<CorrectionRequest>[] = [
    {
      key: 'student_name',
      header: 'Student',
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 block">{row.student_name || 'Student Record'}</span>
          <span className="text-[11px] text-gray-500 font-mono">
            {row.institution_student_id || row.record_id}
          </span>
        </div>
      ),
    },
    {
      key: 'field_name',
      header: 'Field',
      render: (row) => (
        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
          {row.field_name}
        </span>
      ),
    },
    {
      key: 'values',
      header: 'Original vs Proposed',
      render: (row) => (
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500 line-through bg-gray-100 px-2 py-0.5 rounded">
            {row.original_value || '—'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {row.proposed_value}
          </span>
        </div>
      ),
    },
    {
      key: 'justification',
      header: 'Justification',
      render: (row) => (
        <div className="max-w-xs truncate text-xs text-gray-600" title={row.justification}>
          {row.justification}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Review Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      header: 'Requested Date',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Correction Requests</h1>
        <p className="text-sm text-gray-500">
          Track official correction workflows submitted for institutional records under AICTE review.
        </p>
      </div>

      <FilterBar
        filters={filterConfigs}
        values={{ status: statusFilter }}
        onChange={(_, val) => setStatusFilter(val)}
        onClear={() => setStatusFilter('')}
        searchPlaceholder="Filter corrections..."
      />

      <DataTable
        columns={columns}
        data={corrections}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No Correction Requests"
        emptyDescription="There are no active or historical correction requests filed for this institution."
      />
    </div>
  );
};

export default Corrections;
