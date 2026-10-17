import { earningInputSchema, type EarningInput } from '@shared/domain';
import { toLocalIsoDate } from './dates';

/** An entry being edited: numbers stay as text so partial typing is never lost. */
export interface Draft {
  key: string;
  entry_date: string;
  platform: string;
  amount_in: string;
  expenses: string;
  hours: string;
  trips: string;
  notes: string;
  source: EarningInput['source'];
}

export type DraftField = 'entry_date' | 'platform' | 'amount_in' | 'expenses' | 'hours' | 'trips' | 'notes';

let counter = 0;
const nextKey = (): string => `draft-${(counter += 1)}`;

/** An empty manual draft dated today. */
export function emptyDraft(overrides: Partial<Draft> = {}): Draft {
  return {
    key: nextKey(),
    entry_date: toLocalIsoDate(new Date()),
    platform: '',
    amount_in: '',
    expenses: '',
    hours: '',
    trips: '',
    notes: '',
    source: 'manual',
    ...overrides,
  };
}

/** Turns an entry returned by the server into an editable draft. */
export function draftFromEntry(e: EarningInput): Draft {
  return {
    key: nextKey(),
    entry_date: e.entry_date,
    platform: e.platform,
    amount_in: String(e.amount_in),
    expenses: String(e.expenses),
    hours: String(e.hours),
    trips: String(e.trips),
    notes: e.notes ?? '',
    source: e.source,
  };
}

const toNumber = (s: string): number => (s.trim() === '' ? 0 : Number(s.replace(/,/g, '').trim()));

export type DraftResult = { ok: true; value: EarningInput } | { ok: false; field: DraftField | null };

/** Validates a draft with the shared schema; on failure reports the first bad field. */
export function parseDraft(d: Draft): DraftResult {
  const parsed = earningInputSchema.safeParse({
    entry_date: d.entry_date,
    platform: d.platform,
    amount_in: toNumber(d.amount_in),
    expenses: toNumber(d.expenses),
    hours: toNumber(d.hours),
    trips: toNumber(d.trips),
    notes: d.notes.trim() === '' ? null : d.notes,
    source: d.source,
  });
  if (parsed.success) return { ok: true, value: parsed.data };
  const first = parsed.error.issues[0]?.path[0];
  const fields: readonly string[] = ['entry_date', 'platform', 'amount_in', 'expenses', 'hours', 'trips', 'notes'];
  return { ok: false, field: typeof first === 'string' && fields.includes(first) ? (first as DraftField) : null };
}
