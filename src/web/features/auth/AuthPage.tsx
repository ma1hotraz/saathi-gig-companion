import { useState, type SyntheticEvent } from 'react';
import { Navigate } from 'react-router';
import { IndianRupee, PenLine, Scale } from 'lucide-react';
import { LANGUAGES, languageSchema } from '@shared/domain';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { Brand } from '@/components/Brand';
import { ErrorState, TextField } from '@/components/ui';
import { DemoLogin } from './DemoLogin';
import { SCRIPT_NAMES } from './scriptNames';

const PROMISES = [
  { key: 'auth.hero.p1', Icon: IndianRupee },
  { key: 'auth.hero.p2', Icon: Scale },
  { key: 'auth.hero.p3', Icon: PenLine },
] as const;

/** Sign-in: brand panel on the left (desktop), forms on the right. */
export default function AuthPage() {
  const { t, language, setLanguage } = useI18n();
  const { user, signIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setErrorKey(null);
    setErrorKey(await action());
    setBusy(false);
  }

  function submit(e: SyntheticEvent) {
    e.preventDefault();
    void run(() => (mode === 'signin' ? signIn(email.trim(), password) : signUp(email.trim(), password)));
  }

  return (
    <div className="min-h-dvh bg-chalk lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="lane-line relative bg-asphalt px-5 py-6 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:px-14 lg:py-12 lg:pr-16">
        <div>
          <Brand dark />
          <p className="display mt-6 text-[2rem] lg:mt-14 lg:text-[3.4rem]">{t('auth.hero.title')}</p>
          <ul className="mt-8 hidden space-y-4 lg:block">
            {PROMISES.map(({ key, Icon }) => (
              <li key={key} className="flex items-start gap-3 text-lg">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-signal text-asphalt" aria-hidden="true">
                  <Icon size={20} />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 hidden lg:block">
          <p className="mb-3 font-bold text-white/85">{t('auth.hero.scripts')}</p>
          <ul className="grid grid-cols-5 gap-2.5">
            {SCRIPT_NAMES.map(({ code, word }) => (
              <li key={code} lang={code} className="grid place-items-center rounded-xl bg-ink-2 py-3 text-center text-xl font-bold">
                {word}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-xl px-5 py-8 lg:flex lg:max-w-none lg:items-center lg:justify-center lg:px-14 lg:py-12">
        <div className="w-full lg:max-w-md">
          <div className="mb-4 flex items-center justify-end gap-3">
            <label htmlFor="auth-lang" className="label !mb-0">{t('lang.label')}</label>
            <select id="auth-lang" className="field !min-h-10 !w-auto !py-1" value={language} onChange={(e) => setLanguage(languageSchema.parse(e.target.value))}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} lang={l.code}>{l.native} ({l.name})</option>
              ))}
            </select>
          </div>
          <h1>{t('auth.title')}</h1>
          <p className="mb-6 mt-2 text-muted">{t('auth.intro')}</p>

          <DemoLogin
            onUse={(demoEmail, demoPassword) => {
              setMode('signin');
              setEmail(demoEmail);
              setPassword(demoPassword);
              setErrorKey(null);
              document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          />

          <button type="button" className="btn btn-primary mb-1 w-full" disabled={busy} onClick={() => void run(continueAsGuest)}>
            {t('auth.guest')}
          </button>
          <p className="hint mb-6">{t('auth.guestHint')}</p>

          <form id="auth-form" onSubmit={submit}>
            <TextField label={t('auth.email')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField
              label={t('auth.password')}
              hint={mode === 'signup' ? t('auth.passwordHint') : undefined}
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errorKey && <div className="mb-4"><ErrorState message={t(errorKey)} /></div>}
            <button type="submit" className="btn w-full" disabled={busy}>
              {mode === 'signin' ? t('auth.signin') : t('auth.signup')}
            </button>
          </form>
          <button type="button" className="btn btn-quiet mt-3 w-full" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorKey(null); }}>
            {mode === 'signin' ? t('auth.toSignup') : t('auth.toSignin')}
          </button>
        </div>
      </main>
    </div>
  );
}
