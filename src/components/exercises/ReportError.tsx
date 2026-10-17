import { useState } from 'react';
import { Flag, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useIsRTL } from '@/lib/useIsRTL';
import { supabase } from '@/lib/supabase';

interface ReportErrorProps {
  exerciseId: string;
}

export function ReportError({ exerciseId }: ReportErrorProps) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<'error' | 'suggestion' | 'audio_issue' | 'other'>('error');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from('reports').insert({
      exercise_id: exerciseId,
      report_type: reportType,
      description: description || null,
    });
    setSubmitting(false);
    if (error) {
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setDescription('');
      setReportType('error');
    }, 2000);
  };

  const types: { value: 'error' | 'suggestion' | 'audio_issue' | 'other'; labelAr: string; labelEn: string }[] = [
    { value: 'error', labelAr: 'خطأ في المحتوى', labelEn: 'Content error' },
    { value: 'suggestion', labelAr: 'اقتراح', labelEn: 'Suggestion' },
    { value: 'audio_issue', labelAr: 'مشكلة في الصوت', labelEn: 'Audio issue' },
    { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-error-500 transition-colors"
        aria-label={t('lesson.reportError')}
      >
        <Flag size={14} />
        <span>{t('lesson.reportError')}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="surface surface-border w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto p-6"
                role="dialog"
                aria-modal="true"
              >
                {submitted ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="rounded-full bg-success-100 dark:bg-success-900/30 p-3">
                      <Check size={28} className="text-success-600" />
                    </div>
                    <p className="font-semibold text-center">{t('lesson.reportSubmitted')}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold">{t('lesson.reportError')}</h2>
                      <button
                        onClick={() => setOpen(false)}
                        className="text-muted hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-sm"
                      >
                        {t('common.close')}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('lesson.reportType')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {types.map((tp) => (
                            <button
                              key={tp.value}
                              onClick={() => setReportType(tp.value)}
                              className={[
                                'rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors',
                                reportType === tp.value
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
                              ].join(' ')}
                            >
                              {isRTL ? tp.labelAr : tp.labelEn}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">{t('lesson.reportDescription')}</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm focus:border-primary-500 focus:outline-none resize-none"
                          placeholder={t('lesson.reportPlaceholder')}
                        />
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-error-500 px-4 py-2.5 font-semibold text-white hover:bg-error-600 active:bg-error-700 disabled:opacity-50 transition-colors"
                      >
                        {submitting ? (
                          <span className="animate-pulse">{t('common.loading')}</span>
                        ) : (
                          <>
                            <Send size={16} />
                            {t('lesson.reportSubmit')}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default ReportError;
