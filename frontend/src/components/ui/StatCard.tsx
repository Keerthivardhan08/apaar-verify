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
      card: 'liquid-glass border-white/70 hover:border-indigo-300 hover:shadow-indigo-500/10',
      iconBg: 'bg-indigo-50/80 text-indigo-700 border border-indigo-200/50 shadow-inner',
      value: 'text-slate-900',
      glow: 'from-indigo-500/5 to-purple-500/5',
    },
    success: {
      card: 'liquid-glass border-emerald-200/60 hover:border-emerald-300 hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/50 shadow-inner',
      value: 'text-emerald-950',
      glow: 'from-emerald-500/10 to-teal-500/5',
    },
    warning: {
      card: 'liquid-glass border-amber-200/60 hover:border-amber-300 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-50/80 text-amber-700 border border-amber-200/50 shadow-inner',
      value: 'text-amber-950',
      glow: 'from-amber-500/10 to-orange-500/5',
    },
    danger: {
      card: 'liquid-glass border-rose-200/60 hover:border-rose-300 hover:shadow-rose-500/10',
      iconBg: 'bg-rose-50/80 text-rose-700 border border-rose-200/50 shadow-inner',
      value: 'text-rose-950',
      glow: 'from-rose-500/10 to-red-500/5',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-300 liquid-card-glow ${
        onClick ? 'cursor-pointer' : ''
      } ${style.card} ${className}`}
    >
      {/* Background Liquid Subtle Tint */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.glow} pointer-events-none opacity-80`} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${style.value}`}>{value}</span>
          </div>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-xl shrink-0 backdrop-blur-md ${style.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="relative z-10 mt-3 pt-3 border-t border-slate-200/40 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span className="truncate pr-2">{subtitle}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-semibold shrink-0 ${
                trend.isPositive === true
                  ? 'text-emerald-600'
                  : trend.isPositive === false
                  ? 'text-rose-600'
                  : 'text-slate-500'
              }`}
            >
              {trend.isPositive === true ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : trend.isPositive === false ? (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <Minus className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trend.value} {trend.label && <span className="text-slate-400 ml-1 font-normal">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
