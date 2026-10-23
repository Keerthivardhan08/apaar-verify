import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export interface EnrolmentDataPoint {
  program_name: string;
  enrolled: number;
  capacity: number;
  utilization_pct?: number;
}

export interface EnrolmentChartProps {
  data: EnrolmentDataPoint[];
  height?: number;
}

export const EnrolmentChart: React.FC<EnrolmentChartProps> = ({ data, height = 320 }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-sm"
      >
        No enrolment data available
      </div>
    );
  }

  // Format program names to avoid overflowing
  const formattedData = data.slice(0, 10).map((d) => ({
    ...d,
    shortName: d.program_name.length > 18 ? `${d.program_name.slice(0, 16)}...` : d.program_name,
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 10, bottom: 45 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="shortName"
            angle={-30}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 11, fill: '#64748b' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: any, name: any) => [
              value,
              name === 'enrolled' ? 'Enrolled Students' : 'Approved Capacity',
            ]}
            labelFormatter={(label) => `Program: ${label}`}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
          />
          <Bar
            dataKey="enrolled"
            name="Enrolled Count"
            fill="#4338ca"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="capacity"
            name="Approved Capacity"
            fill="#94a3b8"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnrolmentChart;
