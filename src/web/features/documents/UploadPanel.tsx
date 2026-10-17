import type { ChangeEvent } from 'react';
import { Camera, FileDown, FileUp, Lock, Sparkles } from 'lucide-react';
import { SAMPLES } from '@/lib/sample';
import { useI18n } from '@/i18n';

interface Props {
  file: File | null;
  busy: boolean;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
  onAnalyse: () => void;
  onSample: () => void;
}

/** Step 1: privacy line, file input, camera, the explain button and a "no paper handy?" sample strip. */
export function UploadPanel({ file, busy, onPick, onAnalyse, onSample }: Props) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <section className="sign sign-yellow p-5 lg:p-6" aria-labelledby="docs-upload-title">
        <h2 id="docs-upload-title" className="text-xl">{t('docs.step.add')}</h2>
        <p className="mt-2 flex items-start gap-2 font-bold">
          <Lock aria-hidden="true" size={20} className="mt-1 shrink-0" />
          <span>{t('docs.privacy')}</span>
        </p>
        <div className="mt-4">
          <label htmlFor="docs-file" className="label">{t('docs.fileLabel')}</label>
          <input id="docs-file" type="file" accept="image/*,application/pdf" className="field bg-paper" aria-describedby="docs-file-hint" onChange={onPick} disabled={busy} />
          <p id="docs-file-hint" className="hint mt-1">{t('docs.fileHint')}</p>
          <label className="btn mt-3 w-full cursor-pointer bg-paper has-[:focus-visible]:outline-3 sm:w-auto">
            <Camera aria-hidden="true" size={20} />
            {t('docs.camera')}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPick} disabled={busy} />
          </label>
        </div>
        {file && <p className="mt-3 break-all font-bold" role="status">{t('docs.chosen', { name: file.name })}</p>}
        <button type="button" className="btn btn-primary mt-4 w-full bg-paper" onClick={onAnalyse} disabled={busy}>
          <FileUp aria-hidden="true" size={20} />
          {t('docs.analyse')}
        </button>
      </section>

      <section className="rounded-2xl border-2 border-dashed border-asphalt/70 p-4" aria-labelledby="docs-sample-title">
        <h2 id="docs-sample-title" className="text-lg">{t('docs.sample.title')}</h2>
        <p className="hint mt-1">{t('docs.sample.hint')}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button type="button" className="btn btn-sm" onClick={onSample} disabled={busy}>
            <Sparkles aria-hidden="true" size={18} />
            {t('docs.sample.try')}
          </button>
          <a className="inline-flex min-h-12 items-center gap-1 font-bold" href={SAMPLES.notice.path} download={SAMPLES.notice.filename}>
            <FileDown aria-hidden="true" size={18} />
            {t('docs.sample.download')}
          </a>
        </div>
      </section>
    </div>
  );
}
