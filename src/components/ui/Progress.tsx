interface ProgressProps {
  value: number;
  max?: number;
  color?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const colors = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-success-500',
  error: 'bg-error-500',
};

const heights = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function Progress({ value, max = 100, color = 'primary', size = 'md', showLabel, className = '' }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={['w-full', className].join(' ')}>
      <div className={['w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700', heights[size]].join(' ')}>
        <div
          className={[colors[color], 'h-full rounded-full transition-all duration-500 ease-out'].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-sm text-muted">
          {Math.round(pct)}%
        </p>
      )}
    </div>
  );
}

export default Progress;
