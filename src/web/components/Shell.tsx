import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router';
import { Home, IndianRupee, MessageCircle, FileText, Scale, Siren } from 'lucide-react';
import { LANGUAGES, languageSchema } from '@shared/domain';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/profile';
import SosButton from '@/features/safety/SosButton';
import { Skeleton } from './ui';

const NAV = [
  { to: '/', key: 'nav.home', Icon: Home, end: true },
  { to: '/earnings', key: 'nav.earnings', Icon: IndianRupee, end: false },
  { to: '/ask', key: 'nav.ask', Icon: MessageCircle, end: false },
  { to: '/docs', key: 'nav.docs', Icon: FileText, end: false },
  { to: '/rights', key: 'nav.rights', Icon: Scale, end: false },
] as const;

export default function Shell() {
  const { t, language, setLanguage } = useI18n();
  const { isGuest } = useAuth();
  const { hasProfile, profile, save } = useProfile();

  function changeLanguage(value: string) {
    const code = languageSchema.parse(value);
    setLanguage(code);
    if (hasProfile) void save({ ...profile, language: code });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col bg-chalk">
      <a href="#main" className="skip-link">{t('skip')}</a>
      <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-2 border-b-2 border-asphalt bg-signal px-4 py-2" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <NavLink to="/" className="flex items-center gap-2 text-asphalt no-underline" aria-label={t('app.name')}>
          <Siren aria-hidden="true" size={26} />
          <span className="text-2xl font-extrabold" style={{ fontStretch: '80%' }}>{t('app.name')}</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="lang">{t('lang.label')}</label>
          <select id="lang" className="field !min-h-11 !w-auto !py-1 !text-base" value={language} onChange={(e) => changeLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} lang={l.code}>{l.native}</option>
            ))}
          </select>
          <SosButton />
        </div>
      </header>

      {isGuest && <p className="no-print border-b-2 border-asphalt bg-lane-soft px-4 py-2 text-sm">{t('auth.guestBanner')}</p>}

      <main id="main" tabIndex={-1} className="flex-1 px-4 pb-28 pt-5">
        <Suspense fallback={<Skeleton lines={5} />}>
          <Outlet />
        </Suspense>
      </main>

      <nav aria-label={t('nav.main')} className="no-print fixed inset-x-0 bottom-0 z-20 mx-auto grid max-w-[640px] grid-cols-5 border-t-2 border-asphalt bg-paper" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map(({ to, key, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-[0.8rem] font-bold no-underline ${isActive ? 'bg-signal text-asphalt' : 'text-asphalt'}`
            }
          >
            <Icon aria-hidden="true" size={24} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
