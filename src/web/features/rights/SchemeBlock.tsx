import { ExternalLink } from 'lucide-react';
import type { Scheme } from '@shared/api';
import { useI18n } from '@/i18n';

/** One welfare scheme: benefit, eligibility, documents and how to apply. */
export function SchemeBlock({ scheme }: { scheme: Scheme }) {
  const { t, language } = useI18n();
  return (
    <article lang={language} className="rounded-xl border-2 border-asphalt bg-paper p-4">
      <h3 className="text-xl">{scheme.name}</h3>
      <p className="mt-1">
        <span className="inline-block rounded border-2 border-asphalt px-2 py-0.5 text-sm font-bold">
          {t(scheme.level === 'central' ? 'rights.level.central' : 'rights.level.state')}
        </span>
      </p>
      <dl className="mt-3 space-y-3">
        <div>
          <dt className="font-bold">{t('rights.benefit')}</dt>
          <dd>{scheme.benefit}</dd>
        </div>
        <div>
          <dt className="font-bold">{t('rights.who')}</dt>
          <dd>{scheme.who_can_apply}</dd>
        </div>
        <div>
          <dt className="font-bold">{t('rights.docs')}</dt>
          <dd>
            {scheme.documents_needed.length === 0 ? (
              t('rights.docsNone')
            ) : (
              <ul className="list-disc pl-5">
                {scheme.documents_needed.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-bold">{t('rights.how')}</dt>
          <dd>{scheme.how_to_apply}</dd>
        </div>
      </dl>
      {scheme.official_url && (
        <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="btn mt-3">
          {t('rights.official')} <ExternalLink aria-hidden="true" size={18} />
          <span className="sr-only"> ({t('rights.newTab')})</span>
        </a>
      )}
    </article>
  );
}
