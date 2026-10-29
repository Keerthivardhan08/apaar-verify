import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useIntakeSummary } from '../../hooks/useApi';
import { IntakeSummary } from '../../types';
import Card from '../../components/ui/Card';
import DataTable, { Column } from '../../components/ui/DataTable';
import EnrolmentChart from '../../components/charts/EnrolmentChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import { BarChart3, AlertOctagon, CheckCircle2, AlertTriangle } from 'lucide-react';

export const IntakeMonitoring: React.FC = () => {
  const { getUserInstitutionId } = useAuth();
  const institutionId = getUserInstitutionId() || undefined;

  const [cycle, setCycle] = useState('2024-2025');

  const {
    data: intakeData = [],
    isLoading,
    isError,
    refetch,
  } = useIntakeSummary({
    institution_id: institutionId,
    admission_cycle: cycle,
  });

  const getUtilizationBadge = (pct: number) => {
    if (pct > 100) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertOctagon className="w-3.5 h-3.5 mr-1" />
          {pct.toFixed(1)}% (Breached)
        </span>
      );
    }
    if (pct >= 80) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
          {pct.toFixed(1)}% (Near Capacity)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
        {pct.toFixed(1)}% (Compliant)
      </span>
    );
  };

  const columns: Column<IntakeSummary>[] = [
    {
      key: 'program_name',
      header: 'Program Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 block">{row.program_name || 'Unnamed Program'}</span>
          <span className="text-[11px] text-gray-400 font-mono">{row.program_code || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'approved_capacity',
      header: 'Approved Capacity',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <span className="font-mono text-gray-900 font-medium">
          {row.approved_capacity != null ? Number(row.approved_capacity).toLocaleString() : 'Data unavailable'}
        </span>
      ),
    },
    {
      key: 'enrolled_count',
      header: 'Enrolled Students',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <span className="font-mono text-indigo-700 font-bold">
          {row.enrolled_count != null ? Number(row.enrolled_count).toLocaleString() : '0'}
        </span>
      ),
    },
    {
      key: 'utilization_pct',
      header: 'Utilization %',
      render: (row) => getUtilizationBadge(row.utilization_pct ?? 0),
    },
    {
      key: 'status',
      header: 'Compliance Status',
      render: (row) => (
        <span className="text-xs uppercase font-semibold tracking-wider text-gray-700">
          {row.status || ((row.utilization_pct ?? 0) > 100 ? 'CAPACITY_BREACH' : 'COMPLIANT')}
        </span>
      ),
    },
  ];

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Cycle Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Intake Monitoring</h1>
          <p className="text-sm text-gray-500">
            Real-time enrollment tracking against AICTE approved seat matrix and intake ceilings.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-gray-600 uppercase">Cycle:</label>
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white font-medium"
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2022-2023">2022-2023</option>
          </select>
        </div>
      </div>

      {/* Grouped Bar Chart */}
      <Card
        title="Intake Capacity vs Enrolled Students"
        subtitle={`Enrolment statistics for admission cycle ${cycle}`}
      >
        {isLoading ? (
          <LoadingSpinner message="Calculating intake analytics..." />
        ) : intakeData.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Data unavailable for selected admission cycle.
          </div>
        ) : (
          <EnrolmentChart
            data={intakeData.map((d) => ({
              program_name: d.program_name || 'Program',
              enrolled: d.enrolled_count ?? 0,
              capacity: d.approved_capacity ?? 0,
              utilization_pct: d.utilization_pct ?? 0,
            }))}
            height={320}
          />
        )}
      </Card>

      {/* Detailed Intake Table */}
      <Card title="Program Intake Matrix & Sanction Orders" noPadding>
        <DataTable
          columns={columns}
          data={intakeData}
          keyExtractor={(row) => row.program_code || row.program_name}
          isLoading={isLoading}
          emptyTitle="No Programs Found"
          emptyDescription="No program intake data available for the selected cycle."
        />
      </Card>
    </div>
  );
};

export default IntakeMonitoring;
