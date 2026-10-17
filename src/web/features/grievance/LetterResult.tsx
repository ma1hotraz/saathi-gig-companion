import { useEffect, useRef, useState } from 'react';
import { Copy, MessageCircle, Printer, Save } from 'lucide-react';
import type { GrievanceResult } from '@shared/api';
import type { IssueType } from '@shared/domain';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { AiNotice, Chip } from '@/components/ui';
import { ReadAloud } from '@/components/ReadAloud';
import { EvidenceList, WhereToFile } from './LetterExtras';

export interface Draft extends GrievanceResult {
  issue_type: IssueType;
  counterparty: string;
  /** Set when the letter was opened from a saved complaint (already stored). */
  savedId?: string;
}

interface Props {
  draft: Draft;
  /** Called after a successful insert so the saved list can refresh. */
  onSaved: () => void;
}

/** The generated letter with edit, copy, print, WhatsApp and save actions. */
export function LetterResult({ draft, onSaved }: Props) {
  const { t, language } = useI18n();
  const [letter, setLetter] = useState(draft.letter);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(draft.savedId));
  const area = useRef<HTMLTextAreaElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => heading.current?.focus(), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setMessage({ text: t('complaint.copied'), ok: true });
      return;
    } catch {
      /* fall through to the legacy path (older browsers, insecure context) */
    }
    area.current?.select();
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- only fallback when the Clipboard API is unavailable
    const ok = document.execCommand('copy');
    setMessage({ text: ok ? t('complaint.copied') : t('complaint.copyFailed'), ok });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from('grievances').insert({
      issue_type: draft.issue_type,
      counterparty: draft.counterparty,
      language,
      letter,
      summary: draft.summary,
    });
    setSaving(false);
    if (error) {
      setMessage({ text: t('complaint.saveFailed'), ok: false });
      return;
    }
    setSaved(true);
    setMessage({ text: t('complaint.saved'), ok: true });
    onSaved();
  };

  return (
    <>
      <article className="no-print space-y-5" aria-labelledby="complaint-result-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="complaint-result-title" ref={heading} tabIndex={-1} className="outline-none">{t('complaint.resultTitle')}</h2>
          {saved && <Chip tone="green">{t('complaint.savedChip')}</Chip>}
        </div>
        {draft.summary && (
          <section className="sign p-5" aria-labelledby="complaint-summary-title">
            <h3 id="complaint-summary-title">{t('complaint.summary')}</h3>
            <p lang={language} className="mt-1 max-w-prose">{draft.summary}</p>
            <div className="mt-3"><ReadAloud text={draft.summary} /></div>
          </section>
        )}

        <section className="panel bg-paper p-4 lg:p-6" aria-label={t('complaint.letterLabel')}>
          <label htmlFor="complaint-letter" className="label">{t('complaint.letterLabel')}</label>
          <textarea id="complaint-letter" ref={area} lang={language} aria-describedby="complaint-letter-hint" className="field min-h-96 resize-y p-5 text-[17px] leading-8 lg:p-8" rows={16} value={letter} onChange={(e) => setLetter(e.target.value)} />
          <p id="complaint-letter-hint" className="hint mt-2">{t('complaint.letterHint')}</p>

          <div role="group" aria-label={t('complaint.actions')} className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4">
            <button type="button" className="btn btn-primary" onClick={() => void copy()}><Copy aria-hidden="true" size={20} />{t('complaint.copy')}</button>
            <button type="button" className="btn" onClick={() => window.print()}><Printer aria-hidden="true" size={20} />{t('common.print')}</button>
            <a className="btn no-underline" href={`https://wa.me/?text=${encodeURIComponent(letter)}`} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" size={20} />{t('complaint.whatsapp')}</a>
            {!saved && (
              <button type="button" className="btn" disabled={saving} onClick={() => void save()}><Save aria-hidden="true" size={20} />{saving ? t('complaint.saving') : t('complaint.save')}</button>
            )}
          </div>
          <p role="status" className={`mt-3 min-h-6 font-bold ${message && !message.ok ? 'text-alert' : 'text-money'}`}>{message?.text}</p>
        </section>

        <WhereToFile items={draft.where_to_file} />
        <EvidenceList items={draft.evidence_checklist} />
        <AiNotice />
      </article>

      {/* Only this block is visible when printing: everything else carries `no-print`. */}
      <div className="hidden print:block" aria-hidden="true">
        <pre lang={language} className="whitespace-pre-wrap font-sans text-base text-black">{letter}</pre>
      </div>
    </>
  );
}
