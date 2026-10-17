import { useEffect, useRef, useState } from 'react';
import type { DocumentAnalysis } from '@shared/api';
import { LIMITS } from '@shared/api';
import { api, ApiRequestError } from '@/lib/api';
import { useI18n } from '@/i18n';
import { AiNotice, ErrorState, Skeleton, TextArea } from '@/components/ui';
import { Markdown } from '@/components/Markdown';
import { VoiceInput } from '@/components/VoiceInput';

interface Pair {
  question: string;
  answer: string;
}

/** Follow-up questions about one analysed document, kept as a running list. */
export function DocumentQA({ analysis }: { analysis: DocumentAnalysis }) {
  const { t, language } = useI18n();
  const [question, setQuestion] = useState('');
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const ask = async () => {
    const q = question.trim();
    if (!q) {
      setError(t('docs.err.question'));
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError(null);
    try {
      const { answer } = await api.askDocument({ question: q, analysis, language }, controller.signal);
      setPairs((prev) => [...prev, { question: q, answer }]);
      setQuestion('');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiRequestError ? err.message : t('common.error'));
    } finally {
      if (abort.current === controller) setBusy(false);
    }
  };

  return (
    <section className="mt-8" aria-labelledby="docs-ask-title">
      <h2 id="docs-ask-title">{t('docs.askTitle')}</h2>
      <div className="mt-3">
        <TextArea
          label={t('docs.askLabel')}
          hint={t('docs.askHint')}
          rows={3}
          maxLength={LIMITS.questionChars}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-invalid={error === t('docs.err.question')}
        />
        <div className="flex flex-wrap items-center gap-3">
          <VoiceInput language={language} disabled={busy} onText={(text) => setQuestion((prev) => `${prev} ${text}`.trim().slice(0, LIMITS.questionChars))} />
          <button type="button" className="btn btn-primary" onClick={() => void ask()} disabled={busy}>
            {busy ? t('docs.asking') : t('docs.ask')}
          </button>
        </div>
      </div>
      {busy && <div className="mt-4"><Skeleton lines={3} /></div>}
      {error && <div className="mt-4"><ErrorState message={error} /></div>}
      {pairs.length > 0 && (
        <div className="mt-6" aria-live="polite">
          <h3>{t('docs.history')}</h3>
          <ul className="mt-3 space-y-4">
            {pairs.map((p, i) => (
              <li key={i} className="border-l-4 border-asphalt pl-3">
                <p lang={language} className="font-bold"><span className="text-muted">{t('docs.you')}: </span>{p.question}</p>
                <div lang={language} className="mt-2"><Markdown>{p.answer}</Markdown></div>
              </li>
            ))}
          </ul>
          <AiNotice />
        </div>
      )}
    </section>
  );
}
