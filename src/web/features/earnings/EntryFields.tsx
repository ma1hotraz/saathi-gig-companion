import { useId } from 'react';
import { TextArea, TextField } from '@/components/ui';
import { useI18n } from '@/i18n';
import { toLocalIsoDate } from './dates';
import type { Draft, DraftField } from './draft';

const PLATFORMS = ['Swiggy', 'Zomato', 'Uber', 'Ola', 'Rapido', 'Blinkit', 'Zepto', 'Urban Company', 'Porter', 'Other'];

interface Props {
  draft: Draft;
  onChange: (field: DraftField, value: string) => void;
}

/** The seven editable fields of one earnings entry (used by the form and the review cards). */
export function EntryFields({ draft, onChange }: Props) {
  const { t } = useI18n();
  const listId = useId();
  const set = (field: DraftField) => (e: { target: { value: string } }) => onChange(field, e.target.value);
  return (
    <div>
      <TextField label={t('earnings.f.entry_date')} type="date" value={draft.entry_date} max={toLocalIsoDate(new Date())} onChange={set('entry_date')} required />
      <TextField label={t('earnings.f.platform')} list={listId} value={draft.platform} maxLength={40} onChange={set('platform')} autoComplete="off" required />
      <datalist id={listId}>
        {PLATFORMS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <TextField label={t('earnings.f.amount_in')} inputMode="decimal" value={draft.amount_in} onChange={set('amount_in')} placeholder="0" required />
      <TextField label={t('earnings.f.expenses')} hint={t('earnings.f.expensesHint')} inputMode="decimal" value={draft.expenses} onChange={set('expenses')} placeholder="0" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={t('earnings.f.hours')} hint={t('earnings.f.hoursHint')} inputMode="decimal" value={draft.hours} onChange={set('hours')} placeholder="0" />
        <TextField label={t('earnings.f.trips')} inputMode="numeric" value={draft.trips} onChange={set('trips')} placeholder="0" />
      </div>
      <TextArea label={t('earnings.f.notes')} optional value={draft.notes} maxLength={300} rows={2} onChange={set('notes')} />
    </div>
  );
}
