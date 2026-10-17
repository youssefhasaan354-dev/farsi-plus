import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

type EntityType = 'stages' | 'units' | 'lessons' | 'exercises' | 'vocabulary';

interface ContentItem {
  id: string;
  title_ar: string;
  title_en: string;
  sort_order: number;
  needs_review: boolean;
  [key: string]: unknown;
}

export function AdminContentPage() {
  const { t } = useTranslation();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [stages, setStages] = useState<ContentItem[]>([]);
  const [units, setUnits] = useState<Record<string, ContentItem[]>>({});
  const [lessons, setLessons] = useState<Record<string, ContentItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ type: EntityType; id: string | null; parentId?: string } | null>(null);

  const fetchStages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('stages').select('*').order('sort_order');
    setStages((data || []) as ContentItem[]);
    setLoading(false);
  }, []);

  const fetchUnits = useCallback(async (stageId: string) => {
    const { data } = await supabase.from('units').select('*').eq('stage_id', stageId).order('sort_order');
    setUnits((prev) => ({ ...prev, [stageId]: (data || []) as ContentItem[] }));
  }, []);

  const fetchLessons = useCallback(async (unitId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('unit_id', unitId).order('sort_order');
    setLessons((prev) => ({ ...prev, [unitId]: (data || []) as ContentItem[] }));
  }, []);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const toggleStage = (stageId: string) => {
    if (expandedStage === stageId) {
      setExpandedStage(null);
    } else {
      setExpandedStage(stageId);
      if (!units[stageId]) fetchUnits(stageId);
    }
  };

  const toggleUnit = (unitId: string) => {
    if (expandedUnit === unitId) {
      setExpandedUnit(null);
    } else {
      setExpandedUnit(unitId);
      if (!lessons[unitId]) fetchLessons(unitId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('admin.content.title')}</h1>
        <button
          onClick={() => setEditing({ type: 'stages', id: null })}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          <Plus size={16} />
          {t('admin.content.addStage')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {stages.map((stage) => (
            <div key={stage.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="flex items-center gap-2 p-4">
                <button onClick={() => toggleStage(stage.id)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                  {expandedStage === stage.id ? <ChevronDown size={18} /> : <ChevronRight size={18} className="rtl:rotate-180" />}
                </button>
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900 dark:text-white">{stage.title_ar}</p>
                  <p className="text-xs text-neutral-500">{stage.title_en}</p>
                </div>
                {stage.needs_review && (
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-2 py-0.5 rounded-full">
                    {t('admin.content.needsReview')}
                  </span>
                )}
                <button
                  onClick={() => setEditing({ type: 'stages', id: stage.id })}
                  className="p-2 text-neutral-400 hover:text-primary-600"
                >
                  <Pencil size={16} />
                </button>
              </div>

              {expandedStage === stage.id && (
                <div className="border-t border-neutral-100 dark:border-neutral-800 pl-8 rtl:pr-8 rtl:pl-0">
                  {(units[stage.id] || []).map((unit) => (
                    <div key={unit.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <div className="flex items-center gap-2 p-3">
                        <button onClick={() => toggleUnit(unit.id)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                          {expandedUnit === unit.id ? <ChevronDown size={16} /> : <ChevronRight size={16} className="rtl:rotate-180" />}
                        </button>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{unit.title_ar}</p>
                          <p className="text-xs text-neutral-500">{unit.title_en}</p>
                        </div>
                        {unit.needs_review && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-2 py-0.5 rounded-full">
                            {t('admin.content.needsReview')}
                          </span>
                        )}
                        <button
                          onClick={() => setEditing({ type: 'units', id: unit.id, parentId: stage.id })}
                          className="p-2 text-neutral-400 hover:text-primary-600"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>

                      {expandedUnit === unit.id && (
                        <div className="pl-8 rtl:pr-8 rtl:pl-0 pb-2">
                          {(lessons[unit.id] || []).map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-2 py-2">
                              <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">{lesson.title_ar}</span>
                              {lesson.needs_review && (
                                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-2 py-0.5 rounded-full">
                                  {t('admin.content.needsReview')}
                                </span>
                              )}
                              <button
                                onClick={() => setEditing({ type: 'lessons', id: lesson.id, parentId: unit.id })}
                                className="p-1.5 text-neutral-400 hover:text-primary-600"
                              >
                                <Pencil size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => setEditing({ type: 'lessons', id: null, parentId: unit.id })}
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1"
                          >
                            <Plus size={14} />
                            {t('admin.content.addLesson')}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setEditing({ type: 'units', id: null, parentId: stage.id })}
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 p-3"
                  >
                    <Plus size={14} />
                    {t('admin.content.addUnit')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          type={editing.type}
          id={editing.id}
          parentId={editing.parentId}
          onClose={() => {
            setEditing(null);
            fetchStages();
            if (expandedStage) fetchUnits(expandedStage);
            if (expandedUnit) fetchLessons(expandedUnit);
          }}
        />
      )}
    </div>
  );
}

interface EditModalProps {
  type: EntityType;
  id: string | null;
  parentId?: string;
  onClose: () => void;
}

function EditModal({ type, id, parentId, onClose }: EditModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      supabase.from(type).select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setForm(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? '')])));
      });
    }
  }, [type, id]);

  const fieldDefs: Record<string, Array<{ key: string; label: string; required?: boolean; type?: 'textarea' | 'number' }>> = {
    stages: [
      { key: 'title_ar', label: t('admin.content.titleAr'), required: true },
      { key: 'title_en', label: t('admin.content.titleEn'), required: true },
      { key: 'title_fa', label: t('admin.content.titleFa'), required: true },
      { key: 'cefr_level', label: 'CEFR', required: true },
      { key: 'description_ar', label: t('admin.content.descAr'), type: 'textarea' },
      { key: 'description_en', label: t('admin.content.descEn'), type: 'textarea' },
      { key: 'sort_order', label: t('admin.content.sortOrder'), type: 'number' },
      { key: 'source', label: t('admin.content.source') },
    ],
    units: [
      { key: 'title_ar', label: t('admin.content.titleAr'), required: true },
      { key: 'title_en', label: t('admin.content.titleEn'), required: true },
      { key: 'title_fa', label: t('admin.content.titleFa'), required: true },
      { key: 'description_ar', label: t('admin.content.descAr'), type: 'textarea' },
      { key: 'description_en', label: t('admin.content.descEn'), type: 'textarea' },
      { key: 'sort_order', label: t('admin.content.sortOrder'), type: 'number' },
      { key: 'source', label: t('admin.content.source') },
    ],
    lessons: [
      { key: 'title_ar', label: t('admin.content.titleAr'), required: true },
      { key: 'title_en', label: t('admin.content.titleEn'), required: true },
      { key: 'title_fa', label: t('admin.content.titleFa'), required: true },
      { key: 'description_ar', label: t('admin.content.descAr'), type: 'textarea' },
      { key: 'description_en', label: t('admin.content.descEn'), type: 'textarea' },
      { key: 'xp_reward', label: 'XP', type: 'number' },
      { key: 'sort_order', label: t('admin.content.sortOrder'), type: 'number' },
      { key: 'source', label: t('admin.content.source') },
    ],
    exercises: [
      { key: 'type', label: t('admin.content.exerciseType'), required: true },
      { key: 'question_ar', label: t('admin.content.questionAr'), type: 'textarea' },
      { key: 'question_en', label: t('admin.content.questionEn'), type: 'textarea' },
      { key: 'sort_order', label: t('admin.content.sortOrder'), type: 'number' },
      { key: 'source', label: t('admin.content.source') },
    ],
    vocabulary: [
      { key: 'persian_script', label: t('admin.content.persianScript'), required: true },
      { key: 'latin_transliteration', label: t('admin.content.latinTranslit'), required: true },
      { key: 'arabic_meaning', label: t('admin.content.arabicMeaning'), required: true },
      { key: 'english_meaning', label: t('admin.content.englishMeaning'), required: true },
      { key: 'source', label: t('admin.content.source'), required: true },
    ],
  };

  const currentFields = fieldDefs[type] || [];

  const handleSave = async () => {
    setSaving(true);
    setErr(null);

    for (const f of currentFields as Array<{ key: string; label: string; required?: boolean; type?: string }>) {
      if (f.required && !form[f.key]?.trim()) {
        setErr(t('admin.content.fieldRequired') + ': ' + f.label);
        setSaving(false);
        return;
      }
    }

    const payload: Record<string, unknown> = { ...form };
    if (type === 'units' && parentId) payload['stage_id'] = parentId;
    if (type === 'lessons' && parentId) payload['unit_id'] = parentId;
    if (payload['sort_order']) payload['sort_order'] = parseInt(payload['sort_order'] as string) || 0;
    if (payload['xp_reward']) payload['xp_reward'] = parseInt(payload['xp_reward'] as string) || 10;

    const { error } = id
      ? await supabase.from(type).update(payload).eq('id', id)
      : await supabase.from(type).insert(payload);

    if (error) {
      setErr(error.message);
    } else {
      onClose();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm(t('admin.content.confirmDelete'))) return;
    setSaving(true);
    const { error } = await supabase.from(type).delete().eq('id', id);
    if (error) {
      setErr(error.message);
    } else {
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {id ? t('admin.content.edit') : t('admin.content.add')} {type}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {currentFields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {f.label}
                {f.required && <span className="text-error-500"> *</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={form[f.key] || ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )}
            </div>
          ))}

          {err && (
            <p className="text-sm text-error-600 bg-error-50 dark:bg-error-900/20 rounded-lg p-3">{err}</p>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-neutral-200 dark:border-neutral-800">
          {id ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-2 text-sm text-error-600 hover:text-error-700"
            >
              <Trash2 size={16} />
              {t('admin.content.delete')}
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
            >
              <Check size={16} />
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminContentPage;
