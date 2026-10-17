import { useId } from 'react';
import { Camera, FileDown, Sparkles } from 'lucide-react';
import { LIMITS, type EarningsExtractResult } from '@shared/api';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { fetchSample, SAMPLES } from '@/lib/sample';
import { downscaleImage } from './imageResize';
import { useExtract } from './useExtract';

/** Upload or photograph a payout screenshot; the AI reads it into draft entries. */
export function ScreenshotTab({ onResult }: { onResult: (r: EarningsExtractResult) => void }) {
  const { t, language } = useI18n();
  const inputId = useId();
  const { busy, error, setError, run } = useExtract(onResult);

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('earnings.shot.notImage'));
      return;
    }
    if (file.size > LIMITS.uploadBytes) {
      setError(t('earnings.shot.tooBig'));
      return;
    }
    await run(async (signal) => {
      const blob = await downscaleImage(file);
      return api.extractEarningsFile(blob, 'payout.jpg', language, signal);
    });
  }

  async function trySample() {
    try {
      await pick(await fetchSample(SAMPLES.payout));
    } catch {
      setError(t('earnings.shot.sampleErr'));
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="label">{t('earnings.shot.label')}</label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="field"
        disabled={busy}
        aria-describedby={`${inputId}-hint`}
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <p id={`${inputId}-hint`} className="hint mt-1">
        <Camera aria-hidden="true" size={14} className="mr-1 inline" />
        {t('earnings.shot.hint')}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <button type="button" className="btn" disabled={busy} onClick={() => void trySample()}>
          <Sparkles aria-hidden="true" size={20} />
          {t('earnings.shot.sample')}
        </button>
        <a className="inline-flex items-center gap-1 font-bold" href={SAMPLES.payout.path} download={SAMPLES.payout.filename}>
          <FileDown aria-hidden="true" size={18} />
          {t('earnings.shot.sampleDownload')}
        </a>
      </div>
      <p role="status" aria-live="polite" className="mt-3 font-bold">{busy ? t('earnings.reading') : ''}</p>
      <p role="alert" className="mt-1 font-bold text-alert">{error}</p>
    </div>
  );
}
