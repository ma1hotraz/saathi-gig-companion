import { useState } from 'react';
import { useI18n } from '@/i18n';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import type { SavedGrievance } from './useSavedGrievances';

interface Props {
  items: SavedGrievance[] | null;
  failed: boolean;
  onRetry: () => void;
  onOpen: (g: SavedGrievance) => void;
  onDelete: (id: string) => Promise<boolean>;
}

/** "My saved complaints" with open and in-page delete confirmation. */
export function SavedList({ items, failed, onRetry, onOpen, onDelete }: Props) {
  const { t, bcp47 } = useI18n();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const doDelete = async (id: string) => {
    const ok = await onDelete(id);
    setConfirmId(null);
    setStatus(ok ? t('complaint.deleted') : t('common.error'));
  };

  return (
    <section className="no-print mt-10" aria-labelledby="complaint-saved-title">
      <h2 id="complaint-saved-title">{t('complaint.savedTitle')}</h2>
      <p role="status" className="sr-only">{status}</p>
      <div className="mt-3">
        {failed && <ErrorState message={t('common.error')} onRetry={onRetry} />}
        {!failed && items === null && <Skeleton lines={3} />}
        {!failed && items?.length === 0 && <EmptyState title={t('complaint.savedEmptyTitle')} body={t('complaint.savedEmptyBody')} />}
        {!failed && items && items.length > 0 && (
          <ul className="space-y-3">
            {items.map((g) => (
              <li key={g.id} className="rounded-xl border-2 border-asphalt bg-paper p-3">
                <p className="font-bold">{t('complaint.against', { name: g.counterparty })}</p>
                <p className="text-muted">
                  {t(`complaint.issue.${g.issue_type}`)} · <time dateTime={g.created_at}>{new Date(g.created_at).toLocaleDateString(bcp47)}</time>
                </p>
                {confirmId === g.id ? (
                  <div className="mt-3" role="group" aria-label={t('complaint.deleteAsk')}>
                    <p className="font-bold">{t('complaint.deleteAsk')}</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <button type="button" className="btn btn-danger" onClick={() => void doDelete(g.id)}>{t('complaint.deleteYes')}</button>
                      <button type="button" className="btn" onClick={() => setConfirmId(null)}>{t('complaint.deleteNo')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" className="btn" aria-label={t('complaint.openLabel', { name: g.counterparty })} onClick={() => onOpen(g)}>{t('complaint.open')}</button>
                    <button type="button" className="btn" aria-label={t('complaint.deleteLabel', { name: g.counterparty })} onClick={() => setConfirmId(g.id)}>{t('complaint.delete')}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
