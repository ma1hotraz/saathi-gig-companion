import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import type { GrievanceRequest } from '@shared/api';
import { api, ApiRequestError } from '@/lib/api';
import { useI18n } from '@/i18n';
import { useProfile } from '@/lib/profile';
import { ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { GrievanceForm } from './GrievanceForm';
import { LetterResult, type Draft } from './LetterResult';
import { ResultPreview } from './ResultPreview';
import { SavedList } from './SavedList';
import { documentFromState, initialValues } from './prefill';
import { useSavedGrievances, type SavedGrievance } from './useSavedGrievances';

/** Complaint writer: guided form, AI-drafted letter, saved complaints. */
export default function Complaint() {
  const { t } = useI18n();
  const { profile } = useProfile();
  const location = useLocation();
  const [params] = useSearchParams();
  const doc = useMemo(() => documentFromState(location.state), [location.state]);
  // Computed once: later profile or URL changes must not overwrite what the worker is typing.
  const [initial] = useState(() => initialValues(profile.state, doc, params));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const lastBody = useRef<GrievanceRequest | null>(null);
  const saved = useSavedGrievances();

  useEffect(() => () => abort.current?.abort(), []);

  const generate = async (body: GrievanceRequest) => {
    lastBody.current = body;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError(null);
    setDraft(null);
    try {
      const result = await api.draftGrievance(body, controller.signal);
      setDraft({ ...result, issue_type: body.issue_type, counterparty: body.counterparty });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiRequestError ? err.message : t('common.error'));
    } finally {
      if (abort.current === controller) setBusy(false);
    }
  };

  const openSaved = (g: SavedGrievance) =>
    setDraft({ letter: g.letter, summary: g.summary ?? '', where_to_file: [], evidence_checklist: [], issue_type: g.issue_type, counterparty: g.counterparty, savedId: g.id });

  return (
    <div>
      <div className="no-print">
        <PageHeader title={t('complaint.title')} intro={t('complaint.intro')} />
      </div>
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="no-print lg:col-span-6">
          <GrievanceForm initial={initial} fromDocument={doc !== null} busy={busy} onSubmit={(b) => void generate(b)} />
        </div>
        <div className="mt-8 lg:col-span-6 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
          {error && <div className="no-print mb-5"><ErrorState message={error} onRetry={lastBody.current ? () => void generate(lastBody.current as GrievanceRequest) : undefined} /></div>}
          {busy && (
            <section className="no-print panel p-5 lg:p-8">
              <p className="font-bold" role="status">{t('complaint.drafting')}</p>
              <p className="hint mb-4">{t('complaint.draftingHint')}</p>
              <Skeleton lines={7} />
            </section>
          )}
          {!busy && !draft && <div className="no-print"><ResultPreview /></div>}
          {!busy && draft && <LetterResult key={`${draft.savedId ?? 'new'}-${draft.letter.length}-${draft.counterparty}`} draft={draft} onSaved={() => void saved.reload()} />}
        </div>
      </div>
      <SavedList items={saved.items} failed={saved.failed} onRetry={() => void saved.reload()} onOpen={openSaved} onDelete={saved.remove} />
    </div>
  );
}
