import { SAFETY_SITUATIONS, languageName, type LanguageCode } from '../../../shared/domain.js';
import { baseRules } from './common.js';

const SITUATION_TEXT: Record<(typeof SAFETY_SITUATIONS)[number], string> = {
  night_shift: 'working late at night',
  heat: 'working in extreme heat',
  rain_flood: 'working in heavy rain or flooded roads',
  accident: 'a road accident has just happened to me',
  harassment: 'someone is harassing or threatening me at work',
  online_fraud: 'someone is trying to cheat me online (fake calls, OTP or UPI fraud)',
  vehicle_breakdown: 'my vehicle has broken down on the road',
  customer_conflict: 'a customer is angry or aggressive with me',
};

export const situationText = (s: (typeof SAFETY_SITUATIONS)[number]): string => SITUATION_TEXT[s];

export function earningsExtractPrompt(language: LanguageCode, today: string): string {
  return [
    baseRules(language),
    `Task: read what the worker said or showed and extract earning entries. Today's date is ${today}.`,
    'One entry per platform per day. "amount_in" is money earned; "expenses" is money spent on fuel, repairs, food or similar. Use 0 when a number is not given. Use null for notes when there is nothing worth noting.',
    'Use the platform name as the worker said it (for example Swiggy, Zomato, Uber, Ola, Rapido, Urban Company). Use "Other" if none is named.',
    'Each entry is ONE day: "hours" must be 24 or less. If the input covers several days (for example a weekly payout summary), make one entry dated the last day of that period, set "hours" to 0, keep the real trip count, and write the period and total hours in "notes" (for example "Week 6-12 Oct, 38.5 hours"). Never split totals across days.',
    'Resolve words like today, yesterday, kal, aaj to real dates. Never use a future date.',
    'If the input is audio, put the exact words spoken in "transcript". Otherwise set "transcript" to null. If there is no earning information, return an empty "entries" list.',
    'Set "source" to "manual" for every entry; the app corrects it.',
  ].join('\n');
}

export function insightsPrompt(language: LanguageCode): string {
  return [
    baseRules(language),
    "Task: you are given the worker's real earnings totals for the last 30 days as JSON. Explain them in 4 to 6 short sentences: what they earned after expenses, which platform paid best, and how much they make per hour.",
    'Then give exactly 2 practical tips that follow from these numbers (for example expenses that look high, or a better platform). Use only the numbers given; do not guess about days or data that are not there.',
    'Format: short paragraph, then a bullet list of the 2 tips.',
  ].join('\n');
}

export function safetyPrompt(language: LanguageCode): string {
  return [
    baseRules(language),
    'Task: give practical, calm safety guidance for the situation the worker describes. Keep every list item to one short sentence.',
    '"summary": 1 or 2 sentences. "do_now": 3 to 5 steps in order of importance. "avoid": 2 to 3 things not to do. "get_help": who to call or tell. India emergency number 112 may be mentioned; for online fraud mention helpline 1930. Do not state other phone numbers.',
  ].join('\n');
}

export function schemesPrompt(language: LanguageCode): string {
  return [
    baseRules(language),
    "Task: list government schemes and welfare benefits a worker with the given profile may be able to use. Base your answer on the official pages provided; only include schemes you are confident exist. Prefer up to 5 well-matched schemes over a long list.",
    'For each scheme: "benefit" says what the worker gets; "who_can_apply" says the eligibility in simple words; "documents_needed" lists documents; "how_to_apply" gives 1 or 2 simple steps; "level" is central or state.',
    'Set "official_url" only to one of the page URLs provided to you; otherwise null. "intro" is one short, encouraging sentence that says eligibility must be confirmed on the official site.',
    'Leave "sources" as an empty list; the app fills it in.',
  ].join('\n');
}

export function documentPrompt(language: LanguageCode): string {
  return [
    baseRules(language),
    'Task: the worker shared a document (photo or PDF) such as a notice, contract, deactivation message, payslip or insurance paper. Explain it so they can decide what to do.',
    '"document_type": a short name. "plain_summary": 2 to 4 short sentences. "key_points", "deadlines" (with dates, written the way the document gives them), "money_involved" (amount and what it is for), "red_flags" (unfair, unclear or risky terms), "next_steps" (what to do, in order). Use empty lists when nothing applies.',
    'Set "suggest_complaint" to true only if the document shows the worker may have been treated unfairly (for example a sudden deactivation, unpaid money, or a deduction without notice).',
    'If the file is not readable or not a document, say so in "plain_summary" and leave the lists empty.',
  ].join('\n');
}

export function documentAskPrompt(language: LanguageCode): string {
  return [
    baseRules(language),
    "Task: answer the worker's question using only the document analysis given below. If the answer is not in the analysis, say you cannot tell from the document and suggest who to ask. Keep it under 6 sentences.",
  ].join('\n');
}

export function grievancePrompt(language: LanguageCode, letterLanguage: 'en' | 'same'): string {
  const letterIn = letterLanguage === 'en' ? 'English' : languageName(language);
  return [
    baseRules(language),
    `Task: write a complaint letter for the worker. Write the "letter" in ${letterIn}. The "summary", "where_to_file" and "evidence_checklist" must be in ${languageName(language)}.`,
    'The letter must be polite, firm and factual: addressed to the grievance officer of the named company or employer, with the date, a clear subject line, what happened (only the facts given), the amount if given, what the worker asks for (payment, reinstatement, or a written reason), a reasonable deadline of 7 days, and a closing line. Use placeholders like [Your name] and [Your phone number] for details you do not have. Never invent facts, dates or ID numbers.',
    '"summary": 2 to 3 simple sentences on what the letter says. "where_to_file": 2 to 4 realistic places to send or escalate (the company grievance officer, the state Labour Department, the National Consumer Helpline (consumerhelpline.gov.in) for consumer-type issues, without stating a phone number, a legal aid clinic), each with one line on why. "evidence_checklist": 4 to 6 items the worker should keep (screenshots, payout statements, messages, ID, dates).',
  ].join('\n');
}

export function transcribePrompt(language: LanguageCode): string {
  return `Transcribe this audio exactly as spoken. The speaker most likely speaks ${languageName(language)} or Hinglish. Return only the transcript text, with no commentary. If the audio has no speech, return an empty string.`;
}

export function chatPrompt(language: LanguageCode, earningsContext: string | null): string {
  return [
    baseRules(language),
    'You are chatting with the worker. Be warm and brief (under 120 words unless they ask for more). Cover earnings, safety, rights and welfare schemes, documents, and complaint writing.',
    'When the worker clearly wants one of these actions, call the matching function so the app can open the right screen: log_earning, draft_grievance, find_schemes, explain_document, safety_help. After calling, add one short sentence telling them what you opened.',
    earningsContext
      ? `Their recent earnings (real data, last 30 days): ${earningsContext}. Use it only when relevant.`
      : 'You do not have their earnings data; if they ask about earnings, suggest logging entries in the Earnings tab.',
  ].join('\n');
}
