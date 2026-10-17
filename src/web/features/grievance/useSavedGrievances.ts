import { useCallback, useEffect, useState } from 'react';
import { issueTypeSchema, type IssueType } from '@shared/domain';
import { supabase } from '@/lib/supabase';

export interface SavedGrievance {
  id: string;
  issue_type: IssueType;
  counterparty: string;
  language: string;
  letter: string;
  summary: string | null;
  created_at: string;
}

type Row = Omit<SavedGrievance, 'issue_type'> & { issue_type: string };

/** Loads the newest 20 saved complaints and offers refresh/remove. `failed` is true on any DB error. */
export function useSavedGrievances() {
  const [items, setItems] = useState<SavedGrievance[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    const { data, error } = await supabase
      .from('grievances')
      .select('id,issue_type,counterparty,language,letter,summary,created_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .overrideTypes<Row[], { merge: false }>();
    if (error) {
      setFailed(true);
      return;
    }
    setItems(data.map((r) => ({ ...r, issue_type: issueTypeSchema.catch('other').parse(r.issue_type) })));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Returns true when the row was deleted. */
  const remove = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('grievances').delete().eq('id', id);
    if (error) return false;
    setItems((prev) => prev?.filter((g) => g.id !== id) ?? prev);
    return true;
  }, []);

  return { items, failed, reload: load, remove };
}
