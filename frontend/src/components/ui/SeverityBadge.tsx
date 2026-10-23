import React from 'react';

export interface SeverityBadgeProps {
  severity: 'info' | 'warning' | 'high' | 'critical' | string;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const norm = (severity || 'info').toLowerCase();

  const config: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      label: 'Info',
    },
    warning: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500',
      label: 'Warning',
    },
    high: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
      label: 'High',
    },
    critical: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      label: 'Critical',
    },
  };

  const style = config[norm] || config.info;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${style.dot} animate-pulse`} />
      {style.label}
    </span>
  );
};

export default SeverityBadge;
