import { MapPin } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShareLocation } from './useShareLocation';

/** Button that shares the worker's live location link; used on the Safety page and in the SOS dialog. */
export function ShareLocation() {
  const { t } = useI18n();
  const { state, share } = useShareLocation(t('safety.share.message'));
  return (
    <div>
      <button type="button" className="btn btn-primary w-full" onClick={share} disabled={state === 'locating'}>
        <MapPin aria-hidden="true" size={22} /> {state === 'locating' ? t('safety.share.locating') : t('safety.share.cta')}
      </button>
      <div role="status" aria-live="polite">
        {state === 'shared' && <p className="hint mt-2">{t('safety.share.done')}</p>}
      </div>
      {(state === 'denied' || state === 'unavailable') && (
        <p role="alert" className="mt-2 font-bold text-alert">{t(state === 'denied' ? 'safety.share.denied' : 'safety.share.unavailable')}</p>
      )}
    </div>
  );
}
