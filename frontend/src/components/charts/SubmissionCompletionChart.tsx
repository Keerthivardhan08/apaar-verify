import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

export interface CompletionDataPoint {
  institution_name: string;
  completion_pct: number;
  total_records?: number;
}

export interface SubmissionCompletionChartProps {
  data: CompletionDataPoint[];
  height?: number;
}

export const SubmissionCompletionChart: React.FC<SubmissionCompletionChartProps> = ({
  data,
  height = 300,
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-sm"
      >
        No submission completion data available
      </div>
    );
  }

  // Format institution name
  const formattedData = data.slice(0, 10).map((d) => ({
    ...d,
    shortName:
      d.institution_name.length > 20
        ? `${d.institution_name.slice(0, 18)}...`
        : d.institution_name,
  }));

  const getColor = (pct: number) => {
    if (pct >= 90) return '#16a34a'; // Green
    if (pct >= 60) return '#eab308'; // Amber
    return '#dc2626'; // Red
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={130}
            tick={{ fontSize: 11, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Completion Rate']}
            labelFormatter={(label) => `Institution: ${label}`}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Bar dataKey="completion_pct" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {formattedData.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={getColor(entry.completion_pct)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubmissionCompletionChart;
