interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={[
        'animate-spin rounded-full border-primary-500/20 border-t-primary-500',
        sizes[size],
        className,
      ].join(' ')}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default Spinner;
