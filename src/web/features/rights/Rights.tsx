import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { FileSearch } from 'lucide-react';
import type { SchemesResult } from '@shared/api';
import { AiNotice, ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { ReadAloud } from '@/components/ReadAloud';
import { Sources } from '@/components/Sources';
import { api, ApiRequestError } from '@/lib/api';
import { useProfile } from '@/lib/profile';
import { useI18n } from '@/i18n';
import { readSchemesCache, schemesCacheKey, writeSchemesCache } from './cache';
import { ProfilePanel } from './ProfilePanel';
import { SchemeBlock } from './SchemeBlock';

/** Rights and welfare scheme finder, driven by the worker's saved profile. */
export default function Rights() {
  const { t, language } = useI18n();
  const { profile, loading: profileLoading } = useProfile();
  const [result, setResult] = useState<SchemesResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheKey = schemesCacheKey(profile, language);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Show a cached answer for this profile and language instead of calling the API again.
  useEffect(() => {
    if (profileLoading) return;
    setResult(readSchemesCache(cacheKey));
  }, [cacheKey, profileLoading]);

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
      writeSchemesCache(cacheKey, data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiRequestError ? err.message : t('common.error'));
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  }, [profile, language, t, cacheKey]);

  return (
    <div>
      <PageHeader title={t('rights.title')} intro={t('rights.intro')} />

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <ProfilePanel profile={profile} loading={profileLoading} busy={busy} hasResult={result !== null} onFind={() => void find()} />
        </div>

        <div className="mt-6 space-y-5 lg:col-span-8 lg:mt-0">
          {!result && !busy && !error && (
            <div className="rounded-2xl border-2 border-dashed border-asphalt/70 p-6 lg:p-10">
              <FileSearch aria-hidden="true" size={36} className="text-signal-deep" />
              <h2 className="mt-3 text-xl">{t('rights.emptyTitle')}</h2>
              <p className="mt-1 max-w-xl text-muted">{t('rights.emptyBody')}</p>
            </div>
          )}

          {busy && (
            <div className="panel p-5 lg:p-6">
              <p role="status" className="mb-4 font-bold">{t('rights.wait')}</p>
              <Skeleton lines={6} />
            </div>
          )}

          {error && !busy && <ErrorState message={error} onRetry={() => void find()} />}

          {result && !busy && (
            <section aria-labelledby="rights-results" aria-live="polite" className="space-y-5">
              <h2 id="rights-results" className="text-2xl">{t('rights.results')}</h2>
              <div>
                <p lang={language} className="text-lg">{result.intro}</p>
                <div className="mt-2"><ReadAloud text={result.intro} /></div>
              </div>
              {result.schemes.length === 0 ? (
                <p>{t('rights.none')}</p>
              ) : (
                result.schemes.map((s) => <SchemeBlock key={s.name} scheme={s} />)
              )}
              <p className="font-bold">{t('rights.confirm')}</p>
              <div className="text-sm text-muted">
                <Sources sources={result.sources} />
                <AiNotice />
              </div>
            </section>
          )}

          <nav aria-label={t('rights.next')} className="flex flex-col gap-3 sm:flex-row">
            <Link to="/docs" className="btn">{t('rights.toDocs')}</Link>
            <Link to="/ask" className="btn">{t('rights.toAsk')}</Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
