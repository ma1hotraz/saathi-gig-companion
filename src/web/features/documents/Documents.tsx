import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Camera, FileUp, Lock } from 'lucide-react';
import type { DocumentAnalysis } from '@shared/api';
import { api, ApiRequestError } from '@/lib/api';
import { useI18n } from '@/i18n';
import { ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { AnalysisView } from './AnalysisView';
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

  const analyse = async () => {
    if (!file) {
      setError(t('docs.err.none'));
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError(null);
    try {
      const { blob, filename } = await prepareFile(file);
      setAnalysis(await api.analyzeDocument(blob, filename, language, controller.signal));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiRequestError ? err.message : t('common.error'));
    } finally {
      if (abort.current === controller) setBusy(false);
    }
  };

  const reset = () => {
    abort.current?.abort();
    setFile(null);
    setAnalysis(null);
    setError(null);
    setBusy(false);
  };

  return (
    <div>
      <PageHeader title={t('docs.title')} intro={t('docs.intro')} />

      {!analysis && (
        <section className="sign sign-yellow p-4">
          <p className="flex items-start gap-2 font-bold">
            <Lock aria-hidden="true" size={20} className="mt-1 shrink-0" />
            <span>{t('docs.privacy')}</span>
          </p>
          <div className="mt-4">
            <label htmlFor="docs-file" className="label">{t('docs.fileLabel')}</label>
            <input id="docs-file" type="file" accept="image/*,application/pdf" className="field bg-paper" aria-describedby="docs-file-hint" onChange={onPick} disabled={busy} />
            <p id="docs-file-hint" className="hint mt-1">{t('docs.fileHint')}</p>
            <label className="btn mt-3 cursor-pointer bg-paper has-[:focus-visible]:outline-3">
              <Camera aria-hidden="true" size={20} />
              {t('docs.camera')}
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPick} disabled={busy} />
            </label>
          </div>
          {file && <p className="mt-3 break-all font-bold" role="status">{t('docs.chosen', { name: file.name })}</p>}
          <button type="button" className="btn btn-primary mt-4 bg-paper" onClick={() => void analyse()} disabled={busy}>
            <FileUp aria-hidden="true" size={20} />
            {t('docs.analyse')}
          </button>
        </section>
      )}

      {error && <div className="mt-4"><ErrorState message={error} onRetry={file && !busy && !analysis ? () => void analyse() : undefined} /></div>}

      {busy && (
        <div className="mt-6">
          <p className="font-bold" role="status">{t('docs.analysing')}</p>
          <p className="hint mb-3">{t('docs.analysingHint')}</p>
          <Skeleton lines={6} />
        </div>
      )}

      {analysis && (
        <div ref={resultRef} tabIndex={-1} className="outline-none">
          <AnalysisView analysis={analysis} />
          <div className="mt-6 flex flex-col items-start gap-3">
            {analysis.suggest_complaint && (
              <button type="button" className="btn btn-primary" onClick={() => void navigate('/complaint', { state: { fromDocument: analysis } })}>
                {t('docs.complaintCta')}
              </button>
            )}
            <Link to="/complaint">{t('docs.complaintLink')}</Link>
          </div>
          <DocumentQA analysis={analysis} />
          <button type="button" className="btn mt-8" onClick={reset}>{t('docs.again')}</button>
        </div>
      )}
    </div>
  );
}
