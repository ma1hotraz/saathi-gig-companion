import { useState, type SyntheticEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { grievanceRequestSchema, LIMITS, type GrievanceRequest } from '@shared/api';
import { INDIAN_STATES, ISSUE_TYPES, issueTypeSchema } from '@shared/domain';
import { useI18n } from '@/i18n';
import { SelectField, TextArea, TextField } from '@/components/ui';
import { VoiceInput } from '@/components/VoiceInput';
import type { FormValues } from './prefill';

type FieldName = 'counterparty' | 'story' | 'incident_date' | 'amount' | 'state';
const FIELD_ERROR_KEY: Record<string, FieldName> = {
  counterparty: 'counterparty',
  story: 'story',
  incident_date: 'incident_date',
  amount: 'amount',
  state: 'state',
};

interface Props {
  initial: FormValues;
  fromDocument: boolean;
  busy: boolean;
  onSubmit: (body: GrievanceRequest) => void;
}

/** Guided complaint form; validates with the shared schema before handing the body up. */
export function GrievanceForm({ initial, fromDocument, busy, onSubmit }: Props) {
  const { t, language } = useI18n();
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const today = new Date().toLocaleDateString('en-CA');

  const submit = (e: SyntheticEvent) => {
    e.preventDefault();
    const parsed = grievanceRequestSchema.safeParse({
      issue_type: values.issue_type,
      counterparty: values.counterparty,
      incident_date: values.incident_date || null,
      amount: values.amount.trim() === '' ? null : Number(values.amount),
      story: values.story,
      state: values.state || null,
      language,
      letter_language: values.letter_language,
    });
    const next: Partial<Record<FieldName, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = FIELD_ERROR_KEY[String(issue.path[0])];
        if (field) next[field] = t(`complaint.err.${field === 'incident_date' ? 'date' : field}`);
      }
    } else if (parsed.data.incident_date && parsed.data.incident_date > today) {
      next.incident_date = t('complaint.err.date');
    }
    setErrors(next);
    if (parsed.success && Object.keys(next).length === 0) onSubmit(parsed.data);
  };

  const errorList = Object.values(errors);

  /** Fills the form with a made-up, realistic case so the letter writer can be tried in one tap. */
  const fillSample = () => {
    const incident = '2026-10-14';
    setErrors({});
    setValues((v) => ({
      ...v,
      issue_type: 'unfair_deactivation',
      counterparty: t('complaint.sample.counterparty'),
      incident_date: incident > today ? today : incident,
      amount: '3250',
      story: t('complaint.sample.story'),
    }));
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="mb-5">
        <button type="button" className="btn" onClick={fillSample} disabled={busy}>
          <Sparkles aria-hidden="true" size={20} />
          {t('complaint.sample.btn')}
        </button>
        <p className="hint mt-1">{t('complaint.sample.hint')}</p>
      </div>
      {fromDocument && <p className="mb-4 rounded-xl border-2 border-lane bg-lane-soft p-3" role="note">{t('complaint.fromDoc')}</p>}
      {errorList.length > 0 && (
        <div role="alert" className="mb-4 rounded-xl border-2 border-alert bg-alert-soft p-4">
          <p className="font-bold text-alert">{t('complaint.err.title')}</p>
          <ul className="mt-1 list-disc pl-6">{errorList.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}

      <SelectField label={t('complaint.field.issue')} value={values.issue_type} onChange={(e) => set('issue_type', issueTypeSchema.catch('other').parse(e.target.value))}>
        {ISSUE_TYPES.map((id) => <option key={id} value={id}>{t(`complaint.issue.${id}`)}</option>)}
      </SelectField>

      <TextField
        label={t('complaint.field.counterparty')}
        hint={errors.counterparty ?? t('complaint.field.counterpartyHint')}
        maxLength={80}
        value={values.counterparty}
        aria-invalid={!!errors.counterparty}
        onChange={(e) => set('counterparty', e.target.value)}
      />

      <TextField
        type="date"
        label={t('complaint.field.date')}
        optional
        hint={errors.incident_date}
        max={today}
        value={values.incident_date}
        aria-invalid={!!errors.incident_date}
        onChange={(e) => set('incident_date', e.target.value)}
      />

      <TextField
        type="number"
        inputMode="decimal"
        min={0}
        max={1000000}
        label={t('complaint.field.amount')}
        optional
        hint={errors.amount}
        value={values.amount}
        aria-invalid={!!errors.amount}
        onChange={(e) => set('amount', e.target.value)}
      />

      <TextArea
        label={t('complaint.field.story')}
        hint={errors.story ?? t('complaint.field.storyHint')}
        placeholder={t('complaint.field.storyPlaceholder')}
        rows={7}
        maxLength={LIMITS.storyChars}
        value={values.story}
        aria-invalid={!!errors.story}
        onChange={(e) => set('story', e.target.value)}
      />
      <div className="-mt-2 mb-4 flex flex-wrap items-center justify-between gap-3">
        <VoiceInput
          language={language}
          disabled={busy}
          onText={(text) => setValues((v) => ({ ...v, story: `${v.story} ${text}`.trim().slice(0, LIMITS.storyChars) }))}
        />
        <p className="hint">{t('complaint.counter', { count: values.story.length, max: LIMITS.storyChars })}</p>
      </div>

      <SelectField label={t('complaint.field.state')} optional hint={errors.state} value={values.state} aria-invalid={!!errors.state} onChange={(e) => set('state', e.target.value)}>
        <option value="">{t('common.choose')}</option>
        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </SelectField>

      <fieldset className="mb-5">
        <legend className="label">{t('complaint.field.letterLanguage')}</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {(['en', 'same'] as const).map((opt) => (
            <label key={opt} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 border-asphalt bg-paper px-4">
              <input type="radio" name="letter_language" className="size-5" value={opt} checked={values.letter_language === opt} onChange={() => set('letter_language', opt)} />
              {t(`complaint.letter.${opt}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('complaint.drafting') : t('complaint.submit')}</button>
    </form>
  );
}

