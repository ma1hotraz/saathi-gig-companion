import { useEffect, useRef, useState } from 'react';
import { Copy, MessageCircle, Printer, Save } from 'lucide-react';
import type { GrievanceResult } from '@shared/api';
import type { IssueType } from '@shared/domain';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { AiNotice } from '@/components/ui';
import { ReadAloud } from '@/components/ReadAloud';

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
  const [ticked, setTicked] = useState<Set<number>>(new Set());
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

  const toggle = (i: number) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return (
    <>
      <article className="no-print mt-8" aria-labelledby="complaint-result-title">
        <h2 id="complaint-result-title" ref={heading} tabIndex={-1} className="outline-none">{t('complaint.resultTitle')}</h2>
        {draft.summary && (
          <section className="sign mt-3 p-4">
            <h3>{t('complaint.summary')}</h3>
            <p lang={language} className="mt-1 max-w-prose">{draft.summary}</p>
            <div className="mt-3"><ReadAloud text={draft.summary} /></div>
          </section>
        )}

        <div className="mt-5">
          <label htmlFor="complaint-letter" className="label">{t('complaint.letterLabel')}</label>
          <textarea id="complaint-letter" ref={area} lang={language} aria-describedby="complaint-letter-hint" className="field font-mono text-base" rows={16} value={letter} onChange={(e) => setLetter(e.target.value)} />
          <p id="complaint-letter-hint" className="hint mt-1">{t('complaint.letterHint')}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={() => void copy()}><Copy aria-hidden="true" size={20} />{t('complaint.copy')}</button>
          <button type="button" className="btn" onClick={() => window.print()}><Printer aria-hidden="true" size={20} />{t('common.print')}</button>
          <a className="btn no-underline" href={`https://wa.me/?text=${encodeURIComponent(letter)}`} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" size={20} />{t('complaint.whatsapp')}</a>
          {!saved && (
            <button type="button" className="btn" disabled={saving} onClick={() => void save()}><Save aria-hidden="true" size={20} />{saving ? t('complaint.saving') : t('complaint.save')}</button>
          )}
        </div>
        <p role="status" className={`mt-3 font-bold ${message && !message.ok ? 'text-alert' : 'text-money'}`}>{message?.text}</p>

        {draft.where_to_file.length > 0 && (
          <section className="mt-6">
            <h3>{t('complaint.where')}</h3>
            <ul lang={language} className="mt-2 space-y-3">
              {draft.where_to_file.map((w, i) => (
                <li key={i} className="rounded-xl border-2 border-asphalt bg-paper p-3">
                  <p className="font-bold">{w.place}</p>
                  <p className="mt-1">{w.why}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {draft.evidence_checklist.length > 0 && (
          <fieldset className="mt-6">
            <legend className="text-[22px] font-bold">{t('complaint.evidence')}</legend>
            <p className="hint mt-1">{t('complaint.evidenceHint')}</p>
            <ul lang={language} className="mt-2 space-y-2">
              {draft.evidence_checklist.map((item, i) => (
                <li key={i}>
                  <label className="flex min-h-12 cursor-pointer items-start gap-3 py-2">
                    <input type="checkbox" className="mt-1 size-6 shrink-0" checked={ticked.has(i)} onChange={() => toggle(i)} />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}
        <AiNotice />
      </article>

      {/* Only this block is visible when printing: everything else carries `no-print`. */}
      <div className="hidden print:block" aria-hidden="true">
        <pre lang={language} className="whitespace-pre-wrap font-sans text-base text-black">{letter}</pre>
      </div>
    </>
  );
}
