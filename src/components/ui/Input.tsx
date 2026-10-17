import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  iconEnd?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconEnd, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || props.name || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-lg border bg-surface px-4 py-3 text-base text-text transition-colors duration-200',
              'border-neutral-300 dark:border-neutral-700',
              'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              'placeholder:text-neutral-400',
              error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : '',
              icon ? 'ps-11' : '',
              iconEnd ? 'pe-11' : '',
              className,
            ].join(' ')}
            {...props}
          />
          {iconEnd && (
            <span className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted">
              {iconEnd}
            </span>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
