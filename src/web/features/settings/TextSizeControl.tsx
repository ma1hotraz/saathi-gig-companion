import { useState } from 'react';
import { Check } from 'lucide-react';
import { useI18n } from '@/i18n';
import { TEXT_SCALES, readTextScale, setTextScale } from './textScale';

const SAMPLE_SIZE: Record<string, string> = { small: 'text-sm', normal: 'text-xl', large: 'text-3xl' };

/** Segmented three-option text size choice (small, normal, large). */
export function TextSizeControl() {
  const { t } = useI18n();
  const [current, setCurrent] = useState(readTextScale);
  return (
    <section aria-labelledby="set-size" className="panel p-5 lg:p-6">
      <h2 id="set-size" className="text-xl">{t('settings.size.title')}</h2>
      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border-2 border-asphalt" role="group" aria-labelledby="set-size">
        {TEXT_SCALES.map((s) => {
          const active = current === s.value;
          return (
            <button
              key={s.id}
              type="button"
              className={`flex min-h-20 flex-col items-center justify-center gap-1 border-l-2 border-asphalt px-2 py-2 font-bold first:border-l-0 ${active ? 'bg-signal' : 'bg-paper hover:bg-signal-soft'}`}
              aria-pressed={active}
              onClick={() => {
                setTextScale(s.value);
                setCurrent(s.value);
              }}
            >
              <span aria-hidden="true" className={`${SAMPLE_SIZE[s.id] ?? 'text-xl'} leading-none`}>Aa</span>
              <span className="inline-flex items-center gap-1">
                {active && <Check aria-hidden="true" size={16} />}
                {t(`settings.size.${s.id}`)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
