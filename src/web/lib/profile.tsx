import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { profileSchema, type Profile } from '@shared/domain';
import { useAuth } from './auth';
import { useI18n } from '@/i18n';
import { supabase } from './supabase';

interface ProfileState {
  profile: Profile;
  /** True once the worker has completed setup (a saved row exists). */
  hasProfile: boolean;
  loading: boolean;
  save: (next: Profile) => Promise<string | null>;
}

const ProfileContext = createContext<ProfileState | null>(null);

const emptyProfile = (language: Profile['language']): Profile => ({
  display_name: null,
  language,
  state: null,
  work_type: null,
  age_band: null,
  income_band: null,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { language, setLanguage } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void supabase
      .from('profiles')
      .select('display_name,language,state,work_type,age_band,income_band')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const parsed = profileSchema.safeParse(data);
        if (parsed.success) {
          setProfile(parsed.data);
          setLanguage(parsed.data.language);
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
  }, [user, setLanguage]);

  const save = useCallback(
    async (next: Profile): Promise<string | null> => {
      if (!user) return 'auth.err.generic';
      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...next });
      if (error) return 'profile.err.save';
      setProfile(next);
      setLanguage(next.language);
      return null;
    },
    [user, setLanguage],
  );

  const value = useMemo<ProfileState>(
    () => ({ profile: profile ?? emptyProfile(language), hasProfile: profile !== null, loading, save }),
    [profile, language, loading, save],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileState {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
