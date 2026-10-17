import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface FeedbackItem {
  id: string;
  name: string | null;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

export function AdminFeedbackPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    setItems((data || []) as FeedbackItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('feedback').update({ status }).eq('id', id);
    fetchFeedback();
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    read: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400',
    replied: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    archived: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('admin.feedback.title')}</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500 py-10 text-center">{t('admin.feedback.empty')}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {item.subject || t('admin.feedback.noSubject')}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {item.name || t('admin.feedback.anonymous')} — {item.email}
                  </p>
                </div>
                <select
                  value={item.status}
                  onChange={(e) => updateStatus(item.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-full border-0 ${statusColors[item.status] || ''}`}
                >
                  <option value="new">{t('admin.feedback.status.new')}</option>
                  <option value="read">{t('admin.feedback.status.read')}</option>
                  <option value="replied">{t('admin.feedback.status.replied')}</option>
                  <option value="archived">{t('admin.feedback.status.archived')}</option>
                </select>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {item.message}
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminFeedbackPage;
