import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { ChatAction } from '@shared/api';
import { useI18n } from '@/i18n';

const ARG_KEYS: Record<ChatAction['name'], string[]> = {
  log_earning: ['platform', 'amount'],
  draft_grievance: ['counterparty', 'issue_type'],
  find_schemes: [],
  explain_document: [],
  safety_help: ['situation'],
};

const PATHS: Record<ChatAction['name'], string> = {
  log_earning: '/earnings',
  draft_grievance: '/complaint',
  find_schemes: '/rights',
  explain_document: '/docs',
  safety_help: '/safety',
};

/** Builds the destination URL, carrying only the args the model actually supplied. */
export function actionHref(action: ChatAction): string {
  const params = new URLSearchParams();
  for (const key of ARG_KEYS[action.name]) {
    const value = action.args[key];
    if (value !== undefined && String(value).trim() !== '') params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${PATHS[action.name]}?${query}` : PATHS[action.name];
}

/** A suggested next step from Saathi, shown as a clearly labelled link to the right screen. */
export function ActionCard({ action }: { action: ChatAction }) {
  const { t } = useI18n();
  return (
    <div className="mt-3 rounded-xl border-2 border-asphalt bg-paper p-3">
      <p className="text-muted">{t(`chat.action.${action.name}.hint`)}</p>
      <Link to={actionHref(action)} className="btn btn-primary mt-2">
        {t(`chat.action.${action.name}.label`)} <ArrowRight aria-hidden="true" size={18} />
      </Link>
    </div>
  );
}
