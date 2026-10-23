import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUploads } from '../../hooks/useApi';
import { uploadApi } from '../../services/api';
import { UploadBatch } from '../../types';
import DataTable, { Column } from '../../components/ui/DataTable';
import FilterBar, { FilterConfig } from '../../components/ui/FilterBar';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { Download, UploadCloud, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export const UploadHistory: React.FC = () => {
  const navigate = useNavigate();
  const { getUserInstitutionId } = useAuth();
  const institutionId = getUserInstitutionId() || undefined;

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: uploadsData, isLoading, isError, refetch } = useUploads({
    institution_id: institutionId,
    page,
    size: 10,
  });

  const batches = uploadsData?.items || [];
  const filteredBatches = statusFilter
    ? batches.filter((b) => b.status.toLowerCase() === statusFilter.toLowerCase())
    : batches;

  const handleDownloadErrors = async (batchId: string, fileName: string) => {
    try {
      const blob = await uploadApi.downloadErrors(batchId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `errors_${fileName.replace(/\.csv$/, '')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloaded validation error log');
    } catch {
      toast.error('No error log file available for this batch.');
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Batch Status',
      type: 'select',
      options: [
        { label: 'Validated', value: 'validated' },
        { label: 'Committed', value: 'committed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
      ],
    },
  ];

  const columns: Column<UploadBatch>[] = [
    {
      key: 'file_name',
      header: 'File Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 block">{row.file_name}</span>
          <span className="text-[11px] text-gray-400 font-mono">ID: {row.id}</span>
        </div>
      ),
    },
    {
      key: 'admission_cycle',
      header: 'Cycle',
      render: (row) => <span className="text-gray-700">{row.admission_cycle}</span>,
    },
    {
      key: 'created_at',
      header: 'Ingestion Date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-600">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'total_rows',
      header: 'Total Rows',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <span className="font-mono text-gray-800">{row.total_rows.toLocaleString()}</span>
      ),
    },
    {
      key: 'valid_rows',
      header: 'Valid',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <span className="font-mono font-medium text-emerald-600">
          {row.valid_rows.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'invalid_rows',
      header: 'Invalid',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <span
          className={`font-mono font-medium ${
            row.invalid_rows > 0 ? 'text-rose-600' : 'text-gray-400'
          }`}
        >
          {row.invalid_rows.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
          {row.invalid_rows > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadErrors(row.id, row.file_name)}
              icon={<Download className="w-3.5 h-3.5" />}
              title="Download Errors CSV"
            >
              Errors
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Upload Batch History</h1>
          <p className="text-sm text-gray-500">
            Audit history of student data files ingested, validation outcomes, and error exports.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/institution/upload')}
          icon={<UploadCloud className="w-4 h-4" />}
        >
          Upload New Batch
        </Button>
      </div>

      <FilterBar
        filters={filterConfigs}
        values={{ status: statusFilter }}
        onChange={(_, val) => setStatusFilter(val)}
        onClear={() => setStatusFilter('')}
        searchPlaceholder="Filter batch records..."
      />

      <DataTable
        columns={columns}
        data={filteredBatches}
        keyExtractor={(b) => b.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No Upload Batches"
        emptyDescription="Your institution has not ingested any CSV batches yet."
        emptyActionLabel="Upload First Batch"
        onEmptyAction={() => navigate('/institution/upload')}
      />

      <Pagination
        currentPage={page}
        totalPages={uploadsData?.pages || 1}
        totalItems={uploadsData?.total || 0}
        pageSize={10}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};

export default UploadHistory;
