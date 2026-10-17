import { useCallback, useEffect, useRef, useState } from 'react';
import { LIMITS, type ChatAction, type Source } from '@shared/api';
import { streamChat, ApiRequestError } from '@/lib/api';
import { useI18n } from '@/i18n';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
  actions?: ChatAction[];
}

const STORAGE_KEY = 'saathi.chat.v1';

function load(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function save(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* storage blocked or full: the chat still works for this view */
  }
}

/** Builds the request turns: non-empty, last 20, starting with a user turn. */
function toRequest(history: ChatMessage[]) {
  const turns = history
    .filter((m) => m.text.trim().length > 0)
    .slice(-LIMITS.chatMessages)
    .map((m) => ({ role: m.role, text: m.text.slice(0, LIMITS.chatTextChars) }));
  while (turns.length > 0 && turns[0]?.role !== 'user') turns.shift();
  return turns;
}

const newId = () => crypto.randomUUID();

/** Chat state: persisted conversation, streaming, stop, retry and reset. */
export function useChat(includeEarningsContext: boolean) {
  const { language, t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>(load);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!streaming) save(messages);
  }, [messages, streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const patchLast = useCallback((fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? fn(m) : m)));
  }, []);

  /** Streams a model answer for `history`, which must end with a user message. */
  const run = useCallback(
    async (history: ChatMessage[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setError(null);
      setStreaming(true);
      setMessages([...history, { id: newId(), role: 'model', text: '' }]);
      try {
        await streamChat(
          { messages: toRequest(history), language, includeEarningsContext },
          (event) => {
            if (event.type === 'delta') patchLast((m) => ({ ...m, text: m.text + event.text }));
            else if (event.type === 'sources') patchLast((m) => ({ ...m, sources: event.sources }));
            else if (event.type === 'action') patchLast((m) => ({ ...m, actions: [...(m.actions ?? []), event.action] }));
            else if (event.type === 'error') setError(event.message || t('common.error'));
          },
          controller.signal,
        );
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof ApiRequestError ? err.message : t('common.error'));
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setStreaming(false);
          // An empty placeholder (stopped or failed before any text) is not a message.
          setMessages((prev) => prev.filter((m, i) => !(i === prev.length - 1 && m.role === 'model' && !m.text && !m.actions?.length)));
        }
      }
    },
    [language, includeEarningsContext, patchLast, t],
  );

  const send = useCallback(
    (text: string) => {
      const clean = text.trim().slice(0, LIMITS.chatTextChars);
      if (!clean || streaming) return;
      void run([...messages, { id: newId(), role: 'user', text: clean }]);
    },
    [messages, streaming, run],
  );

  const retry = useCallback(() => {
    const lastUser = messages.map((m) => m.role).lastIndexOf('user');
    if (lastUser >= 0) void run(messages.slice(0, lastUser + 1));
  }, [messages, run]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setError(null);
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
  }, []);

  return { messages, streaming, error, send, retry, stop, reset };
}
