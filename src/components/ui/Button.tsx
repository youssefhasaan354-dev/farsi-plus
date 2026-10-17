import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow-md',
  secondary: 'bg-secondary-500 text-neutral-900 hover:bg-secondary-600 active:bg-secondary-700 shadow-sm hover:shadow-md',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
  danger: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 shadow-sm',
  success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-sm',
  outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-md min-h-[44px]',
  md: 'px-4 py-2.5 text-base gap-2 rounded-lg min-h-[44px]',
  lg: 'px-6 py-3 text-lg gap-2.5 rounded-xl min-h-[48px]',
  xl: 'px-8 py-4 text-xl gap-3 rounded-xl min-h-[52px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconEnd, fullWidth, disabled, children, className = '', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        className={[
          'inline-flex items-center justify-center font-semibold transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
          variants[variant],
          sizes[size],
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        disabled={disabled || loading}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          icon
        )}
        {children}
        {iconEnd}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
