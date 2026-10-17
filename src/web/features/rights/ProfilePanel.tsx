import { Link } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import type { Profile } from '@shared/domain';
import { Skeleton } from '@/components/ui';
import { useI18n } from '@/i18n';

interface Props {
  profile: Profile;
  loading: boolean;
  busy: boolean;
  hasResult: boolean;
  onFind: () => void;
}

/** Sticky "Your details" panel with the primary search button. */
export function ProfilePanel({ profile, loading, busy, hasResult, onFind }: Props) {
  const { t } = useI18n();
  const missing = !profile.state || !profile.work_type;
  const rows: [string, string | null][] = [
    [t('rights.p.state'), profile.state],
    [t('rights.p.work'), profile.work_type ? t(`work.${profile.work_type}`) : null],
    [t('rights.p.age'), profile.age_band ? t(`age.${profile.age_band}`) : null],
    [t('rights.p.income'), profile.income_band ? t(`income.${profile.income_band}`) : null],
  ];
  return (
    <section aria-labelledby="rights-profile" className="panel p-5 lg:p-6">
      <h2 id="rights-profile" className="text-xl">{t('rights.profile')}</h2>
      {loading ? (
        <div className="mt-3"><Skeleton lines={2} /></div>
      ) : (
        <dl className="mt-3 divide-y divide-line">
          {rows.map(([label, value]) => (
            <div key={label} className="py-2">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="font-bold">{value ?? t('rights.notSet')}</dd>
            </div>
          ))}
        </dl>
      )}
      {missing && !loading && <p className="mt-3">{t('rights.missing')}</p>}
      <Link to="/settings" className="btn btn-sm mt-3">{t('rights.edit')}</Link>
      <button type="button" className="btn btn-primary mt-5 w-full" onClick={onFind} disabled={busy || loading}>
        {busy ? t('rights.finding') : hasResult ? t('rights.again') : t('rights.find')}
      </button>
      <p className="hint mt-3 flex items-start gap-2">
        <ShieldCheck aria-hidden="true" size={18} className="mt-0.5 shrink-0" /> {t('rights.trust')}
      </p>
    </section>
  );
}
