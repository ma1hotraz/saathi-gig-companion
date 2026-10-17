import { Link } from 'react-router';
import { ArrowRight, Phone } from 'lucide-react';
import { HELPLINES } from '@shared/domain';
import { useI18n } from '@/i18n';
import { Panel } from '@/components/ui';

/** Quiet "Need help now" panel with the main helpline numbers and a link to Safety. */
export function HelpPanel() {
  const { t } = useI18n();
  return (
    <Panel title={t('home.help.title')} className="h-full">
      <p className="text-muted">{t('home.help.body')}</p>
      <ul className="mt-3 divide-y divide-line">
        {HELPLINES.map((h) => (
          <li key={h.id}>
            <a href={`tel:${h.number}`} className="-mx-2 flex min-h-14 items-center gap-3 rounded-lg px-2 py-2 text-asphalt no-underline hover:bg-signal-soft">
              <Phone aria-hidden="true" size={20} className="shrink-0 text-alert" />
              <span className="money w-16 shrink-0 text-3xl">{h.number}</span>
              <span className="font-bold">{t(`safety.line.${h.id}`)}</span>
            </a>
          </li>
        ))}
      </ul>
      <Link to="/safety" className="mt-3 inline-flex min-h-12 items-center gap-2 font-bold">
        {t('home.help.cta')} <ArrowRight aria-hidden="true" size={18} />
      </Link>
    </Panel>
  );
}
