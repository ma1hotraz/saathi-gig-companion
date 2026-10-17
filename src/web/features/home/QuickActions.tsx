import { Link } from 'react-router';
import { ArrowRight, FileText, IndianRupee, Landmark, MessageCircle, PenLine, ShieldAlert, type LucideIcon } from 'lucide-react';
import { useI18n } from '@/i18n';

const ACTIONS: ReadonlyArray<{ to: string; key: string; Icon: LucideIcon; roundel: string }> = [
  { to: '/earnings', key: 'log', Icon: IndianRupee, roundel: 'bg-signal' },
  { to: '/ask', key: 'ask', Icon: MessageCircle, roundel: 'bg-lane-soft text-lane' },
  { to: '/docs', key: 'docs', Icon: FileText, roundel: 'bg-money-soft text-money' },
  { to: '/complaint', key: 'complaint', Icon: PenLine, roundel: 'bg-alert-soft text-alert' },
  { to: '/rights', key: 'schemes', Icon: Landmark, roundel: 'bg-signal-soft' },
  { to: '/safety', key: 'safety', Icon: ShieldAlert, roundel: 'bg-alert-soft text-alert' },
];

/** The six quick actions as a responsive tile grid; the first (log earning) is the primary tile. */
export function QuickActions() {
  const { t } = useI18n();
  return (
    <nav aria-label={t('home.actions')} className="mt-10">
      <h2 className="mb-4 text-2xl">{t('home.actions')}</h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map(({ to, key, Icon, roundel }, i) => {
          const primary = i === 0;
          return (
            <li key={key}>
              <Link
                to={to}
                className={`group flex h-full min-h-28 items-start gap-4 rounded-2xl border-2 p-5 text-asphalt no-underline transition-colors hover:border-asphalt ${
                  primary ? 'border-asphalt bg-signal-soft lg:min-h-32' : 'border-line bg-paper'
                }`}
              >
                <span className={`flex size-14 shrink-0 items-center justify-center rounded-full ${primary ? 'bg-signal border-2 border-asphalt' : roundel}`}>
                  <Icon aria-hidden="true" size={28} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-bold">{t(`home.action.${key}`)}</span>
                  <span className="mt-1 block text-muted">{t(`home.action.${key}.desc`)}</span>
                </span>
                <ArrowRight aria-hidden="true" size={22} className="mt-1 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-asphalt" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
