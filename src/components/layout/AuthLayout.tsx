import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Mascot } from '@/components/Mascot';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { APP_CONFIG } from '@/config/app';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  mascotMood?: 'happy' | 'encouraging' | 'thinking' | 'celebrating' | 'sad';
}

export function AuthLayout({ children, title, subtitle, mascotMood = 'encouraging' }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-app flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-lg shadow-sm">
            <span className="font-persian">ف</span>
          </div>
          <span className="font-persian text-lg font-bold text-primary-600 dark:text-primary-400">
            {APP_CONFIG.nameFa}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="surface surface-border rounded-2xl shadow-lg p-6 sm:p-8">
            {/* Mascot */}
            <div className="flex justify-center mb-6">
              <Mascot mood={mascotMood} size={100} />
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">{title}</h1>
            <p className="text-muted text-center mb-6 text-sm">{subtitle}</p>

            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
