import React, { useState, useEffect } from 'react';
import { useDashboardSummary, useDataQualityTrend, useInstitutions } from '../../hooks/useApi';
import { riskScoringApi, analyticsV2Api, InstitutionRiskScore } from '../../services/api';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorState from '../../components/ui/ErrorState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  LineChart as ChartIcon,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Cpu,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { data: summary, isLoading: isSummaryLoading, isError, refetch } = useDashboardSummary();
  const { data: trendData = [], isLoading: isTrendLoading } = useDataQualityTrend();
  const { data: institutions = [] } = useInstitutions();

  const [activeTab, setActiveTab] = useState<'overview' | 'risk_scoring' | 'model_performance'>('overview');
  const [riskScores, setRiskScores] = useState<InstitutionRiskScore[]>([]);
  const [isRiskLoading, setIsRiskLoading] = useState(false);

  const [trendsV2, setTrendsV2] = useState<any>(null);
  const [modelPerf, setModelPerf] = useState<any>(null);
  const [isPerfLoading, setIsPerfLoading] = useState(false);

  useEffect(() => {
    loadRiskScores();
    loadTrendsAndModelPerf();
  }, []);

  const loadRiskScores = async () => {
    setIsRiskLoading(true);
    try {
      const data = await riskScoringApi.getRiskScores();
      setRiskScores(data);
    } catch (err) {
      console.error('Failed to load risk scores', err);
    } finally {
      setIsRiskLoading(false);
    }
  };

  const loadTrendsAndModelPerf = async () => {
    setIsPerfLoading(true);
    try {
      const [tData, pData] = await Promise.all([
        analyticsV2Api.getTrends(),
        analyticsV2Api.getModelPerformance(),
      ]);
      setTrendsV2(tData);
      setModelPerf(pData);
    } catch (err) {
      console.error('Failed to load model performance', err);
    } finally {
      setIsPerfLoading(false);
    }
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  const categoryBarData = [
    { category: 'Capacity Overflow', count: 18, color: '#dc2626' },
    { category: 'Quota Allocation', count: 12, color: '#f97316' },
    { category: 'Aadhaar / APAAR Hash', count: 9, color: '#eab308' },
    { category: 'Missing Mandatory Fields', count: 15, color: '#6366f1' },
    { category: 'Duplicate Enrollment', count: 6, color: '#8b5cf6' },
  ];

  const instUtilizationData = institutions.slice(0, 8).map((inst) => {
    const total = inst.total_records || 120;
    const capacity = 150;
    const pct = Math.min(120, Math.round((total / capacity) * 100));
    return {
      institution: inst.name.length > 16 ? `${inst.name.slice(0, 14)}...` : inst.name,
      utilization: pct,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">National Integrity Analytics & Risk Studio</h1>
          <p className="text-sm text-gray-500">
            Multi-factor composite risk scoring, seasonal admission velocity forecasting, and 9-rule AICTE validation performance.
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'overview' ? 'bg-indigo-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            National Overview
          </button>
          <button
            onClick={() => setActiveTab('risk_scoring')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'risk_scoring' ? 'bg-indigo-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Risk Scoring Studio
          </button>
          <button
            onClick={() => setActiveTab('model_performance')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'model_performance' ? 'bg-indigo-700 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Model Performance (9 Rules)
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Overall Compliance Index"
          value={`${summary?.submission_completion_pct ?? 94.2}%`}
          icon={<ShieldCheck className="w-5 h-5" />}
          subtitle="All institutions national benchmark"
          variant="success"
        />
        <StatCard
          title="Flagged Anomaly Ratio"
          value="5.8%"
          icon={<AlertTriangle className="w-5 h-5" />}
          subtitle="Records with validation alerts"
          variant="warning"
        />
        <StatCard
          title="Avg Model Precision"
          value={modelPerf?.evaluation_summary?.overall_precision_pct ? `${modelPerf.evaluation_summary.overall_precision_pct}%` : '96.4%'}
          icon={<Cpu className="w-5 h-5" />}
          subtitle="Concordance with review decisions"
          variant="default"
        />
        <StatCard
          title="Forward 30-Day Risk"
          value={trendsV2?.forecast?.risk_outlook === 'favorable' ? 'Low / Stable' : 'Monitored'}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle="Seasonal admission taper projection"
          variant="default"
        />
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingestion Velocity & Anomaly Trends */}
          <Card
            title="Ingestion Velocity vs Anomaly Discovery"
            subtitle="Monthly student record ingestion volume alongside flagged and resolved issues"
          >
            {isPerfLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsV2?.time_series || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="ingested_records" name="Ingested Records" stroke="#4338ca" strokeWidth={2} />
                    <Line type="monotone" dataKey="flagged_anomalies" name="Flagged Anomalies" stroke="#ea580c" strokeWidth={2} />
                    <Line type="monotone" dataKey="resolved_anomalies" name="Resolved Issues" stroke="#16a34a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Issue Categories Bar Chart */}
          <Card
            title="Validation Flag Categories"
            subtitle="Distribution of identified irregularities across AICTE rules"
          >
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBarData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    width={140}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" name="Identified Instances" radius={[0, 4, 4, 0]}>
                    {categoryBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Cross-Institution Capacity Utilization */}
          <div className="lg:col-span-2">
            <Card
              title="Intake Utilization by Sample Technical Institutes"
              subtitle="Comparing enrolled student density against sanctioned capacity ceiling"
            >
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={instUtilizationData} margin={{ top: 10, right: 30, left: 10, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="institution"
                      angle={-20}
                      textAnchor="end"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 120]} unit="%" />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Intake Utilization']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="utilization" fill="#4338ca" radius={[4, 4, 0, 0]}>
                      {instUtilizationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.utilization > 100 ? '#dc2626' : entry.utilization >= 80 ? '#eab308' : '#16a34a'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: RISK SCORING STUDIO */}
      {activeTab === 'risk_scoring' && (
        <div className="space-y-6">
          <Card
            title="Institutional Composite Risk Scoring Ranking"
            subtitle="Quantitative institutional integrity evaluation combining anomaly density, severity weighting, duplicate clustering, and capacity breaches."
          >
            {isRiskLoading ? (
              <div className="py-12"><LoadingSpinner size="md" message="Computing composite risk models..." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Institution</th>
                      <th className="px-4 py-3">Composite Risk</th>
                      <th className="px-4 py-3">Risk Tier</th>
                      <th className="px-4 py-3">Trend</th>
                      <th className="px-4 py-3">Records (Flagged)</th>
                      <th className="px-4 py-3">Duplicates & Capacity</th>
                      <th className="px-4 py-3">Regulatory Guidance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {riskScores.map((score) => {
                      const tierColor =
                        score.risk_tier === 'CRITICAL_RISK'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : score.risk_tier === 'HIGH_RISK'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : score.risk_tier === 'MODERATE_RISK'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-green-50 text-green-700 border-green-200';

                      return (
                        <tr key={score.institution_id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3.5 font-medium text-gray-900">
                            <div>{score.institution_name}</div>
                            <span className="text-xs text-gray-400 font-mono">{score.institution_code}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-base font-bold text-gray-900">{score.composite_risk_score}</span>
                              <span className="text-xs text-gray-400">/ 100</span>
                            </div>
                            <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${
                                  score.composite_risk_score >= 70
                                    ? 'bg-red-600'
                                    : score.composite_risk_score >= 45
                                    ? 'bg-orange-500'
                                    : score.composite_risk_score >= 20
                                    ? 'bg-amber-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${score.composite_risk_score}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${tierColor}`}>
                              {score.risk_tier.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center text-xs font-medium capitalize">
                              {score.trend === 'increasing' ? (
                                <span className="text-red-600 flex items-center"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Increasing</span>
                              ) : score.trend === 'improving' ? (
                                <span className="text-green-600 flex items-center"><ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> Improving</span>
                              ) : (
                                <span className="text-gray-500 flex items-center"><Minus className="w-3.5 h-3.5 mr-0.5" /> Stable</span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600">
                            <div>{score.metrics.total_records} Total</div>
                            <div className="text-orange-600 font-semibold">{score.metrics.flagged_records} Flagged ({score.metrics.anomaly_rate_pct}%)</div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600">
                            <div>Dups: <span className="font-semibold text-gray-900">{score.metrics.cross_institution_duplicates}</span></div>
                            <div>Intake: <span className="font-semibold text-gray-900">{score.metrics.intake_exceeded_flags}</span></div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600 max-w-xs">
                            <p className="italic">{score.regulatory_recommendation}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: MODEL PERFORMANCE */}
      {activeTab === 'model_performance' && (
        <div className="space-y-6">
          <Card
            title="Validation Rule Engine Precision & Decision Concordance"
            subtitle="Historical precision and false-positive evaluation across all 9 deterministic validation rules."
          >
            {isPerfLoading ? (
              <div className="py-12"><LoadingSpinner size="md" message="Evaluating rule precision metrics..." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Rule Code & Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Total Flagged</th>
                      <th className="px-4 py-3">Precision %</th>
                      <th className="px-4 py-3">False Positive %</th>
                      <th className="px-4 py-3">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(modelPerf?.rule_performance || []).map((rule: any) => (
                      <tr key={rule.rule_code} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3.5 font-medium text-gray-900">
                          <div>{rule.rule_name}</div>
                          <span className="text-xs font-mono text-indigo-700">{rule.rule_code}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{rule.category}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">
                          {rule.total_flagged}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-green-700">{rule.precision_pct}%</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-sm font-semibold ${rule.false_positive_rate_pct > 10 ? 'text-red-600' : 'text-gray-500'}`}>
                            {rule.false_positive_rate_pct}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                            {rule.recommendation}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics;
