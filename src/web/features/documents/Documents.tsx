import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { FileSearch, PenLine } from 'lucide-react';
import type { DocumentAnalysis } from '@shared/api';
import { api, ApiRequestError } from '@/lib/api';
import { fetchSample, SAMPLES } from '@/lib/sample';
import { useI18n } from '@/i18n';
import { ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { AnalysisView } from './AnalysisView';
import { DocSteps, type DocStep } from './DocSteps';
import { UploadPanel } from './UploadPanel';
import { DocumentQA } from './DocumentQA';
import { checkFile, prepareFile } from './prepareFile';

/** Document helper: upload a paper, get a plain-language explanation, ask follow-ups. */
export default function Documents() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (analysis) resultRef.current?.focus();
  }, [analysis]);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!picked) return;
    const check = checkFile(picked);
    if (check !== 'ok') {
      setFile(null);
      setError(t(`docs.err.${check}`));
      return;
    }
    setError(null);
    setFile(picked);
  };

  const analyse = async (target: File | null = file) => {
    if (!target) {
      setError(t('docs.err.none'));
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError(null);
    try {
      const { blob, filename } = await prepareFile(target);
      setAnalysis(await api.analyzeDocument(blob, filename, language, controller.signal));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiRequestError ? err.message : t('common.error'));
    } finally {
      if (abort.current === controller) setBusy(false);
    }
  };

  /** One tap: load the bundled sample notice and explain it, exactly like an uploaded file. */
  const trySample = async () => {
    setError(null);
    try {
      const sample = await fetchSample(SAMPLES.notice);
      setFile(sample);
      await analyse(sample);
    } catch {
      setError(t('docs.sample.err'));
    }
  };

  const reset = () => {
    abort.current?.abort();
    setFile(null);
    setAnalysis(null);
    setError(null);
    setBusy(false);
  };

  const step: DocStep = analysis ? 3 : busy ? 2 : 1;

  return (
    <div>
      <PageHeader title={t('docs.title')} intro={t('docs.intro')} />
      <DocSteps current={step} />

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
          <UploadPanel file={file} busy={busy} onPick={onPick} onAnalyse={() => void analyse()} onSample={() => void trySample()} />
          {error && <div className="mt-4"><ErrorState message={error} onRetry={file && !busy && !analysis ? () => void analyse() : undefined} /></div>}
        </div>

        <div className="mt-8 lg:col-span-7 lg:mt-0">
          {busy && (
            <section className="panel p-5 lg:p-8">
              <p className="font-bold" role="status">{t('docs.analysing')}</p>
              <p className="hint mb-4">{t('docs.analysingHint')}</p>
              <Skeleton lines={6} />
            </section>
          )}

          {!busy && !analysis && (
            <section className="rounded-2xl border-2 border-dashed border-asphalt/70 p-6 text-center lg:p-10">
              <FileSearch aria-hidden="true" size={40} className="mx-auto" />
              <h2 className="mt-3 text-xl">{t('docs.placeholder.title')}</h2>
              <p className="mx-auto mt-1 text-muted">{t('docs.placeholder.body')}</p>
            </section>
          )}

          {!busy && analysis && (
            <div ref={resultRef} tabIndex={-1} className="rise outline-none">
              <AnalysisView analysis={analysis} />
              <DocumentQA analysis={analysis} />
              <section className="sign mt-6 p-5 lg:p-6" aria-labelledby="docs-decide-title">
                <h2 id="docs-decide-title">{t('docs.step.decide')}</h2>
                <p className="mt-1">{t('docs.decide.body')}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                  {analysis.suggest_complaint && (
                    <button type="button" className="btn btn-primary" onClick={() => void navigate('/complaint', { state: { fromDocument: analysis } })}>
                      <PenLine aria-hidden="true" size={20} />
                      {t('docs.complaintCta')}
                    </button>
                  )}
                  <Link to="/complaint">{t('docs.complaintLink')}</Link>
                  <button type="button" className="btn btn-quiet" onClick={reset}>{t('docs.again')}</button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
