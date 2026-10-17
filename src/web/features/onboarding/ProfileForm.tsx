import { useState, type FormEvent } from 'react';
import {
  AGE_BANDS,
  INCOME_BANDS,
  INDIAN_STATES,
  LANGUAGES,
  WORK_TYPES,
  ageBandSchema,
  incomeBandSchema,
  languageSchema,
  stateSchema,
  workTypeSchema,
  type Profile,
} from '@shared/domain';
import { useI18n } from '@/i18n';
import { ErrorState, SelectField, TextField } from '@/components/ui';

interface Props {
  initial: Profile;
  submitLabel: string;
  onSave: (profile: Profile) => Promise<string | null>;
}

/** Shared by first-run setup and Settings. Every field except language is optional. */
export function ProfileForm({ initial, submitLabel, onSave }: Props) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Profile>(initial);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorKey(await onSave({ ...draft, display_name: draft.display_name?.trim() || null }));
    setBusy(false);
  }

  const parseOrNull = <T,>(parse: (v: unknown) => { success: boolean; data?: T }, v: string): T | null => {
    const r = parse(v);
    return r.success ? (r.data as T) : null;
  };

  return (
    <form onSubmit={(e) => void submit(e)}>
      <TextField label={t('profile.name')} optional autoComplete="given-name" maxLength={60} value={draft.display_name ?? ''} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} />
      <SelectField label={t('profile.language')} value={draft.language} onChange={(e) => setDraft({ ...draft, language: languageSchema.parse(e.target.value) })}>
        {LANGUAGES.map((l) => <option key={l.code} value={l.code} lang={l.code}>{l.native} ({l.name})</option>)}
      </SelectField>
      <SelectField label={t('profile.state')} value={draft.state ?? ''} onChange={(e) => setDraft({ ...draft, state: parseOrNull((v) => stateSchema.safeParse(v), e.target.value) })}>
        <option value="">{t('common.choose')}</option>
        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </SelectField>
      <SelectField label={t('profile.work')} value={draft.work_type ?? ''} onChange={(e) => setDraft({ ...draft, work_type: parseOrNull((v) => workTypeSchema.safeParse(v), e.target.value) })}>
        <option value="">{t('common.choose')}</option>
        {WORK_TYPES.map((w) => <option key={w} value={w}>{t(`work.${w}`)}</option>)}
      </SelectField>
      <SelectField label={t('profile.age')} value={draft.age_band ?? ''} onChange={(e) => setDraft({ ...draft, age_band: parseOrNull((v) => ageBandSchema.safeParse(v), e.target.value) })}>
        <option value="">{t('common.choose')}</option>
        {AGE_BANDS.map((a) => <option key={a} value={a}>{t(`age.${a}`)}</option>)}
      </SelectField>
      <SelectField label={t('profile.income')} value={draft.income_band ?? ''} onChange={(e) => setDraft({ ...draft, income_band: parseOrNull((v) => incomeBandSchema.safeParse(v), e.target.value) })}>
        <option value="">{t('common.choose')}</option>
        {INCOME_BANDS.map((i) => <option key={i} value={i}>{t(`income.${i}`)}</option>)}
      </SelectField>
      {errorKey && <div className="mb-4"><ErrorState message={t(errorKey)} /></div>}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>{submitLabel}</button>
    </form>
  );
}
