import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';

const PLACEMENTS = [
  { key: 'home_banner', labelAr: 'بانر الصفحة الرئيسية', labelEn: 'Home Banner' },
  { key: 'lesson_complete', labelAr: 'إكمال الدرس', labelEn: 'Lesson Complete' },
  { key: 'result_screen', labelAr: 'شاشة النتيجة', labelEn: 'Result Screen' },
  { key: 'sidebar_desktop', labelAr: 'الشريط الجانبي', labelEn: 'Sidebar Desktop' },
];

export function AdminAdsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('ad_placements').select('*');
    const map: Record<string, boolean> = {};
    for (const p of PLACEMENTS) {
      const row = (data || []).find((r: { placement: string; enabled: boolean }) => r.placement === p.key);
      map[p.key] = row?.enabled ?? true;
    }
    setSettings(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const toggle = async (placement: string) => {
    setSaving(placement);
    const newValue = !settings[placement];
    setSettings({ ...settings, [placement]: newValue });

    const { data: existing } = await supabase
      .from('ad_placements')
      .select('id')
      .eq('placement', placement)
      .maybeSingle();

    if (existing) {
      await supabase.from('ad_placements').update({ enabled: newValue }).eq('placement', placement);
    } else {
      await supabase.from('ad_placements').insert({ placement, enabled: newValue });
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone size={24} className="text-primary-600" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('admin.ads.title')}</h1>
      </div>

      <p className="text-sm text-neutral-500">{t('admin.ads.subtitle')}</p>

      <div className="space-y-3">
        {PLACEMENTS.map((p) => (
          <div
            key={p.key}
            className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
          >
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">{p.labelEn}</p>
              <p className="text-xs text-neutral-500">{p.labelAr}</p>
            </div>
            <button
              onClick={() => toggle(p.key)}
              disabled={saving === p.key}
              className={[
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                settings[p.key] ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-700',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                  settings[p.key] ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1',
                ].join(' ')}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminAdsPage;
