import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Database, 
  CheckCircle2, 
  BarChart3, 
  FileCheck,
  Building,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { freshnessApi, referenceDataApi } from '../../services/api';
import { FreshnessOverview, ReconciliationReport } from '../../types';

export const FreshnessMonitor: React.FC = () => {
  const [freshness, setFreshness] = useState<FreshnessOverview | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingMaster, setSyncingMaster] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('2026-27');

  useEffect(() => {
    loadData();
  }, [selectedCycle]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fresh, recon] = await Promise.all([
        freshnessApi.getOverview().catch(() => null),
        referenceDataApi.getReconciliation(selectedCycle).catch(() => null),
      ]);
      setFreshness(fresh);
      setReconciliation(recon);
    } catch {
      toast.error('Failed to load freshness and reconciliation telemetry');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMaster = async () => {
    setSyncingMaster(true);
    try {
      const res = await referenceDataApi.syncMaster('aicte_portal');
      toast.success('Central AICTE authoritative master data synchronized successfully');
      loadData();
    } catch {
      toast.error('Failed to sync with central AICTE approval registry');
    } finally {
      setSyncingMaster(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FRESH':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Fresh (Active)</span>;
      case 'MODERATE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Moderate</span>;
      case 'STALE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Stale Submission</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Critical SLA Breached</span>;
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Source Freshness & Authoritative Reconciliation Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Phase 3 Architecture
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Regulatory submission cadence monitoring, 30-day SLA compliance tracking, and master AICTE capacity reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncMaster}
            disabled={syncingMaster}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Database className={`h-4 w-4 ${syncingMaster ? 'animate-spin' : ''}`} />
            {syncingMaster ? 'Syncing Registry...' : 'Sync Central Master'}
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
            title="Refresh telemetry"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Freshness & SLA Stat Cards */}
      {freshness && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs">
              <span>SLA Compliance Rate</span>
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{freshness.sla_compliance_pct}%</p>
            <span className="text-[11px] text-green-700 font-medium mt-1 inline-block">
              {freshness.summary.fresh + freshness.summary.moderate} of {freshness.total_institutions} institutions within SLA
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs">
              <span>Fresh Submissions (&lt; 7 Days)</span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-extrabold text-green-600 mt-2">{freshness.summary.fresh}</p>
            <span className="text-[11px] text-gray-500 mt-1 inline-block">Active and current data feeds</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs">
              <span>Stale Submissions (31-60 Days)</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-amber-600 mt-2">{freshness.summary.stale}</p>
            <span className="text-[11px] text-amber-700 font-medium mt-1 inline-block">Reconciliation overdue</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 text-xs">
              <span>Critical SLA Breaches (&gt; 60 Days)</span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-extrabold text-red-600 mt-2">{freshness.summary.critical_sla_breached}</p>
            <span className="text-[11px] text-red-700 font-medium mt-1 inline-block">Requires regulatory intervention</span>
          </div>
        </div>
      )}

      {/* Freshness Cadence Table */}
      {freshness && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-gray-900">
                Institutional Data Cadence & Staleness Ledger
              </h2>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              Regulatory SLA Threshold: 30 Days
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Institution</th>
                  <th className="px-4 py-3 text-left">State / Region</th>
                  <th className="px-4 py-3 text-left">Total Records</th>
                  <th className="px-4 py-3 text-left">Days Since Submission</th>
                  <th className="px-4 py-3 text-left">Freshness Status</th>
                  <th className="px-4 py-3 text-left">SLA Rating</th>
                  <th className="px-4 py-3 text-left">Open Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {freshness.institutions.map((inst) => (
                  <tr key={inst.institution_id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 block">{inst.institution_name}</span>
                      <span className="text-gray-400 font-mono text-[11px]">{inst.institution_code}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inst.city}, {inst.state}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{inst.total_records}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-indigo-700">{inst.days_since_last_submission} days</span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(inst.freshness_status)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          inst.sla_rating === 'COMPLIANT'
                            ? 'bg-green-100 text-green-800'
                            : inst.sla_rating === 'WARNING_WINDOW'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inst.sla_rating}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inst.open_discrepancies > 0 ? (
                        <span className="text-amber-700 font-bold">{inst.open_discrepancies} open</span>
                      ) : (
                        <span className="text-green-600 font-medium">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Authoritative Intake Reconciliation Report */}
      {reconciliation && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Authoritative AICTE Intake Master Reconciliation
                </h2>
                <p className="text-xs text-gray-500">
                  Cross-checks institutional submitted enrolments against authoritative central approval limits.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500">Admission Cycle:</span>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded px-2 py-1 font-medium text-gray-800"
              >
                <option value="2026-27">2026-27</option>
                <option value="2025-26">2025-26</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Programs Evaluated</span>
              <p className="text-xl font-bold text-gray-900">{reconciliation.total_programs_evaluated}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Authoritative Capacity</span>
              <p className="text-xl font-bold text-indigo-700">{reconciliation.total_authoritative_capacity}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Total Enrolled</span>
              <p className="text-xl font-bold text-gray-900">{reconciliation.total_enrolled_count}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Intake Discrepancies</span>
              <p className={`text-xl font-bold ${reconciliation.total_discrepancies > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {reconciliation.total_discrepancies}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Institution</th>
                  <th className="px-3 py-2 text-left">Program</th>
                  <th className="px-3 py-2 text-right">Master Limit</th>
                  <th className="px-3 py-2 text-right">Enrolled Count</th>
                  <th className="px-3 py-2 text-right">Variance</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {reconciliation.reconciliation_rows.map((row) => (
                  <tr key={row.program_id} className="hover:bg-gray-50/70">
                    <td className="px-3 py-2 font-medium text-gray-900">{row.institution_name}</td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-gray-800">{row.program_name}</span>
                      <span className="text-gray-400 font-mono text-[10px] block">{row.program_code}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-gray-700">{row.authoritative_capacity}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">{row.current_enrolled}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      <span className={row.variance > 0 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                        {row.variance > 0 ? `+${row.variance}` : row.variance}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.reconciliation_status === 'COMPLIANT'
                            ? 'bg-green-100 text-green-800'
                            : row.reconciliation_status === 'INTAKE_EXCEEDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {row.reconciliation_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreshnessMonitor;
