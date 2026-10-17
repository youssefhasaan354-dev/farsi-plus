import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { normalizePersianScript } from '@/lib/textNormalize';

interface ParsedRow {
  persian_script: string;
  latin_transliteration: string;
  arabic_meaning: string;
  english_meaning: string;
  source: string;
  errors: string[];
}

export function AdminImportPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setResult(null);

    let rawRows: Record<string, unknown>[] = [];

    if (file.name.endsWith('.json')) {
      const text = await file.text();
      try {
        rawRows = JSON.parse(text);
      } catch {
        return;
      }
    } else if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map((h) => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: Record<string, unknown> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
        rawRows.push(row);
      }
    } else {
      return;
    }

    const parsed: ParsedRow[] = rawRows.map((r) => {
      const errors: string[] = [];
      const persian_script = normalizePersianScript(String(r['persian_script'] || '').trim());
      const latin_transliteration = String(r['latin_transliteration'] || '').trim();
      const arabic_meaning = String(r['arabic_meaning'] || '').trim();
      const english_meaning = String(r['english_meaning'] || '').trim();
      const source = String(r['source'] || '').trim();

      if (!persian_script) errors.push(t('admin.import.missingPersian'));
      if (!latin_transliteration) errors.push(t('admin.import.missingTranslit'));
      if (!arabic_meaning) errors.push(t('admin.import.missingArabic'));
      if (!english_meaning) errors.push(t('admin.import.missingEnglish'));
      if (!source) errors.push(t('admin.import.missingSource'));

      return { persian_script, latin_transliteration, arabic_meaning, english_meaning, source, errors };
    });

    setRows(parsed);
  }, [t]);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let errors = 0;

    const batch = validRows.map((r) => ({
      persian_script: normalizePersianScript(r.persian_script),
      latin_transliteration: r.latin_transliteration,
      arabic_meaning: r.arabic_meaning,
      english_meaning: r.english_meaning,
      source: r.source,
    }));

    const { data, error } = await supabase.from('vocabulary').insert(batch).select('id');
    if (error) {
      errors = batch.length;
    } else {
      success = data?.length || 0;
    }

    setResult({ success, errors });
    setImporting(false);
    if (success > 0) {
      setRows([]);
      setFileName('');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('admin.import.title')}</h1>

      <div className="rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
        <Upload size={32} className="mx-auto text-neutral-400 mb-3" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          {t('admin.import.instructions')}
        </p>
        <label className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 cursor-pointer">
          <FileText size={16} />
          {t('admin.import.chooseFile')}
          <input
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        {fileName && (
          <p className="text-xs text-neutral-500 mt-2">{fileName} — {rows.length} {t('admin.import.rows')}</p>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-success-600 flex items-center gap-1">
              <CheckCircle2 size={16} /> {validRows.length} {t('admin.import.valid')}
            </span>
            {invalidRows.length > 0 && (
              <span className="text-error-600 flex items-center gap-1">
                <AlertTriangle size={16} /> {invalidRows.length} {t('admin.import.invalid')}
              </span>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium text-neutral-600 dark:text-neutral-400">Persian</th>
                    <th className="text-left p-2 font-medium text-neutral-600 dark:text-neutral-400">Translit</th>
                    <th className="text-left p-2 font-medium text-neutral-600 dark:text-neutral-400">Arabic</th>
                    <th className="text-left p-2 font-medium text-neutral-600 dark:text-neutral-400">English</th>
                    <th className="text-left p-2 font-medium text-neutral-600 dark:text-neutral-400">Source</th>
                    <th className="text-left p-2 font-medium text-neutral-600 dark:text-neutral-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="p-2 text-neutral-700 dark:text-neutral-300">{r.persian_script || '—'}</td>
                      <td className="p-2 text-neutral-700 dark:text-neutral-300">{r.latin_transliteration || '—'}</td>
                      <td className="p-2 text-neutral-700 dark:text-neutral-300">{r.arabic_meaning || '—'}</td>
                      <td className="p-2 text-neutral-700 dark:text-neutral-300">{r.english_meaning || '—'}</td>
                      <td className="p-2 text-neutral-700 dark:text-neutral-300">{r.source || '—'}</td>
                      <td className="p-2">
                        {r.errors.length === 0 ? (
                          <CheckCircle2 size={16} className="text-success-500" />
                        ) : (
                          <span className="text-error-600 text-xs">{r.errors.join(', ')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {validRows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-lg bg-success-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-success-600 disabled:opacity-50"
            >
              {importing ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Upload size={16} />
              )}
              {t('admin.import.importButton')} ({validRows.length})
            </button>
          )}

          {result && (
            <div className="rounded-lg p-4 bg-success-50 dark:bg-success-900/20 text-sm text-success-700 dark:text-success-400">
              {t('admin.import.imported')}: {result.success} — {t('admin.import.errors')}: {result.errors}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminImportPage;
