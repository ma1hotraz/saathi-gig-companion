import { useCallback, useState } from 'react';

export type ShareState = 'idle' | 'locating' | 'denied' | 'unavailable' | 'shared';

/** Gets the current position and shares a Google Maps link via the share sheet or WhatsApp. */
export function useShareLocation(message: string): { state: ShareState; share: () => void } {
  const [state, setState] = useState<ShareState>('idle');

  const share = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState('unavailable');
      return;
    }
    setState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        const text = `${message} ${link}`;
        setState('shared');
        if (typeof navigator.share === 'function') {
          // A dismissed share sheet rejects; that is not an error worth showing.
          void navigator.share({ text }).catch(() => undefined);
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
        }
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, [message]);

  return { state, share };
}
