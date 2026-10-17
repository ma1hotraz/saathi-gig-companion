import { useState } from 'react';
import { useI18n } from '@/i18n';
import { TEXT_SCALES, readTextScale, setTextScale } from './textScale';

/** Three-button text size choice (small, normal, large). */
export function TextSizeControl() {
  const { t } = useI18n();
  const [current, setCurrent] = useState(readTextScale);
  return (
    <section aria-labelledby="set-size" className="mt-8">
      <h2 id="set-size" className="text-xl">{t('settings.size.title')}</h2>
      <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-labelledby="set-size">
        {TEXT_SCALES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`btn ${current === s.value ? 'btn-primary' : ''}`}
            aria-pressed={current === s.value}
            onClick={() => {
              setTextScale(s.value);
              setCurrent(s.value);
            }}
          >
            {t(`settings.size.${s.id}`)}
          </button>
        ))}
      </div>
    </section>
  );
}
