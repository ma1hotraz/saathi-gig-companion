/**
 * Proves row-level security against the real Supabase project: one user's rows are invisible and
 * immutable to another user. Also creates (or signs in to) the shared judge account.
 * Run: npx tsx --env-file=.env scripts/verify-rls.ts
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? '';
const key = process.env.SUPABASE_ANON_KEY ?? '';
const fresh = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const JUDGE = { email: process.env.VITE_DEMO_EMAIL ?? '', password: process.env.VITE_DEMO_PASSWORD ?? '' };
if (!JUDGE.email || !JUDGE.password) throw new Error('Set VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD in .env');

function must<T>(label: string, value: T | null | undefined, error: { message: string } | null): T {
  if (error || value === null || value === undefined) throw new Error(`${label}: ${error?.message ?? 'no data'}`);
  return value;
}

let failures = 0;
const expect = (label: string, ok: boolean, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
};

const a = fresh();
const b = fresh();
const aAuth = await a.auth.signInAnonymously();
must('guest A', aAuth.data.user, aAuth.error);
const bAuth = await b.auth.signInAnonymously();
must('guest B', bAuth.data.user, bAuth.error);

const inserted = await a.from('earnings').insert({ platform: 'RLS-test', amount_in: 100, expenses: 10, hours: 1, trips: 1 }).select('id').single();
const rowId = must('insert as A', inserted.data?.id, inserted.error);

const asB = await b.from('earnings').select('id').eq('id', rowId);
expect('user B cannot read user A earnings', !asB.error && asB.data.length === 0, `rows seen: ${asB.data?.length}`);

const upd = await b.from('earnings').update({ amount_in: 999999 }).eq('id', rowId).select('id');
expect('user B cannot update user A earnings', !upd.error && upd.data.length === 0);

const del = await b.from('earnings').delete().eq('id', rowId).select('id');
expect('user B cannot delete user A earnings', !del.error && del.data.length === 0);

const forged = await b.from('earnings').insert({ user_id: (await a.auth.getUser()).data.user?.id, platform: 'forged', amount_in: 1, expenses: 0, hours: 0, trips: 0 });
expect('user B cannot insert a row owned by user A', forged.error !== null);

const bad = await a.from('earnings').insert({ platform: 'x', amount_in: -5, expenses: 0, hours: 0, trips: 0 });
expect('database rejects a negative amount (check constraint)', bad.error !== null);

const mine = await a.from('earnings').select('id').eq('id', rowId);
expect('user A can still read their own row', mine.data?.length === 1);
await a.from('earnings').delete().eq('id', rowId);

// Shared judge account (email + password).
const judge = fresh();
let signin = await judge.auth.signInWithPassword(JUDGE);
if (signin.error) {
  const created = await judge.auth.signUp(JUDGE);
  console.log(created.error ? `judge sign-up error: ${created.error.message}` : 'judge account created');
  signin = await judge.auth.signInWithPassword(JUDGE);
}
expect('demo account can sign in with email and password', !signin.error, signin.error?.message);

console.log(failures === 0 ? '\nRLS and judge-account checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
