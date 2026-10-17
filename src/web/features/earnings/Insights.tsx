import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { InsightsResult } from '@shared/api';
import { AiNotice, Skeleton } from '@/components/ui';
import { Markdown } from '@/components/Markdown';
import { ReadAloud } from '@/components/ReadAloud';
import { api, ApiRequestError } from '@/lib/api';
import { useI18n } from '@/i18n';

/** Asks the server to explain the user's earnings in their language. */
export function Insights({ hasEntries }: { hasEntries: boolean }) {
  const { t, language } = useI18n();
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function explain() {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setBusy(true);
    setError(null);
    try {
      setResult(await api.insights(language, ctrl.signal));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiRequestError ? err.message : t('common.error'));
    } finally {
      if (!ctrl.signal.aborted) setBusy(false);
    }
  }

  return (
    <section aria-labelledby="ins-h" className="mt-8">
      <h2 id="ins-h" className="mb-2 text-3xl">{t('earnings.ins.title')}</h2>
      <p className="mb-3 text-muted">{hasEntries ? t('earnings.ins.body') : t('earnings.ins.empty')}</p>
      <button type="button" className="btn btn-primary" disabled={busy || !hasEntries} onClick={() => void explain()}>
        {busy ? t('earnings.ins.working') : t('earnings.ins.go')}
      </button>
      <div className="mt-4" aria-live="polite">
        {busy && <Skeleton lines={5} />}
        {error && <p role="alert" className="font-bold text-alert">{error}</p>}
        {result && !busy && (
          <div lang={language}>
            <Markdown>{result.insights}</Markdown>
            <AiNotice />
            <div className="mt-3"><ReadAloud text={result.insights} /></div>
          </div>
        )}
      </div>
      <p className="mt-4">
        <Link to="/complaint?issue_type=unpaid_wages">{t('earnings.ins.complaint')}</Link>
      </p>
    </section>
  );
}
