import { Check, ExternalLink } from 'lucide-react';
import type { Scheme } from '@shared/api';
import { Chip } from '@/components/ui';
import { useI18n } from '@/i18n';

/** One welfare scheme: header, benefit and eligibility side by side, then papers and how to apply. */
export function SchemeBlock({ scheme }: { scheme: Scheme }) {
  const { t, language } = useI18n();
  return (
    <article lang={language} className="panel p-5 lg:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <h3 className="min-w-0 flex-1 basis-60 text-xl">{scheme.name}</h3>
        <Chip tone={scheme.level === 'central' ? 'blue' : 'yellow'}>
          {t(scheme.level === 'central' ? 'rights.level.central' : 'rights.level.state')}
        </Chip>
      </header>
      <dl className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
        <div>
          <dt className="font-bold">{t('rights.benefit')}</dt>
          <dd className="mt-1">{scheme.benefit}</dd>
        </div>
        <div>
          <dt className="font-bold">{t('rights.who')}</dt>
          <dd className="mt-1">{scheme.who_can_apply}</dd>
        </div>
      </dl>
      <div className="mt-5 grid grid-cols-1 gap-5 border-t border-line pt-5 lg:grid-cols-2 lg:gap-8">
        <div>
          <h4 className="font-bold">{t('rights.docs')}</h4>
          {scheme.documents_needed.length === 0 ? (
            <p className="mt-1">{t('rights.docsNone')}</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {scheme.documents_needed.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <Check aria-hidden="true" size={18} className="mt-1 shrink-0 text-money" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h4 className="font-bold">{t('rights.how')}</h4>
          <p className="mt-1">{scheme.how_to_apply}</p>
        </div>
      </div>
      {scheme.official_url && (
        <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-5">
          {t('rights.official')} <ExternalLink aria-hidden="true" size={18} />
          <span className="sr-only"> ({t('rights.newTab')})</span>
        </a>
      )}
    </article>
  );
}
