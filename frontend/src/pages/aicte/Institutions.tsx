import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstitutions } from '../../hooks/useApi';
import { Institution } from '../../types';
import DataTable, { Column } from '../../components/ui/DataTable';
import FilterBar, { FilterConfig } from '../../components/ui/FilterBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Building2, School, MapPin, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';

export const Institutions: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    state: '',
    type: '',
    status: '',
  });

  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);

  const { data: institutions = [], isLoading, isError, refetch } = useInstitutions({
    state: filters.state || undefined,
    type: filters.type || undefined,
    search: search || undefined,
  });

  const filteredInstitutions = institutions.filter((inst) => {
    if (filters.status && inst.status.toLowerCase() !== filters.status.toLowerCase()) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        inst.name.toLowerCase().includes(q) ||
        inst.institution_code.toLowerCase().includes(q) ||
        inst.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filterConfigs: FilterConfig[] = [
    {
      key: 'state',
      label: 'State',
      type: 'select',
      options: [
        { label: 'Delhi', value: 'Delhi' },
        { label: 'Maharashtra', value: 'Maharashtra' },
        { label: 'Karnataka', value: 'Karnataka' },
        { label: 'Tamil Nadu', value: 'Tamil Nadu' },
        { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'Autonomous / IIT / NIT', value: 'CENTRAL_INSTITUTE' },
        { label: 'State University', value: 'STATE_UNIVERSITY' },
        { label: 'Private Technical College', value: 'PRIVATE_COLLEGE' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Under Audit', value: 'under_audit' },
        { label: 'Flagged', value: 'flagged' },
      ],
    },
  ];

  const columns: Column<Institution>[] = [
    {
      key: 'institution_code',
      header: 'Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
          {row.institution_code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Institution Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 block">{row.name}</span>
          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-400" />
            {row.city}, {row.state}
          </span>
        </div>
      ),
    },
    {
      key: 'institution_type',
      header: 'Type',
      render: (row) => (
        <Badge variant="secondary" size="sm">
          {row.institution_type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'total_records',
      header: 'Total Records',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <span className="font-mono text-gray-900 font-semibold">
          {(row.total_records || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'flagged_records',
      header: 'Flags',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => {
        const flagged = row.flagged_records || 0;
        return flagged > 0 ? (
          <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            {flagged}
          </span>
        ) : (
          <span className="text-xs text-emerald-600 font-medium">0</span>
        );
      },
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
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedInst(row)}
          >
            Quick View
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/aicte/institutions/${row.id}`)}
            icon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Compliance Desk
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Institutions Directory</h1>
          <p className="text-sm text-gray-500">
            National register of participating colleges and technical institutes under AICTE jurisdiction.
          </p>
        </div>
      </div>

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={(k, v) => setFilters({ ...filters, [k]: v })}
        onClear={() => setFilters({ state: '', type: '', status: '' })}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search institution name or code..."
      />

      <DataTable
        columns={columns}
        data={filteredInstitutions}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(row) => navigate(`/aicte/institutions/${row.id}`)}
        emptyTitle="No Institutions Found"
        emptyDescription="No registered institutions matched your search criteria."
      />

      {/* Institution Detail Modal */}
      <Modal
        isOpen={Boolean(selectedInst)}
        onClose={() => setSelectedInst(null)}
        title={selectedInst?.name || 'Institution Overview'}
        subtitle={`Code: ${selectedInst?.institution_code} • State: ${selectedInst?.state}`}
        maxWidth="lg"
      >
        {selectedInst && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-500 font-semibold block">Type:</span>
                <span className="text-gray-900">{selectedInst.institution_type}</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">Status:</span>
                <StatusBadge status={selectedInst.status} />
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">City & State:</span>
                <span className="text-gray-900">
                  {selectedInst.city}, {selectedInst.state}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">Regulatory Jurisdiction:</span>
                <span className="text-indigo-700 font-medium">AICTE Northern/Western Regional Node</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedInst(null)}
              >
                Close
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedInst(null);
                  navigate(`/aicte/integrity?institution_id=${selectedInst.id}`);
                }}
              >
                Inspect Integrity Flags
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const id = selectedInst.id;
                  setSelectedInst(null);
                  navigate(`/aicte/institutions/${id}`);
                }}
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open Compliance & Intake Dashboard
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Institutions;
