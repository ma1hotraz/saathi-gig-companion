import { Phone } from 'lucide-react';
import { HELPLINES, HELPLINE_SOURCE } from '@shared/domain';
import { useI18n } from '@/i18n';

/** Big tel: links for the national helplines, with the ambulance-varies note and source. */
export function HelplineList() {
  const { t } = useI18n();
  return (
    <div>
      <ul className="space-y-2.5">
        {HELPLINES.map((h) => (
          <li key={h.id}>
            <a href={`tel:${h.number}`} className="flex min-h-16 items-center gap-4 rounded-xl border-2 border-asphalt bg-paper px-4 py-2 text-asphalt no-underline hover:bg-signal-soft">
              <Phone aria-hidden="true" size={24} className="shrink-0 text-alert" />
              <span className="money w-24 shrink-0 text-5xl">{h.number}</span>
              <span className="text-lg font-bold leading-tight">{t(`safety.line.${h.id}`)}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">{t('safety.ambulanceNote')}</p>
      <p className="mt-1 text-sm">
        <a href={HELPLINE_SOURCE} target="_blank" rel="noopener noreferrer">{t('safety.source')}</a>
      </p>
    </div>
  );
}
