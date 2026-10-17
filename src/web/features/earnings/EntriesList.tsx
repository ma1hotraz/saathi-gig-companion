import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Earning } from '@shared/domain';
import { Chip, EmptyState } from '@/components/ui';
import { useI18n } from '@/i18n';
import { formatRupees } from './dates';

interface Props {
  entries: Earning[];
  onDelete: (id: string) => Promise<string | null>;
}

/** Newest entries with in-page delete confirmation. */
export function EntriesList({ entries, onDelete }: Props) {
  const { t, bcp47 } = useI18n();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete(id: string) {
    setBusy(true);
    setError(null);
    const failure = await onDelete(id);
    setBusy(false);
    setError(failure);
    if (!failure) setConfirming(null);
  }

  const sourceLabel = { manual: t('earnings.src.manual'), voice: t('earnings.src.voice'), screenshot: t('earnings.src.screenshot') };

  return (
    <section aria-labelledby="list-h">
      <h2 id="list-h" className="mb-3 text-2xl">{t('earnings.list.title')}</h2>
      {entries.length === 0 ? (
        <EmptyState title={t('earnings.empty.title')} body={t('earnings.empty.body')} />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {entries.map((e) => (
            <li key={e.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="hint">
                    {new Date(`${e.entry_date}T00:00:00`).toLocaleDateString(bcp47, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    <span className="break-words">{e.platform}</span>
                    <Chip>{sourceLabel[e.source]}</Chip>
                  </p>
                  {e.notes && <p className="mt-1 break-words text-muted">{e.notes}</p>}
                </div>
                <p className="money shrink-0 text-right text-2xl">{formatRupees(e.amount_in - e.expenses, true)}</p>
              </div>
              {confirming === e.id ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="w-full font-bold">{t('earnings.list.sure')}</p>
                  <button type="button" className="btn btn-danger" disabled={busy} onClick={() => void confirmDelete(e.id)}>
                    {busy ? t('common.loading') : t('earnings.list.yes')}
                  </button>
                  <button type="button" className="btn" disabled={busy} onClick={() => setConfirming(null)}>
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-quiet btn-sm mt-1"
                  aria-label={t('earnings.list.deleteFor', { platform: e.platform, date: e.entry_date })}
                  onClick={() => {
                    setError(null);
                    setConfirming(e.id);
                  }}
                >
                  <Trash2 aria-hidden="true" size={18} /> {t('common.delete')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p role="alert" className="mt-2 font-bold text-alert">{error}</p>
    </section>
  );
}
