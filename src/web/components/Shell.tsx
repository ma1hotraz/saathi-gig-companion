import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { FileText, Home, IndianRupee, LogOut, MessageCircle, PenLine, Scale, Settings, ShieldAlert } from 'lucide-react';
import { LANGUAGES, languageSchema } from '@shared/domain';
import { useI18n } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/profile';
import SosButton from '@/features/safety/SosButton';
import { Brand } from './Brand';
import { Skeleton } from './ui';

const PRIMARY = [
  { to: '/', key: 'nav.home', Icon: Home, end: true },
  { to: '/earnings', key: 'nav.earnings', Icon: IndianRupee, end: false },
  { to: '/ask', key: 'nav.ask', Icon: MessageCircle, end: false },
  { to: '/docs', key: 'nav.docs', Icon: FileText, end: false },
  { to: '/rights', key: 'nav.rights', Icon: Scale, end: false },
] as const;

const MORE = [
  { to: '/complaint', key: 'nav.complaint', Icon: PenLine, end: false },
  { to: '/safety', key: 'nav.safety', Icon: ShieldAlert, end: false },
  { to: '/settings', key: 'nav.settings', Icon: Settings, end: false },
] as const;

/** App frame: sidebar on desktop (lg and up), yellow header plus bottom tabs on phones. */
export default function Shell() {
  const { t, language, setLanguage } = useI18n();
  const { user, isGuest, signOut } = useAuth();
  const { hasProfile, profile, save } = useProfile();

  function changeLanguage(value: string) {
    const code = languageSchema.parse(value);
    setLanguage(code);
    if (hasProfile) void save({ ...profile, language: code });
  }

  const sideLink = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-12 items-center gap-3 rounded-xl px-3.5 font-bold no-underline transition-colors ${
      isActive ? 'bg-signal text-asphalt' : 'text-white hover:bg-ink-2'
    }`;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17.5rem_1fr]">
      <a href="#main" className="skip-link">{t('skip')}</a>

      <aside className="no-print lane-line relative sticky top-0 hidden h-dvh flex-col bg-asphalt p-5 pr-7 text-white lg:flex">
        <Link to="/" className="mb-8 mt-1 no-underline" aria-label={t('app.name')}>
          <Brand dark />
        </Link>
        <nav aria-label={t('nav.main')} className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {PRIMARY.map(({ to, key, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={sideLink}>
              <Icon aria-hidden="true" size={22} />
              {t(key)}
            </NavLink>
          ))}
          <hr className="my-3 border-white/20" />
          {MORE.map(({ to, key, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={sideLink}>
              <Icon aria-hidden="true" size={22} />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 rounded-2xl bg-ink-2 p-4">
          <p className="truncate font-bold">{profile.display_name ?? (isGuest ? t('account.guest') : user?.email)}</p>
          {!isGuest && profile.display_name && <p className="truncate text-sm text-white/80">{user?.email}</p>}
          {isGuest && <p className="text-sm text-white/80">{t('account.guestNote')}</p>}
          <button type="button" className="btn btn-ghost-light btn-sm mt-3 w-full" onClick={() => void signOut()}>
            <LogOut aria-hidden="true" size={18} />
            {t('auth.signout')}
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-2 border-b-2 border-asphalt bg-signal px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] lg:justify-end lg:border-b lg:border-line lg:bg-chalk/95 lg:px-10 lg:py-3 lg:backdrop-blur">
          <Link to="/" className="shrink-0 no-underline lg:hidden" aria-label={t('app.name')}>
            <Brand compact />
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <label className="sr-only" htmlFor="lang">{t('lang.label')}</label>
            <select id="lang" className="field !min-h-11 !w-auto max-w-[8.5rem] !py-1 !text-base" value={language} onChange={(e) => changeLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} lang={l.code}>{l.native}</option>
              ))}
            </select>
            <Link to="/settings" className="btn btn-sm !px-2.5 lg:hidden" aria-label={t('nav.settings')}>
              <Settings aria-hidden="true" size={20} />
            </Link>
            <SosButton />
          </div>
        </header>

        {isGuest && <p className="no-print max-w-none border-b border-line bg-lane-soft px-4 py-2 text-sm lg:px-10">{t('auth.guestBanner')}</p>}

        <main id="main" tabIndex={-1} className="flex-1 px-4 pb-28 pt-6 outline-none lg:px-10 lg:pb-14 lg:pt-8">
          <div className="mx-auto w-full max-w-[76rem]">
            <Suspense fallback={<Skeleton lines={5} />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      <nav aria-label={t('nav.main')} className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t-2 border-asphalt bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden">
        {PRIMARY.map(({ to, key, Icon, end }) => (
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
