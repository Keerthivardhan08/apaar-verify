import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  variant = 'default',
  className = '',
  onClick,
}) => {
  const variantStyles = {
    default: {
      card: 'border-gray-200 hover:border-gray-300',
      iconBg: 'bg-indigo-50 text-indigo-700',
      value: 'text-gray-900',
    },
    success: {
      card: 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300',
      iconBg: 'bg-emerald-100 text-emerald-700',
      value: 'text-emerald-950',
    },
    warning: {
      card: 'border-amber-200 bg-amber-50/20 hover:border-amber-300',
      iconBg: 'bg-amber-100 text-amber-700',
      value: 'text-amber-950',
    },
    danger: {
      card: 'border-rose-200 bg-rose-50/20 hover:border-rose-300',
      iconBg: 'bg-rose-100 text-rose-700',
      value: 'text-rose-950',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } ${style.card} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${style.value}`}>{value}</span>
          </div>
        </div>
        {icon && <div className={`p-2.5 rounded-lg shrink-0 ${style.iconBg}`}>{icon}</div>}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-medium ${
                trend.isPositive === true
                  ? 'text-emerald-600'
                  : trend.isPositive === false
                  ? 'text-rose-600'
                  : 'text-gray-500'
              }`}
            >
              {trend.isPositive === true ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : trend.isPositive === false ? (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <Minus className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trend.value} {trend.label && <span className="text-gray-400 ml-1">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
