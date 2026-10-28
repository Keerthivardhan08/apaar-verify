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
import InstitutePortfolioModal from '../../components/institutions/InstitutePortfolioModal';
import { Building2, School, MapPin, ExternalLink, ShieldCheck, AlertTriangle, Award, Layers, BarChart3 } from 'lucide-react';

export const Institutions: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    state: '',
    type: '',
    status: '',
  });

  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [portfolioInstId, setPortfolioInstId] = useState<string | null>(null);

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
        inst.city.toLowerCase().includes(q) ||
        inst.state.toLowerCase().includes(q)
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
        { label: 'Karnataka', value: 'Karnataka' },
        { label: 'Maharashtra', value: 'Maharashtra' },
        { label: 'Delhi', value: 'Delhi' },
        { label: 'Tamil Nadu', value: 'Tamil Nadu' },
        { label: 'Telangana', value: 'Telangana' },
        { label: 'Rajasthan', value: 'Rajasthan' },
        { label: 'Punjab', value: 'Punjab' },
        { label: 'West Bengal', value: 'West Bengal' },
        { label: 'Kerala', value: 'Kerala' },
        { label: 'Uttarakhand', value: 'Uttarakhand' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'Central Institutes (IIT/NIT/IIIT/BITS)', value: 'CENTRAL_INSTITUTE' },
        { label: 'State Universities (DTU/COEP/Anna/VJTI)', value: 'STATE_UNIVERSITY' },
        { label: 'Private Technical Colleges (RVCE/BMS/DSCE/PSG)', value: 'PRIVATE_COLLEGE' },
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
        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
          {row.institution_code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Institution & Location',
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
      key: 'accreditation',
      header: 'Accreditation',
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          {row.naac_grade && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-600" />
              NAAC {row.naac_grade}
            </span>
          )}
          {row.nba_status && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
              NBA {row.nba_status}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'branches',
      header: 'Branches',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 inline-flex items-center gap-1">
          <Layers className="w-3 h-3 text-indigo-600" />
          {row.total_programs || 0} Branches
        </span>
      ),
    },
    {
      key: 'intake_enrolled',
      header: 'Enrolled / Approved Intake',
      className: 'text-left min-w-[160px]',
      render: (row) => {
        const approved = row.total_approved_intake || 0;
        const enrolled = row.total_enrolled || 0;
        const pct = approved > 0 ? Math.round((enrolled / approved) * 100) : 0;
        const isBreach = pct > 100;
        const barColor = isBreach ? 'bg-rose-500' : pct < 85 ? 'bg-amber-500' : 'bg-emerald-500';

        return (
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="font-bold text-gray-900">{enrolled.toLocaleString()} / {approved.toLocaleString()}</span>
              <span className={`font-bold ${isBreach ? 'text-rose-600' : 'text-gray-600'}`}>{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'complaints',
      header: 'Complaints',
      className: 'text-center',
      headerClassName: 'text-center',
      render: (row) => {
        const pending = row.pending_complaints || 0;
        return pending > 0 ? (
          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {pending} Pending
          </span>
        ) : (
          <span className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            0 Pending
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      className: 'text-right min-w-[200px]',
      headerClassName: 'text-right',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPortfolioInstId(row.id)}
            icon={<Award className="w-3.5 h-3.5 text-indigo-600" />}
            className="font-bold border-indigo-200 text-indigo-900 hover:bg-indigo-50"
          >
            Portfolio
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Institutions Directory & Accreditation Registry</h1>
          <p className="text-sm text-gray-500">
            National register of {institutions.length} technical institutions under AICTE jurisdiction with NBA, NAAC, complaints desk and seat utilization analytics.
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
        searchPlaceholder="Search institution name, code, state, or city..."
      />

      <DataTable
        columns={columns}
        data={filteredInstitutions}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(row) => setPortfolioInstId(row.id)}
        emptyTitle="No Institutions Found"
        emptyDescription="No registered institutions matched your search criteria."
      />

      {/* Comprehensive Institute Portfolio Modal */}
      <InstitutePortfolioModal
        institutionId={portfolioInstId}
        isOpen={Boolean(portfolioInstId)}
        onClose={() => setPortfolioInstId(null)}
        onOpenComplianceDesk={(id) => navigate(`/aicte/institutions/${id}`)}
      />

      {/* Quick View Modal */}
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
                <span className="text-gray-900 font-medium">{selectedInst.institution_type.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">Status:</span>
                <StatusBadge status={selectedInst.status} />
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">City & State:</span>
                <span className="text-gray-900 font-medium">
                  {selectedInst.city}, {selectedInst.state}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">Total Programs (Branches):</span>
                <span className="text-indigo-700 font-bold">{selectedInst.total_programs || 0} Engineering Branches</span>
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
                  const id = selectedInst.id;
                  setSelectedInst(null);
                  setPortfolioInstId(id);
                }}
                icon={<Award className="w-3.5 h-3.5 text-indigo-600" />}
              >
                View Full Portfolio
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
