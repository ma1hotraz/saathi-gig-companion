import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { EarningInput } from '@shared/domain';
import { useI18n } from '@/i18n';
import { EntryFields } from './EntryFields';
import { parseDraft, type Draft, type DraftField } from './draft';

interface Props {
  transcript: string | null;
  drafts: Draft[];
  onChange: (drafts: Draft[]) => void;
  onDiscard: () => void;
  onSave: (rows: EarningInput[]) => Promise<string | null>;
}

/** Editable confirmation cards for entries read from voice, text or a screenshot. Nothing is saved until the user confirms. */
export function ReviewEntries({ transcript, drafts, onChange, onDiscard, onSave }: Props) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (drafts.length === 0) {
    return (
      <div role="status" className="mt-5 rounded-xl border-2 border-asphalt bg-signal-soft p-4">
        <p className="font-bold">{t('earnings.none.title')}</p>
        <p className="mt-1">{t('earnings.none.body')}</p>
        {transcript && <p className="hint mt-2">{t('earnings.heard', { text: transcript })}</p>}
      </div>
    );
  }

  const update = (key: string, field: DraftField, value: string) =>
    onChange(drafts.map((d) => (d.key === key ? { ...d, [field]: value } : d)));

  async function save() {
    const rows: EarningInput[] = [];
    for (const d of drafts) {
      const parsed = parseDraft(d);
      if (!parsed.ok) {
        setError(parsed.field ? t('earnings.invalidField', { field: t(`earnings.f.${parsed.field}`) }) : t('earnings.invalid'));
        return;
      }
      rows.push(parsed.value);
    }
    setBusy(true);
    setError(null);
    const failure = await onSave(rows);
    setBusy(false);
    if (failure) setError(failure);
  }

  return (
    <section className="sign mt-5" aria-labelledby="review-h">
      <h2 id="review-h" className="text-2xl">{t('earnings.review.title')}</h2>
      <p className="mt-1 text-muted">{t('earnings.review.body')}</p>
      {transcript && <p className="hint mt-2">{t('earnings.heard', { text: transcript })}</p>}
      <ul className="mt-4 space-y-5">
        {drafts.map((d, i) => (
          <li key={d.key} className="border-t-2 border-asphalt pt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xl">{t('earnings.review.entry', { n: i + 1 })}</h3>
              <button type="button" className="btn btn-quiet" onClick={() => onChange(drafts.filter((x) => x.key !== d.key))}>
                <Trash2 aria-hidden="true" size={18} /> {t('earnings.review.remove')}
              </button>
            </div>
            {d.notes && (
              <p className="mb-3 rounded-lg bg-signal-soft p-3 font-bold">
                {t('earnings.review.noteLead')} {d.notes}
              </p>
            )}
            <EntryFields draft={d} onChange={(f, v) => update(d.key, f, v)} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={busy}>
          {busy ? t('common.loading') : t('earnings.review.save', { count: drafts.length })}
        </button>
        <button type="button" className="btn" onClick={onDiscard} disabled={busy}>
          {t('common.cancel')}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 font-bold text-alert">{error}</p>}
    </section>
  );
}
