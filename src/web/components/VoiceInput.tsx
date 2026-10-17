import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import type { LanguageCode } from '@shared/domain';
import { api, ApiRequestError } from '@/lib/api';
import { useI18n } from '@/i18n';

type Status = 'idle' | 'recording' | 'transcribing';
const MAX_SECONDS = 60;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported(m));
}

interface Props {
  language: LanguageCode;
  /** Called with the transcript (never empty). */
  onText: (text: string) => void;
  disabled?: boolean;
}

/** Push-to-talk microphone button: records, sends audio to Gemini for transcription, returns text. */
export function VoiceInput({ language, onText, disabled }: Props) {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!pickMimeType();

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  if (!supported) return <p className="hint">{t('voice.unsupported')}</p>;

  async function start() {
    setMessage(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMessage(t('voice.denied'));
      return;
    }
    const mimeType = pickMimeType();
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.current = rec;
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      void transcribe(new Blob(chunks, { type: rec.mimeType }), rec.mimeType);
    };
    rec.start();
    setStatus('recording');
    timer.current = window.setTimeout(() => rec.state === 'recording' && rec.stop(), MAX_SECONDS * 1000);
  }

  async function transcribe(blob: Blob, mime: string) {
    setStatus('transcribing');
    try {
      const ext = mime.includes('mp4') ? 'm4a' : 'webm';
      const { text } = await api.transcribe(blob, `voice.${ext}`, language);
      if (text.trim()) onText(text.trim());
      else setMessage(t('voice.empty'));
    } catch (err) {
      setMessage(err instanceof ApiRequestError ? err.message : t('common.error'));
    } finally {
      setStatus('idle');
    }
  }

  function stop() {
    window.clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }

  return (
    <div>
      {status === 'recording' ? (
        <button type="button" className="btn btn-danger" onClick={stop}>
          <Square aria-hidden="true" size={18} fill="currentColor" /> {t('voice.stop')}
        </button>
      ) : (
        <button type="button" className="btn" onClick={() => void start()} disabled={disabled || status === 'transcribing'}>
          <Mic aria-hidden="true" size={20} /> {t('voice.start')}
        </button>
      )}
      <p className="hint mt-1" role="status" aria-live="polite">
        {status === 'recording' ? t('voice.listening') : status === 'transcribing' ? t('voice.transcribing') : (message ?? '')}
      </p>
    </div>
  );
}
