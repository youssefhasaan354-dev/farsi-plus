import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, BookCheck, Activity, Crown, AlertTriangle, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface DashboardData {
  total_users: number;
  new_this_week: number;
  lessons_completed: number;
  active_today: number;
  active_7d: number;
  premium_count: number;
  hardest_exercises: Array<{
    exercise_id: string;
    lesson_title: string;
    exercise_type: string;
    wrong_count: number;
  }>;
}

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: result, error: err } = await supabase.rpc('get_admin_dashboard');
    if (err) {
      setError(err.message);
    } else {
      setData(result as DashboardData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-error-50 dark:bg-error-900/20 p-6 text-center">
        <AlertTriangle className="mx-auto mb-2 text-error-500" size={32} />
        <p className="text-error-700 dark:text-error-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <BarChart3 size={40} className="text-neutral-300" />
        <p className="text-muted text-sm">{t('admin.dashboard.noData')}</p>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: t('admin.stats.totalUsers'), value: data.total_users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { icon: UserPlus, label: t('admin.stats.newThisWeek'), value: data.new_this_week, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { icon: BookCheck, label: t('admin.stats.lessonsCompleted'), value: data.lessons_completed, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { icon: Activity, label: t('admin.stats.activeToday'), value: data.active_today, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
    { icon: Activity, label: t('admin.stats.active7d'), value: data.active_7d, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20' },
    { icon: Crown, label: t('admin.stats.premiumCount'), value: data.premium_count, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('admin.dashboard.title')}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5"
            >
              <div className={`inline-flex p-2.5 rounded-lg ${stat.color} mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          {t('admin.dashboard.hardestExercises')}
        </h2>
        {data.hardest_exercises.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('admin.dashboard.noData')}</p>
        ) : (
          <div className="space-y-2">
            {data.hardest_exercises.map((ex, i) => (
              <div
                key={ex.exercise_id}
                className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-error-100 dark:bg-error-900/30 text-error-600 text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{ex.lesson_title}</p>
                    <p className="text-xs text-neutral-500">{ex.exercise_type}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-error-600">
                  {ex.wrong_count} {t('admin.dashboard.wrongAnswers')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
