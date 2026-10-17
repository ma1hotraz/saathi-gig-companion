import { z } from 'zod';
import {
  earningInputSchema,
  issueTypeSchema,
  languageSchema,
  safetySituationSchema,
  ageBandSchema,
  incomeBandSchema,
  stateSchema,
  workTypeSchema,
} from './domain.js';

/** Hard limits shared by the client (to fail early) and the server (to enforce). */
export const LIMITS = {
  chatMessages: 20,
  chatTextChars: 2000,
  storyChars: 3000,
  questionChars: 600,
  uploadBytes: 8 * 1024 * 1024,
  audioBytes: 2 * 1024 * 1024,
} as const;

export const sourceSchema = z.object({ title: z.string(), url: z.url() });
export type Source = z.infer<typeof sourceSchema>;

/** Error body returned by every failing API route. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      'bad_request',
      'unauthorized',
      'too_large',
      'unsupported_media',
      'rate_limited',
      'ai_unavailable',
      'internal',
    ]),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

// ---------- Chat (SSE) ----------
export const chatActionNames = [
  'log_earning',
  'draft_grievance',
  'find_schemes',
  'explain_document',
  'safety_help',
] as const;
export const chatActionSchema = z.object({
  name: z.enum(chatActionNames),
  args: z.record(z.string(), z.union([z.string(), z.number()])),
});
export type ChatAction = z.infer<typeof chatActionSchema>;

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().trim().min(1).max(LIMITS.chatTextChars),
      }),
    )
    .min(1)
    .max(LIMITS.chatMessages),
  language: languageSchema,
  includeEarningsContext: z.boolean().default(false),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'sources'; sources: Source[] }
  | { type: 'action'; action: ChatAction }
  | { type: 'done' }
  | { type: 'error'; message: string };

// ---------- Earnings ----------
export const earningsExtractResultSchema = z.object({
  transcript: z.string().nullable(),
  entries: z.array(earningInputSchema).max(10),
});
export type EarningsExtractResult = z.infer<typeof earningsExtractResultSchema>;

export const earningsExtractTextSchema = z.object({
  text: z.string().trim().min(1).max(LIMITS.chatTextChars),
  language: languageSchema,
});

export const insightsRequestSchema = z.object({ language: languageSchema });
export const insightsResultSchema = z.object({
  insights: z.string(),
  stats: z.object({
    days: z.number(),
    totalIn: z.number(),
    totalExpenses: z.number(),
    net: z.number(),
    hours: z.number(),
    netPerHour: z.number().nullable(),
  }),
});
export type InsightsResult = z.infer<typeof insightsResultSchema>;

// ---------- Safety ----------
export const safetyRequestSchema = z.object({
  situation: safetySituationSchema,
  work_type: workTypeSchema.nullable(),
  state: stateSchema.nullable(),
  language: languageSchema,
});
export const safetyResultSchema = z.object({
  summary: z.string(),
  do_now: z.array(z.string()).min(1),
  avoid: z.array(z.string()),
  get_help: z.array(z.string()),
  sources: z.array(sourceSchema),
});
export type SafetyResult = z.infer<typeof safetyResultSchema>;

// ---------- Schemes ----------
export const schemesRequestSchema = z.object({
  state: stateSchema.nullable(),
  work_type: workTypeSchema.nullable(),
  age_band: ageBandSchema.nullable(),
  income_band: incomeBandSchema.nullable(),
  language: languageSchema,
});
export const schemeSchema = z.object({
  name: z.string(),
  level: z.enum(['central', 'state']),
  benefit: z.string(),
  who_can_apply: z.string(),
  documents_needed: z.array(z.string()),
  how_to_apply: z.string(),
  official_url: z.url().nullable(),
});
export const schemesResultSchema = z.object({
  intro: z.string(),
  schemes: z.array(schemeSchema),
  sources: z.array(sourceSchema),
});
export type SchemesResult = z.infer<typeof schemesResultSchema>;
export type Scheme = z.infer<typeof schemeSchema>;

// ---------- Documents ----------
export const documentAnalysisSchema = z.object({
  document_type: z.string(),
  plain_summary: z.string(),
  key_points: z.array(z.string()),
  deadlines: z.array(z.string()),
  money_involved: z.array(z.string()),
  red_flags: z.array(z.string()),
  next_steps: z.array(z.string()),
  suggest_complaint: z.boolean(),
});
export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

export const documentAskSchema = z.object({
  question: z.string().trim().min(1).max(LIMITS.questionChars),
  analysis: documentAnalysisSchema,
  language: languageSchema,
});
export const documentAskResultSchema = z.object({ answer: z.string() });

// ---------- Grievance ----------
export const grievanceRequestSchema = z.object({
  issue_type: issueTypeSchema,
  counterparty: z.string().trim().min(1).max(80),
  incident_date: z.iso.date().nullable(),
  amount: z.number().min(0).max(1_000_000).nullable(),
  story: z.string().trim().min(10).max(LIMITS.storyChars),
  state: stateSchema.nullable(),
  language: languageSchema,
  letter_language: z.enum(['en', 'same']),
});
export type GrievanceRequest = z.infer<typeof grievanceRequestSchema>;

export const grievanceResultSchema = z.object({
  letter: z.string(),
  summary: z.string(),
  where_to_file: z.array(z.object({ place: z.string(), why: z.string() })),
  evidence_checklist: z.array(z.string()),
});
export type GrievanceResult = z.infer<typeof grievanceResultSchema>;

// ---------- Speech ----------
export const transcribeResultSchema = z.object({ text: z.string() });
