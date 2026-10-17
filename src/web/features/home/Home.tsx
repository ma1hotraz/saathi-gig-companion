import { Link } from 'react-router';
import { FileText, IndianRupee, Landmark, MessageCircle, PenLine, ShieldAlert, type LucideIcon } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useProfile } from '@/lib/profile';
import { PageHeader } from '@/components/ui';
import { EarningsSign } from './EarningsSign';

const ACTIONS: ReadonlyArray<{ to: string; key: string; Icon: LucideIcon }> = [
  { to: '/earnings', key: 'log', Icon: IndianRupee },
  { to: '/ask', key: 'ask', Icon: MessageCircle },
  { to: '/docs', key: 'docs', Icon: FileText },
  { to: '/complaint', key: 'complaint', Icon: PenLine },
  { to: '/rights', key: 'schemes', Icon: Landmark },
  { to: '/safety', key: 'safety', Icon: ShieldAlert },
];

/** Home: earnings sign panel, quick actions, and a profile nudge. */
export default function Home() {
  const { t } = useI18n();
  const { profile, loading } = useProfile();
  const name = profile.display_name?.trim();
  const incomplete = !loading && (!profile.state || !profile.work_type);

  return (
    <>
      <PageHeader title={name ? t('home.greet', { name }) : t('home.greetPlain')} />
      <EarningsSign />
      {incomplete && (
        <p className="mt-5 rounded-xl border-2 border-lane bg-lane-soft p-3">
          {t('home.nudge')} <Link to="/settings">{t('home.nudge.cta')}</Link>
        </p>
      )}
      <nav aria-label={t('home.actions')} className="mt-6">
        <h2 className="mb-2 text-xl">{t('home.actions')}</h2>
        <ul className="space-y-3">
          {ACTIONS.map(({ to, key, Icon }) => (
            <li key={key}>
              <Link to={to} className="flex min-h-14 items-center gap-4 rounded-xl border-2 border-asphalt bg-paper p-3 text-asphalt no-underline">
                <Icon aria-hidden="true" size={32} className="shrink-0" />
                <span>
                  <span className="block text-lg font-bold">{t(`home.action.${key}`)}</span>
                  <span className="block text-sm text-muted">{t(`home.action.${key}.desc`)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
