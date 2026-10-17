import { describe, expect, it } from 'vitest';
import { summarizeEarnings } from '../../src/shared/earnings.js';
import { sampleEarning } from '../helpers.js';

describe('summarizeEarnings', () => {
  it('returns zeros and null net-per-hour for no data', () => {
    expect(summarizeEarnings([])).toMatchObject({ net: 0, hours: 0, netPerHour: null, byPlatform: [], byDay: [] });
  });

  it('computes net, per-hour, and ranks platforms by net', () => {
    const s = summarizeEarnings([
      sampleEarning(),
      sampleEarning({ platform: 'Zomato', amount_in: 2000, expenses: 100, hours: 4 }),
      sampleEarning({ entry_date: '2026-10-11', amount_in: 500, expenses: 50, hours: 2 }),
    ]);
    expect(s.totalIn).toBe(3500);
    expect(s.totalExpenses).toBe(350);
    expect(s.net).toBe(3150);
    expect(s.netPerHour).toBe(225);
    expect(s.byPlatform.map((p) => p.platform)).toEqual(['Zomato', 'Swiggy']);
    expect(s.byDay).toEqual([{ date: '2026-10-10', net: 2700 }, { date: '2026-10-11', net: 450 }]);
  });

  it('avoids floating point noise', () => {
    const s = summarizeEarnings([sampleEarning({ amount_in: 0.1, expenses: 0 }), sampleEarning({ amount_in: 0.2, expenses: 0 })]);
    expect(s.net).toBe(0.3);
  });
});
