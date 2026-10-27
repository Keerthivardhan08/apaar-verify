import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white hover:from-indigo-500 hover:to-indigo-700 focus:ring-indigo-500 shadow-md shadow-indigo-600/20 border border-indigo-400/30',
    secondary:
      'liquid-glass text-slate-800 hover:bg-white/90 border border-slate-200/80 hover:border-slate-300 shadow-xs focus:ring-indigo-500',
    glass:
      'backdrop-blur-md bg-white/30 text-white hover:bg-white/40 border border-white/40 shadow-xs focus:ring-white',
    outline:
      'bg-transparent text-indigo-700 border border-indigo-500/50 hover:bg-indigo-50/70 focus:ring-indigo-500',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-500 hover:to-rose-600 focus:ring-rose-500 shadow-md shadow-rose-600/20 border border-rose-400/30',
    ghost:
      'bg-transparent text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 border-transparent shadow-none',
    success:
      'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600 focus:ring-emerald-500 shadow-md shadow-emerald-600/20 border border-emerald-400/30',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
