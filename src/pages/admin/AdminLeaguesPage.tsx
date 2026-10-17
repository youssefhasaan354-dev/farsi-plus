import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Trophy, RefreshCw } from 'lucide-react';

export function AdminLeaguesPage() {
  const { t } = useTranslation();
  const [computing, setComputing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Array<{ week_start_date: string; total: number }>>([]);

  const fetchSnapshots = useCallback(async () => {
    const { data } = await supabase
      .from('leaderboard_weekly')
      .select('week_start_date')
      .order('week_start_date', { ascending: false });
    const weeks: Record<string, number> = {};
    for (const row of data || []) {
      const w = (row as { week_start_date: string }).week_start_date;
      weeks[w] = (weeks[w] || 0) + 1;
    }
    setSnapshots(Object.entries(weeks).map(([week_start_date, total]) => ({ week_start_date, total })));
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const handleCompute = async () => {
    setComputing(true);
    setMessage(null);
    const { error } = await supabase.rpc('compute_weekly_leagues');
    if (error) {
      setMessage(error.message);
    } else {
      setMessage(t('admin.leagues.computed'));
      fetchSnapshots();
    }
    setComputing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('admin.leagues.title')}</h1>
      </div>

      <button
        onClick={handleCompute}
        disabled={computing}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
      >
        <RefreshCw size={16} className={computing ? 'animate-spin' : ''} />
        {t('admin.leagues.computeNow')}
      </button>

      {message && (
        <p className="text-sm rounded-lg p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400">
          {message}
        </p>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{t('admin.leagues.history')}</h2>
        {snapshots.length === 0 ? (
          <p className="text-sm text-neutral-500">{t('admin.leagues.noHistory')}</p>
        ) : (
          <div className="space-y-2">
            {snapshots.map((s) => (
              <div
                key={s.week_start_date}
                className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
              >
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {new Date(s.week_start_date).toLocaleDateString()}
                </span>
                <span className="text-sm text-neutral-500">{s.total} {t('admin.leagues.users')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLeaguesPage;
