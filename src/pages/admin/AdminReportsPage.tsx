import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Report {
  id: string;
  report_type: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  exercise_id: string | null;
}

export function AdminReportsPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setReports(data as Report[]);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdate = async (id: string) => {
    const { error } = await supabase.rpc('update_report_status', {
      p_report_id: id,
      p_status: editStatus,
      p_admin_notes: editNotes,
    });
    if (!error) {
      setEditingId(null);
      fetchReports();
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    reviewed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('admin.reports.title')}</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-sm text-neutral-500 py-10 text-center">{t('admin.reports.empty')}</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[report.status] || ''}`}>
                    {t(`admin.reports.status.${report.status}`)}
                  </span>
                  <span className="text-xs text-neutral-500 ml-2">{report.report_type}</span>
                </div>
                <span className="text-xs text-neutral-400">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                {report.description || t('admin.reports.noDescription')}
              </p>
              {report.exercise_id && (
                <a
                  href={`/lesson/${report.exercise_id}`}
                  className="text-xs text-primary-600 hover:underline"
                >
                  {t('admin.reports.viewExercise')}
                </a>
              )}
              {report.admin_notes && (
                <p className="text-xs text-neutral-500 mt-2 italic">
                  {t('admin.reports.notes')}: {report.admin_notes}
                </p>
              )}

              {editingId === report.id ? (
                <div className="mt-3 space-y-2">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm"
                  >
                    <option value="pending">{t('admin.reports.status.pending')}</option>
                    <option value="reviewed">{t('admin.reports.status.reviewed')}</option>
                    <option value="resolved">{t('admin.reports.status.resolved')}</option>
                    <option value="rejected">{t('admin.reports.status.rejected')}</option>
                  </select>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder={t('admin.reports.notesPlaceholder')}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(report.id)}
                      className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(report.id);
                    setEditStatus(report.status);
                    setEditNotes(report.admin_notes || '');
                  }}
                  className="text-xs text-primary-600 hover:underline mt-2"
                >
                  {t('admin.reports.edit')}
                </button>
              )}
            </div>
          ))}

          {/* Pagination controls */}
          <div className="flex items-center justify-between px-4 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 text-xs text-muted">
            <span>
              Page {page + 1} of {Math.ceil(totalCount / PAGE_SIZE) || 1} ({totalCount} reports)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(totalCount / PAGE_SIZE) - 1, p + 1))}
                disabled={page >= Math.ceil(totalCount / PAGE_SIZE) - 1}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReportsPage;
