import { Phone } from 'lucide-react';
import { HELPLINES, HELPLINE_SOURCE } from '@shared/domain';
import { useI18n } from '@/i18n';

/** Big tel: links for the national helplines, with the ambulance-varies note and source. */
export function HelplineList() {
  const { t } = useI18n();
  return (
    <div>
      <ul className="space-y-2">
        {HELPLINES.map((h) => (
          <li key={h.id}>
            <a href={`tel:${h.number}`} className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-asphalt bg-paper px-3 py-2 text-asphalt no-underline">
              <Phone aria-hidden="true" size={26} className="shrink-0" />
              <span className="money text-4xl">{h.number}</span>
              <span className="font-bold">{t(`safety.line.${h.id}`)}</span>
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
