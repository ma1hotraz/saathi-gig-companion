import { useEffect, useRef, useState } from 'react';
import type { EarningsExtractResult } from '@shared/api';
import { ApiRequestError } from '@/lib/api';
import { useI18n } from '@/i18n';

/** Runs one AI extraction request at a time, cancelling the previous one and any pending one on unmount. */
export function useExtract(onResult: (r: EarningsExtractResult) => void) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function run(call: (signal: AbortSignal) => Promise<EarningsExtractResult>) {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setBusy(true);
    setError(null);
    try {
      onResult(await call(ctrl.signal));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof ApiRequestError ? err.message : t('common.error'));
    } finally {
      if (!ctrl.signal.aborted) setBusy(false);
    }
  }

  return { busy, error, setError, run };
}
