import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  variant?: 'glass' | 'solid' | 'subtle';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
  variant = 'glass',
  ...props
}) => {
  const variantClasses = {
    glass: 'liquid-glass liquid-card-glow rounded-2xl border border-white/60 shadow-sm overflow-hidden',
    solid: 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden',
    subtle: 'liquid-glass-subtle rounded-2xl border border-white/40 shadow-xs overflow-hidden',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-200/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white/40 backdrop-blur-md">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-6'}>{children}</div>

      {footer && (
        <div className="px-6 py-3 bg-white/30 backdrop-blur-md border-t border-slate-200/50 text-sm text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
