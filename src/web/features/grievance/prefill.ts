import { LIMITS, type DocumentAnalysis } from '@shared/api';
import { issueTypeSchema, type IssueType } from '@shared/domain';

export interface FormValues {
  issue_type: IssueType;
  counterparty: string;
  incident_date: string;
  amount: string;
  story: string;
  state: string;
  letter_language: 'en' | 'same';
}

/** Whether the value is a DocumentAnalysis handed over by the Documents page. */
function isAnalysis(value: unknown): value is DocumentAnalysis {
  return typeof value === 'object' && value !== null && typeof (value as DocumentAnalysis).plain_summary === 'string';
}

/** Reads `location.state.fromDocument`, if present and well formed. */
export function documentFromState(state: unknown): DocumentAnalysis | null {
  if (typeof state !== 'object' || state === null) return null;
  const doc = (state as { fromDocument?: unknown }).fromDocument;
  return isAnalysis(doc) ? doc : null;
}

/** Builds the story text from a document analysis so the worker only has to check it. */
export function storyFromDocument(doc: DocumentAnalysis): string {
  const parts = [doc.plain_summary, ...doc.red_flags, ...doc.money_involved];
  return parts.filter(Boolean).join('\n').slice(0, LIMITS.storyChars);
}

/** Initial form values from profile, optional document and optional query params. */
export function initialValues(profileState: string | null, doc: DocumentAnalysis | null, params: URLSearchParams): FormValues {
  const issue = issueTypeSchema.safeParse(params.get('issue_type'));
  return {
    issue_type: issue.success ? issue.data : 'other',
    counterparty: (params.get('counterparty') ?? '').slice(0, 80),
    incident_date: '',
    amount: '',
    story: doc ? storyFromDocument(doc) : '',
    state: profileState ?? '',
    letter_language: 'en',
  };
}
