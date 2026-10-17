import type { Source } from '@shared/api';
import { useI18n } from '@/i18n';

/** Lists the official pages the model actually read, or says plainly that none could be read. */
export function Sources({ sources }: { sources: Source[] }) {
  const { t } = useI18n();
  if (sources.length === 0) return <p className="hint mt-3">{t('common.noSources')}</p>;
  return (
    <section className="mt-3" aria-label={t('common.sources')}>
      <h3 className="text-base">{t('common.sources')}</h3>
      <ul className="mt-1 list-disc pl-5">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
