/**
 * Resets the shared demo account to a clean, ready-to-demo state: profile filled in (so the
 * walkthrough skips setup) and no saved earnings or complaints.
 * Run: npx tsx --env-file=.env scripts/prepare-demo.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
});

const email = process.env.VITE_DEMO_EMAIL;
const password = process.env.VITE_DEMO_PASSWORD;
if (!email || !password) throw new Error('Set VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD in .env');

const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) throw new Error(`Demo sign-in failed: ${error.message}`);
const id = data.user.id;

const results = await Promise.all([
  supabase.from('earnings').delete().eq('user_id', id),
  supabase.from('grievances').delete().eq('user_id', id),
  supabase.from('profiles').upsert({ id, display_name: 'Ravi', language: 'en', state: 'Karnataka', work_type: 'delivery', age_band: '26-40', income_band: '10k_20k' }),
]);
const failed = results.find((r) => r.error);
if (failed?.error) throw new Error(failed.error.message);
console.log('Demo account is clean and ready (profile set, no saved data).');
