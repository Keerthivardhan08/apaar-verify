import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export interface IssueDistributionProps {
  distribution?: {
    info?: number;
    warning?: number;
    high?: number;
    critical?: number;
    [key: string]: number | undefined;
  };
  height?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#3b82f6',     // Blue
  warning: '#eab308',  // Yellow
  high: '#f97316',     // Orange
  critical: '#dc2626', // Red
};

export const IssueDistributionChart: React.FC<IssueDistributionProps> = ({
  distribution = {},
  height = 280,
}) => {
  const chartData = [
    { name: 'Critical', value: distribution.critical || 0, color: SEVERITY_COLORS.critical },
    { name: 'High', value: distribution.high || 0, color: SEVERITY_COLORS.high },
    { name: 'Warning', value: distribution.warning || 0, color: SEVERITY_COLORS.warning },
    { name: 'Info', value: distribution.info || 0, color: SEVERITY_COLORS.info },
  ].filter((item) => item.value > 0);

  const totalIssues = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (totalIssues === 0) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-sm"
      >
        <span className="text-emerald-600 font-medium mb-1">✓ No validation issues</span>
        <span className="text-xs text-gray-500">All data rules satisfied</span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any) => [
              `${value} (${((Number(value) / totalIssues) * 100).toFixed(1)}%)`,
              `${name} Severity`,
            ]}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IssueDistributionChart;
