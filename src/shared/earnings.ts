import type { EarningInput } from './domain.js';

export interface PlatformTotal {
  platform: string;
  net: number;
  entries: number;
}

export interface EarningsSummary {
  days: number;
  totalIn: number;
  totalExpenses: number;
  net: number;
  hours: number;
  trips: number;
  netPerHour: number | null;
  byPlatform: PlatformTotal[];
  /** Net income per calendar day (YYYY-MM-DD), ascending. */
  byDay: Array<{ date: string; net: number }>;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Pure aggregation shared by the dashboard and the AI-insight route (single source of truth). */
export function summarizeEarnings(entries: readonly EarningInput[]): EarningsSummary {
  const platforms = new Map<string, PlatformTotal>();
  const days = new Map<string, number>();
  let totalIn = 0;
  let totalExpenses = 0;
  let hours = 0;
  let trips = 0;

  for (const e of entries) {
    const net = e.amount_in - e.expenses;
    totalIn += e.amount_in;
    totalExpenses += e.expenses;
    hours += e.hours;
    trips += e.trips;
    const key = e.platform.trim();
    const p = platforms.get(key) ?? { platform: key, net: 0, entries: 0 };
    p.net += net;
    p.entries += 1;
    platforms.set(key, p);
    days.set(e.entry_date, (days.get(e.entry_date) ?? 0) + net);
  }

  const net = totalIn - totalExpenses;
  return {
    days: days.size,
    totalIn: round2(totalIn),
    totalExpenses: round2(totalExpenses),
    net: round2(net),
    hours: round2(hours),
    trips,
    netPerHour: hours > 0 ? round2(net / hours) : null,
    byPlatform: [...platforms.values()]
      .map((p) => ({ ...p, net: round2(p.net) }))
      .sort((a, b) => b.net - a.net),
    byDay: [...days.entries()]
      .map(([date, n]) => ({ date, net: round2(n) }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
