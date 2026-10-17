import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { SchemesResult } from '@shared/api';
import { AiNotice, ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { ReadAloud } from '@/components/ReadAloud';
import { Sources } from '@/components/Sources';
import { api, ApiRequestError } from '@/lib/api';
import { useProfile } from '@/lib/profile';
import { useI18n } from '@/i18n';
import { SchemeBlock } from './SchemeBlock';

/** Rights and welfare scheme finder, driven by the worker's saved profile. */
export default function Rights() {
  const { t, language } = useI18n();
  const { profile, loading: profileLoading } = useProfile();
  const [result, setResult] = useState<SchemesResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const find = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    try {
      const data = await api.schemes(
        { state: profile.state, work_type: profile.work_type, age_band: profile.age_band, income_band: profile.income_band, language },
        controller.signal,
      );
      setResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiRequestError ? err.message : t('common.error'));
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }, [profile, language, t]);

  const missing = !profile.state || !profile.work_type;
  const rows: [string, string | null][] = [
    [t('rights.p.state'), profile.state],
    [t('rights.p.work'), profile.work_type ? t(`work.${profile.work_type}`) : null],
    [t('rights.p.age'), profile.age_band ? t(`age.${profile.age_band}`) : null],
    [t('rights.p.income'), profile.income_band ? t(`income.${profile.income_band}`) : null],
  ];

  return (
    <div>
      <PageHeader title={t('rights.title')} intro={t('rights.intro')} />

      <section aria-labelledby="rights-profile" className="sign mb-5 p-4">
        <h2 id="rights-profile" className="text-xl">{t('rights.profile')}</h2>
        {profileLoading ? (
          <Skeleton lines={2} />
        ) : (
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-bold">{label}</dt>
                <dd>{value ?? t('rights.notSet')}</dd>
              </div>
            ))}
          </dl>
        )}
        {missing && !profileLoading && <p className="mt-3">{t('rights.missing')}</p>}
        <Link to="/settings" className="btn mt-3">{t('rights.edit')}</Link>
      </section>

      <button type="button" className="btn btn-primary mb-5 w-full" onClick={() => void find()} disabled={busy || profileLoading}>
        {busy ? t('rights.finding') : result ? t('rights.again') : t('rights.find')}
      </button>

      {busy && (
        <div className="mb-5">
          <p role="status" className="mb-3 font-bold">{t('rights.wait')}</p>
          <Skeleton lines={6} />
        </div>
      )}

      {error && !busy && (
        <div className="mb-5">
          <ErrorState message={error} onRetry={() => void find()} />
        </div>
      )}

      {result && !busy && (
        <section aria-labelledby="rights-results" aria-live="polite" className="space-y-4">
          <h2 id="rights-results" className="text-2xl">{t('rights.results')}</h2>
          <p lang={language}>{result.intro}</p>
          <ReadAloud text={result.intro} />
          {result.schemes.length === 0 ? (
            <p>{t('rights.none')}</p>
          ) : (
            result.schemes.map((s) => <SchemeBlock key={s.name} scheme={s} />)
          )}
          <p className="font-bold">{t('rights.confirm')}</p>
          <Sources sources={result.sources} />
          <AiNotice />
        </section>
      )}

      <nav aria-label={t('rights.next')} className="mt-6 flex flex-col gap-3">
        <Link to="/docs" className="btn">{t('rights.toDocs')}</Link>
        <Link to="/ask" className="btn">{t('rights.toAsk')}</Link>
      </nav>
    </div>
  );
}
