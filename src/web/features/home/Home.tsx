import { Link } from 'react-router';
import { UserRound } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useProfile } from '@/lib/profile';
import { PageHeader } from '@/components/ui';
import { EarningsSign } from './EarningsSign';
import { HelpPanel } from './HelpPanel';
import { QuickActions } from './QuickActions';

/** Home: earnings hero plate, a quiet help panel, quick action tiles and a slim profile nudge. */
export default function Home() {
  const { t } = useI18n();
  const { profile, loading } = useProfile();
  const name = profile.display_name?.trim();
  const incomplete = !loading && (!profile.state || !profile.work_type);

  return (
    <>
      <PageHeader title={name ? t('home.greet', { name }) : t('home.greetPlain')} />
      {incomplete && (
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-lane bg-lane-soft px-4 py-2">
          <UserRound aria-hidden="true" size={20} className="shrink-0 text-lane" />
          <span>{t('home.nudge')}</span>
          <Link to="/settings" className="font-bold">{t('home.nudge.cta')}</Link>
        </p>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7"><EarningsSign /></div>
        <div className="lg:col-span-5"><HelpPanel /></div>
      </div>
      <QuickActions />
    </>
  );
}
