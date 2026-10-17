import type { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddings = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
};

export function Card({ children, hover, padding = 'md', className = '', ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={[
        'surface surface-border rounded-xl shadow-sm',
        hover ? 'hover:shadow-lg cursor-pointer' : '',
        paddings[padding],
        className,
      ].join(' ')}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}

export default Card;
