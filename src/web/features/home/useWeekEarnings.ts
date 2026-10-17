import { useCallback, useEffect, useState } from 'react';
import { summarizeEarnings, type EarningsSummary } from '@shared/earnings';
import type { EarningInput } from '@shared/domain';
import { supabase } from '@/lib/supabase';

export interface WeekEarnings {
  today: EarningsSummary;
  week: EarningsSummary;
}

/** Local calendar date as YYYY-MM-DD (workers think in local days, not UTC). */
function localDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: WeekEarnings };

/** Loads the last 7 days of the worker's earnings and aggregates today and the week. */
export function useWeekEarnings(): { state: State; reload: () => void } {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void supabase
      .from('earnings')
      .select('entry_date,platform,amount_in,expenses,hours,trips,notes,source')
      .gte('entry_date', localDate(-6))
      .lte('entry_date', localDate(0))
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: 'error' });
          return;
        }
        const rows: EarningInput[] = data.map((r) => ({
          ...r,
          amount_in: Number(r.amount_in),
          expenses: Number(r.expenses),
          hours: Number(r.hours),
          trips: Number(r.trips),
        }));
        const today = localDate(0);
        setState({
          status: 'ready',
          data: {
            week: summarizeEarnings(rows),
            today: summarizeEarnings(rows.filter((r) => r.entry_date === today)),
          },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, reload };
}
