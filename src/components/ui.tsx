import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white p-4 shadow-md',
        className
      )}
      {...props}
    />
  );
}

type Variant = 'primary' | 'success' | 'danger' | 'ghost' | 'outline' | 'warn';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700',
  success: 'bg-success text-white hover:bg-emerald-600 active:bg-emerald-700',
  danger: 'bg-danger text-white hover:bg-red-500 active:bg-red-700',
  ghost: 'bg-transparent text-slate-300 hover:bg-white/10',
  outline: 'border border-dark-700 text-slate-200 hover:bg-white/5',
  warn: 'bg-warn text-slate-900 hover:bg-amber-400'
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  full?: boolean;
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-3 text-sm rounded-xl',
  xl: 'px-6 py-4 text-base rounded-2xl'
};

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-dark-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-300',
        className
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn('text-sm font-semibold uppercase tracking-wider text-slate-400', className)}>
      {children}
    </h2>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent = 'text-slate-100'
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl bg-dark-700/60 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={cn('mt-0.5 text-lg font-bold tabular-nums', accent)}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  barClassName
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-dark-700', className)}>
      <div
        className={cn('h-full rounded-full bg-brand-500 transition-all', barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="text-slate-600">{icon}</div>
      <div className="text-sm font-medium text-slate-300">{title}</div>
      {description && <div className="max-w-[260px] text-xs text-slate-500">{description}</div>}
    </div>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function inputClass(
  className?: string
) {
  return cn(
    'w-full rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-500',
    className
  );
}
