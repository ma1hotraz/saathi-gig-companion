import { useEffect, useState } from 'react';
import type { SafetyResult } from '@shared/api';
import type { SafetySituation } from '@shared/domain';
import { ApiRequestError, api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { useProfile } from '@/lib/profile';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; result: SafetyResult };

/** Fetches guidance for a situation, cancelling any earlier request when it changes. */
export function useSafetyGuidance(situation: SafetySituation | null): { state: State; retry: () => void } {
  const { t, language } = useI18n();
  const { profile } = useProfile();
  const [state, setState] = useState<State>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const { work_type, state: region } = profile;

  useEffect(() => {
    if (!situation) {
      setState({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    api
      .safety({ situation, work_type, state: region, language }, controller.signal)
      .then((result) => setState({ status: 'ready', result }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState({ status: 'error', message: err instanceof ApiRequestError ? err.message : t('common.error') });
      });
    return () => controller.abort();
    // t changes identity with language, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [situation, work_type, region, language, attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}
