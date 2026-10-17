import { useCallback, useEffect, useRef, useState } from 'react';
import { earningInputSchema, type Earning, type EarningInput } from '@shared/domain';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/i18n';
import { isoDaysAgo } from './dates';

const RECENT_COUNT = 20;
const COLUMNS = 'id, created_at, entry_date, platform, amount_in, expenses, hours, trips, notes, source';

interface EarningsData {
  /** Newest 20 entries. */
  recent: Earning[];
  /** Everything from the last 30 days (for the summary). */
  month: Earning[];
}

function parseRows(rows: unknown[] | null): Earning[] {
  const out: Earning[] = [];
  for (const row of rows ?? []) {
    const r = row as Record<string, unknown>;
    const parsed = earningInputSchema.safeParse({
      ...r,
      amount_in: Number(r.amount_in),
      expenses: Number(r.expenses),
      hours: Number(r.hours),
    });
    if (parsed.success && typeof r.id === 'string' && typeof r.created_at === 'string') {
      out.push({ ...parsed.data, id: r.id, created_at: r.created_at });
    }
  }
  return out;
}

/** Loads the user's earnings from Supabase and exposes insert/delete that refresh the data. */
export function useEarnings() {
  const { t } = useI18n();
  const [data, setData] = useState<EarningsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const controller = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setLoading(true);
    setError(null);
    const res = await supabase
      .from('earnings')
      .select(COLUMNS)
      .gte('entry_date', isoDaysAgo(29))
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500)
      .abortSignal(ctrl.signal);
    if (ctrl.signal.aborted) return;
    if (res.error) {
      setError(t('earnings.loadError'));
    } else {
      const month = parseRows(res.data);
      setData({ recent: month.slice(0, RECENT_COUNT), month });
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void reload();
    return () => controller.current?.abort();
  }, [reload]);

  /** Inserts validated rows; resolves to an error message or null. user_id is set by the database. */
  const add = useCallback(
    async (rows: EarningInput[]): Promise<string | null> => {
      const { error: insertError } = await supabase.from('earnings').insert(rows);
      if (insertError) return t('earnings.saveError');
      await reload();
      return null;
    },
    [reload, t],
  );

  const remove = useCallback(
    async (id: string): Promise<string | null> => {
      const { error: deleteError } = await supabase.from('earnings').delete().eq('id', id);
      if (deleteError) return t('earnings.deleteError');
      await reload();
      return null;
    },
    [reload, t],
  );

  return { data, error, loading, reload, add, remove };
}
