import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal } from 'lucide-react';
import { toPersianDigits } from '@/lib/utils';

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  rank: number;
  league: string;
  display_name: string | null;
  avatar_url: string | null;
  is_me: boolean;
}

export function LeaderboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<{ league: string; entries: LeaderboardEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    const { data: result } = await supabase.rpc('get_weekly_leaderboard');
    if (result) {
      setData(result as { league: string; entries: LeaderboardEntry[] });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Trophy size={40} className="text-neutral-300" />
        <p className="text-muted text-sm">{t('league.empty')}</p>
      </div>
    );
  }

  const leagueColors: Record<string, string> = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-neutral-400 to-neutral-600',
    gold: 'from-yellow-400 to-yellow-600',
    sapphire: 'from-blue-500 to-blue-700',
    ruby: 'from-red-500 to-red-700',
    diamond: 'from-cyan-400 to-cyan-600',
  };

  const leagueGradient = leagueColors[data.league] || 'from-neutral-400 to-neutral-600';

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl bg-gradient-to-br ${leagueGradient} p-6 text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <Trophy size={28} />
          <h1 className="text-2xl font-bold">{t('league.title')}</h1>
        </div>
        <p className="text-white/80">
          {t('league.yourLeague')}: <span className="font-semibold capitalize">{data.league}</span>
        </p>
      </div>

      <div className="space-y-2">
        {data.entries.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-10">
            {t('league.empty')}
          </p>
        ) : (
          data.entries.map((entry) => (
            <div
              key={entry.user_id}
              className={[
                'flex items-center gap-3 rounded-xl border p-4 transition-colors',
                entry.is_me
                  ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900',
              ].join(' ')}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-700 dark:text-neutral-300">
                {entry.rank <= 3 ? (
                  <Medal size={20} className={entry.rank === 1 ? 'text-yellow-500' : entry.rank === 2 ? 'text-neutral-400' : 'text-amber-600'} />
                ) : (
                  toPersianDigits(entry.rank)
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${entry.is_me ? 'text-primary-700 dark:text-primary-400' : 'text-neutral-900 dark:text-white'}`}>
                  {entry.display_name || t('league.anonymous')}
                  {entry.is_me && <span className="text-xs ml-2">({t('league.you')})</span>}
                </p>
              </div>
              <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                {toPersianDigits(entry.total_xp)} XP
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LeaderboardPage;
