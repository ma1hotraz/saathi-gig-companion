import { useNavigate } from 'react-router';
import { useI18n } from '@/i18n';
import { useProfile } from '@/lib/profile';
import { PageHeader } from '@/components/ui';
import { ProfileForm } from './ProfileForm';

export default function Setup() {
  const { t } = useI18n();
  const { profile, save } = useProfile();
  const navigate = useNavigate();
  return (
    <div className="mx-auto min-h-dvh max-w-[640px] bg-chalk px-4 py-8">
      <main>
        <PageHeader title={t('profile.title')} intro={t('profile.intro')} />
        <ProfileForm
          initial={profile}
          submitLabel={t('profile.save')}
          onSave={async (next) => {
            const err = await save(next);
            if (!err) void navigate('/', { replace: true });
            return err;
          }}
        />
      </main>
    </div>
  );
}
