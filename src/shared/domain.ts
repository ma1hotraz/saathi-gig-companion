import { z } from 'zod';

/** Languages the AI can answer in. UI strings exist for a subset (see src/web/i18n). */
export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', bcp47: 'en-IN' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', bcp47: 'hi-IN' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', bcp47: 'bn-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', bcp47: 'ta-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', bcp47: 'te-IN' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', bcp47: 'mr-IN' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', bcp47: 'kn-IN' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', bcp47: 'gu-IN' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', bcp47: 'ml-IN' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', bcp47: 'pa-IN' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', bcp47: 'or-IN' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as [LanguageCode, ...LanguageCode[]];
export const languageSchema = z.enum(LANGUAGE_CODES);

export function languageName(code: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? 'English';
}

export const WORK_TYPES = ['delivery', 'ride_driver', 'daily_wage', 'domestic', 'other'] as const;
export const workTypeSchema = z.enum(WORK_TYPES);
export type WorkType = z.infer<typeof workTypeSchema>;

export const AGE_BANDS = ['18-25', '26-40', '41-59', '60+'] as const;
export const ageBandSchema = z.enum(AGE_BANDS);

export const INCOME_BANDS = ['lt_10k', '10k_20k', '20k_40k', 'gt_40k'] as const;
export const incomeBandSchema = z.enum(INCOME_BANDS);

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;
export const stateSchema = z.enum(INDIAN_STATES);

export const profileSchema = z.object({
  display_name: z.string().trim().max(60).nullable(),
  language: languageSchema,
  state: stateSchema.nullable(),
  work_type: workTypeSchema.nullable(),
  age_band: ageBandSchema.nullable(),
  income_band: incomeBandSchema.nullable(),
});
export type Profile = z.infer<typeof profileSchema>;

/** Earnings entry as stored in Supabase (user_id/id/created_at are server-managed). */
export const earningInputSchema = z.object({
  entry_date: z.iso.date(),
  platform: z.string().trim().min(1).max(40),
  amount_in: z.number().min(0).max(1_000_000),
  expenses: z.number().min(0).max(1_000_000),
  hours: z.number().min(0).max(24),
  trips: z.number().int().min(0).max(1000),
  notes: z.string().trim().max(300).nullable(),
  source: z.enum(['manual', 'voice', 'screenshot']),
});
export type EarningInput = z.infer<typeof earningInputSchema>;
export type Earning = EarningInput & { id: string; created_at: string };

export const ISSUE_TYPES = [
  'unpaid_wages',
  'unfair_deactivation',
  'wrong_deduction',
  'payment_delay',
  'accident_no_support',
  'harassment',
  'unsafe_conditions',
  'other',
] as const;
export const issueTypeSchema = z.enum(ISSUE_TYPES);
export type IssueType = z.infer<typeof issueTypeSchema>;

export const SAFETY_SITUATIONS = [
  'night_shift',
  'heat',
  'rain_flood',
  'accident',
  'harassment',
  'online_fraud',
  'vehicle_breakdown',
  'customer_conflict',
] as const;
export const safetySituationSchema = z.enum(SAFETY_SITUATIONS);
export type SafetySituation = z.infer<typeof safetySituationSchema>;

/**
 * Emergency numbers (India), as listed in the government helpline directory
 * (https://www.india.gov.in/directory/helpline). Ambulance numbers vary by state, so the UI
 * tells users to also check their local number.
 */
export const HELPLINES = [
  { id: 'emergency', number: '112' },
  { id: 'ambulance', number: '102' },
  { id: 'cyber', number: '1930' },
  { id: 'women', number: '181' },
] as const;
export const HELPLINE_SOURCE = 'https://www.india.gov.in/directory/helpline';
