import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Flame,
  Heart,
  Gem,
  Star,
  Edit2,
  Award,
  Calendar,
  Trophy,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Globe,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useAuthStore, type UserProfile } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { formatDate, dateKey, formatNumber } from '@/lib/utils';

const COMMON_TIMEZONES = [
  'Africa/Cairo',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Tehran',
  'Asia/Baghdad',
  'Asia/Amman',
  'Africa/Casablanca',
  'Africa/Algiers',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, fetchProfile, signOut } = useAuthStore();
  const { language } = useUIStore();
  const isRTL = language === 'ar';

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('Africa/Cairo');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [activityData, setActivityData] = useState<Record<string, number>>({});

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    if (profile?.timezone) setTimezone(profile.timezone);
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data } = await supabase
        .from('user_xp_log')
        .select('created_at, xp_amount')
        .eq('user_id', user.id)
        .gte('created_at', ninetyDaysAgo.toISOString());

      if (data) {
        const map: Record<string, number> = {};
        for (const row of data) {
          const key = dateKey(new Date(row.created_at));
          map[key] = (map[key] ?? 0) + (row.xp_amount ?? 0);
        }
        setActivityData(map);
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaveError(null);
    setSaveSuccess(false);

    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setSaveError(isRTL ? 'الاسم يجب أن يحتوي على حرفين على الأقل' : 'Display name must be at least 2 characters');
      return;
    }
    if (trimmed.length > 50) {
      setSaveError(isRTL ? 'الاسم يجب ألا يتجاوز 50 حرفاً' : 'Display name cannot exceed 50 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: trimmed,
          timezone,
        })
        .eq('id', user.id);

      if (error) {
        setSaveError(error.message);
        return;
      }

      await fetchProfile();
      setSaveSuccess(true);
      setTimeout(() => {
        setEditing(false);
        setSaveSuccess(false);
      }, 1000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      // Gather user data for GDPR export
      const [progressRes, xpRes, streakRes] = await Promise.all([
        supabase.from('user_progress').select('*').eq('user_id', user.id),
        supabase.from('user_xp_log').select('*').eq('user_id', user.id),
        supabase.from('streaks').select('*').eq('user_id', user.id),
      ]);

      const exportPayload = {
        exported_at: new Date().toISOString(),
        profile,
        user_progress: progressRes.data ?? [],
        user_xp_log: xpRes.data ?? [],
        streaks: streakRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farsi_plus_data_${user.id}_${dateKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Call delete Edge Function or record deletion request
      await supabase.from('feedback').insert({
        user_id: user.id,
        category: 'other',
        message: 'REQUEST_ACCOUNT_DELETION: User confirmed account deletion.',
      });

      // Sign out user
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Delete request failed:', err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  const p: UserProfile = profile;
  const stats = [
    { icon: Star, label: t('profile.stats.xp'), value: formatNumber(p.total_xp ?? 0, language), color: 'text-secondary-500' },
    { icon: Flame, label: t('profile.stats.streak'), value: `${formatNumber(p.streak_count ?? 0, language)} ${t('profile.stats.days')}`, color: 'text-error-500' },
    { icon: Heart, label: t('profile.stats.hearts'), value: formatNumber(p.hearts ?? 0, language), color: 'text-rose-400' },
    { icon: Gem, label: t('profile.stats.gems'), value: formatNumber(p.gems ?? 0, language), color: 'text-primary-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 pattern-girih dark:pattern-girih-dark opacity-50" />
          <div className="relative flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-500 text-white text-3xl font-bold shadow-lg">
              {(p.display_name ?? p.email ?? '?')[0].toUpperCase()}
            </div>

            <div className="flex-1 text-center sm:text-start">
              <h1 className="text-xl font-bold">{p.display_name || t('profile.displayName')}</h1>
              <p className="text-sm text-muted" dir="ltr">{p.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <Badge color="primary">{p.cefr_level || 'A0'}</Badge>
                {p.is_premium && <Badge color="secondary" icon={<Star size={12} />}>Plus</Badge>}
                <span className="text-xs text-muted">
                  {t('profile.memberSince')} {formatDate(p.created_at, language)}
                </span>
                {p.timezone && (
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Globe size={12} />
                    {p.timezone}
                  </span>
                )}
              </div>
            </div>

            <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} onClick={() => setEditing(true)}>
              {t('profile.edit')}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card padding="sm" className="text-center">
                <Icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Activity heatmap */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-primary-500" />
            <h2 className="font-bold">{t('profile.heatmap.title')}</h2>
          </div>
          <ActivityHeatmap data={activityData} />
        </Card>
      </motion.div>

      {/* Achievements card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-secondary-500" />
              <h2 className="font-bold">{t('profile.achievements.title')}</h2>
            </div>
            <button
              onClick={() => navigate('/achievements')}
              className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              {isRTL ? 'عرض الكل' : 'View all'}
            </button>
          </div>
          <button
            onClick={() => navigate('/achievements')}
            className="flex w-full items-center gap-3 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 p-4 hover:shadow-md transition-all text-start"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-500 text-white">
              <Trophy size={24} />
            </div>
            <div>
              <p className="font-bold">{t('achievements.subtitle')}</p>
              <p className="text-xs text-muted">{t('achievements.unlockedCount')}</p>
            </div>
          </button>
        </Card>
      </motion.div>

      {/* Privacy & Account Management Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-surface">
        <div>
          <h3 className="text-sm font-bold">{isRTL ? 'بيانات الحساب والخصوصية' : 'Account & Privacy'}</h3>
          <p className="text-xs text-muted mt-0.5">
            {isRTL
              ? 'يمكنك تنزيل نسخة من بياناتك أو طلب حذف حسابك نهائياً.'
              : 'Export a copy of your study data or request account deletion.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={14} />}
            onClick={() => setShowExportModal(true)}
          >
            {isRTL ? 'تصدير البيانات' : 'Export Data'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-error-600 hover:bg-error-50 dark:hover:bg-error-950/30"
            icon={<Trash2 size={14} />}
            onClick={() => setShowDeleteModal(true)}
          >
            {isRTL ? 'حذف الحساب' : 'Delete Account'}
          </Button>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title={t('profile.edit')}>
        <div className="space-y-4">
          <Input
            label={t('profile.displayName')}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('auth.field.namePlaceholder')}
          />

          <div>
            <label className="block text-sm font-medium mb-1">
              {isRTL ? 'المنطقة الزمنية' : 'Timezone'}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-surface px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">
              {isRTL
                ? 'تُستخدم لتحديد بداية اليوم الجديد للمهام والستريك.'
                : 'Used to reset daily quests and streaks accurately.'}
            </p>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 text-xs text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 p-2.5 rounded-lg">
              <AlertCircle size={16} />
              <p>{saveError}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 text-xs text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 p-2.5 rounded-lg">
              <CheckCircle size={16} />
              <p>{isRTL ? 'تم حفظ التعديلات بنجاح' : 'Profile updated successfully'}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>
              {t('profile.cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {t('profile.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Export Data Modal */}
      <Modal open={showExportModal} onClose={() => setShowExportModal(false)} title={isRTL ? 'تصدير البيانات' : 'Export Data'}>
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {isRTL
              ? 'سيتم تنزيل ملف بصيغة JSON يحتوي على سجل تقدّمك الدراسي الكامل ونقاط الخبرة والستريك.'
              : 'A JSON file containing your complete learning progress, XP log, and streak history will be downloaded.'}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowExportModal(false)}>
              {t('profile.cancel')}
            </Button>
            <Button onClick={handleExportData} loading={exporting} icon={<Download size={16} />}>
              {isRTL ? 'تنزيل الآن' : 'Download Now'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={isRTL ? 'حذف الحساب' : 'Delete Account'}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">
              {isRTL
                ? 'تحذير: سيؤدي هذا الإجراء إلى حذف حسابك وجميع بيانات تقدّمك الدراسي والشهادات والنقاط بشكل نهائي.'
                : 'Warning: This action will permanently erase your account, lesson progress, streak, and certificates.'}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              {t('profile.cancel')}
            </Button>
            <Button
              className="bg-error-600 hover:bg-error-700 text-white"
              onClick={handleDeleteAccount}
              loading={deleting}
            >
              {isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Activity heatmap — last ~12 weeks */
function ActivityHeatmap({ data }: { data: Record<string, number> }) {
  const { t } = useTranslation();
  const weeks = 12;
  const today = new Date();

  const grid: { date: Date; xp: number }[][] = [];
  const startDay = today.getDay();

  for (let w = weeks - 1; w >= 0; w--) {
    const week: { date: Date; xp: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const offset = w * 7 + d - startDay;
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = dateKey(date);
      week.push({ date, xp: data[key] ?? 0 });
    }
    grid.push(week);
  }

  const getColor = (xp: number) => {
    if (xp === 0) return 'bg-neutral-200 dark:bg-neutral-700';
    if (xp < 20) return 'bg-primary-200 dark:bg-primary-800';
    if (xp < 50) return 'bg-primary-300 dark:bg-primary-600';
    if (xp < 100) return 'bg-primary-400 dark:bg-primary-500';
    return 'bg-primary-500';
  };

  if (Object.keys(data).length === 0) {
    return <p className="text-sm text-muted text-center py-6">{t('profile.noActivity')}</p>;
  }

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-1 min-w-fit">
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`h-3 w-3 rounded-sm ${getColor(day.xp)} transition-colors`}
                title={`${dateKey(day.date)}: ${day.xp} XP`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span>{t('common.skip')}</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-3 rounded-sm bg-primary-200 dark:bg-primary-800" />
          <div className="h-3 w-3 rounded-sm bg-primary-300 dark:bg-primary-600" />
          <div className="h-3 w-3 rounded-sm bg-primary-400 dark:bg-primary-500" />
          <div className="h-3 w-3 rounded-sm bg-primary-500" />
        </div>
        <span>100+ XP</span>
      </div>
    </div>
  );
}

export default ProfilePage;
