import React, { useState } from 'react';
import { useAuditEvents } from '../../hooks/useApi';
import { AuditEvent } from '../../types';
import DataTable, { Column } from '../../components/ui/DataTable';
import FilterBar, { FilterConfig } from '../../components/ui/FilterBar';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { Download, ChevronRight, ChevronDown, ShieldCheck, History } from 'lucide-react';
import toast from 'react-hot-toast';

export const AuditExplorer: React.FC = () => {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    action: '',
    target_type: '',
  });

  const { data: auditData, isLoading, isError, refetch } = useAuditEvents({
    page,
    size: 15,
    action: filters.action || undefined,
    target_type: filters.target_type || undefined,
  });

  const events = auditData?.items || [];
  const totalPages = auditData?.pages || 1;
  const totalItems = auditData?.total || 0;

  const handleExport = () => {
    if (events.length === 0) {
      toast.error('No events to export.');
      return;
    }
    const headers = ['Timestamp', 'Actor', 'Action', 'Target Type', 'Target ID', 'Outcome'];
    const rows = events.map((e) => [
      e.created_at,
      e.actor_email || e.actor_id || 'System',
      e.action,
      e.target_type,
      e.target_id || '',
      e.outcome,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit trail exported successfully');
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'action',
      label: 'Action',
      type: 'select',
      options: [
        { label: 'BATCH_UPLOAD', value: 'BATCH_UPLOAD' },
        { label: 'RECORD_VALIDATION', value: 'RECORD_VALIDATION' },
        { label: 'DECISION_SUBMITTED', value: 'DECISION_SUBMITTED' },
        { label: 'RECORD_CORRECTION', value: 'RECORD_CORRECTION' },
        { label: 'CREDENTIAL_ISSUED', value: 'CREDENTIAL_ISSUED' },
      ],
    },
    {
      key: 'target_type',
      label: 'Target Type',
      type: 'select',
      options: [
        { label: 'STUDENT_RECORD', value: 'student_record' },
        { label: 'UPLOAD_BATCH', value: 'upload_batch' },
        { label: 'VALIDATION_ISSUE', value: 'validation_issue' },
        { label: 'CREDENTIAL', value: 'credential' },
      ],
    },
  ];

  const columns: Column<AuditEvent>[] = [
    {
      key: 'expand',
      header: '',
      width: '40px',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedId(expandedId === row.id ? null : row.id);
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          {expandedId === row.id ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-gray-700">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => (
        <span className="text-xs text-gray-900 font-medium">
          {row.actor_email || row.actor_name || row.actor_id || 'System Daemon'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Regulatory Action',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
          {row.action}
        </span>
      ),
    },
    {
      key: 'target_type',
      header: 'Target Entity',
      render: (row) => (
        <span className="text-xs text-gray-600 capitalize">
          {row.target_type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      render: (row) => (
        <StatusBadge status={row.outcome.toLowerCase() === 'success' ? 'valid' : 'rejected'} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Explorer</h1>
          <p className="text-sm text-gray-500">
            Immutable regulatory audit log of all record uploads, verifications, corrections, and determinations.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          icon={<Download className="w-4 h-4" />}
        >
          Export Audit Trail
        </Button>
      </div>

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={(k, v) => {
          setFilters((prev) => ({ ...prev, [k]: v }));
          setPage(1);
        }}
        onClear={() => {
          setFilters({ action: '', target_type: '' });
          setPage(1);
        }}
        searchPlaceholder="Filter audit records..."
      />

      <DataTable
        columns={columns}
        data={events}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
        emptyTitle="No Audit Events Found"
        emptyDescription="No events match your filter query."
      />

      {/* Expanded Metadata Viewer */}
      {expandedId && (
        <div className="bg-slate-900 text-slate-200 p-5 rounded-xl text-xs font-mono overflow-x-auto shadow-md animate-in fade-in duration-150">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-semibold uppercase">Event Metadata Payload</span>
            <button
              onClick={() => setExpandedId(null)}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <pre>
            {JSON.stringify(
              events.find((e) => e.id === expandedId)?.metadata || { note: 'No extra metadata payload' },
              null,
              2
            )}
          </pre>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={15}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};

export default AuditExplorer;
