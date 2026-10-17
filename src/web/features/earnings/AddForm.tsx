import { useState, type SubmitEvent } from 'react';
import type { EarningInput } from '@shared/domain';
import { useI18n } from '@/i18n';
import { EntryFields } from './EntryFields';
import { emptyDraft, parseDraft, type Draft, type DraftField } from './draft';

interface Props {
  /** Optional values from the chat assistant (?platform=&amount=). */
  initial: { platform: string; amount: string };
  onSave: (rows: EarningInput[]) => Promise<string | null>;
}

/** Manual entry form, validated with the shared schema before insert. */
export function AddForm({ initial, onSave }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft({ platform: initial.platform, amount_in: initial.amount }));
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function change(field: DraftField, value: string) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    const parsed = parseDraft(draft);
    if (!parsed.ok) {
      setMessage({ kind: 'error', text: parsed.field ? t('earnings.invalidField', { field: t(`earnings.f.${parsed.field}`) }) : t('earnings.invalid') });
      return;
    }
    setBusy(true);
    setMessage(null);
    const failure = await onSave([parsed.value]);
    setBusy(false);
    if (failure) {
      setMessage({ kind: 'error', text: failure });
      return;
    }
    setDraft(emptyDraft());
    setMessage({ kind: 'ok', text: t('earnings.saved', { count: 1 }) });
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <EntryFields draft={draft} onChange={change} />
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? t('common.loading') : t('earnings.saveOne')}
      </button>
      <p role={message?.kind === 'error' ? 'alert' : 'status'} className={`mt-3 font-bold ${message?.kind === 'error' ? 'text-alert' : 'text-money'}`}>
        {message?.text}
      </p>
    </form>
  );
}
