import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Check, Filter } from 'lucide-react';

interface ReviewItem {
  id: string;
  title_ar: string;
  title_en: string;
  source: string | null;
  updated_at: string;
}

export function AdminReviewPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTable, setFilterTable] = useState<string>('all');

  const tables = useMemo(() => ['stages', 'units', 'lessons', 'exercises', 'vocabulary'], []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const allItems: ReviewItem[] = [];
    for (const table of tables) {
      const { data } = await supabase
        .from(table)
        .select('id, title_ar, title_en, source, updated_at')
        .eq('needs_review', true)
        .order('updated_at', { ascending: false });
      if (data) {
        for (const item of data as ReviewItem[]) {
          allItems.push({ ...item });
        }
      }
    }
    setItems(allItems);
    setLoading(false);
  }, [tables]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleApprove = async (table: string, id: string) => {
    const { error } = await supabase.rpc('approve_content', { p_table: table, p_id: id });
    if (!error) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('admin.review.title')}</h1>

      <div className="flex items-center gap-3">
        <Filter size={18} className="text-neutral-400" />
        <select
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white"
        >
          <option value="all">{t('admin.review.allTypes')}</option>
          {tables.map((tb) => (
            <option key={tb} value={tb}>{tb}</option>
          ))}
        </select>
        <span className="text-sm text-neutral-500">{items.length} {t('admin.review.items')}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500 py-10 text-center">{t('admin.review.empty')}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
            >
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">{item.title_ar || item.title_en}</p>
                <p className="text-xs text-neutral-500">
                  {item.source || t('admin.review.noSource')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(filterTable === 'all' ? 'lessons' : filterTable, item.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-success-600"
                >
                  <Check size={14} />
                  {t('admin.review.approve')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminReviewPage;
