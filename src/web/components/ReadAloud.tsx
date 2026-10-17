import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '@/i18n';

/** Reads text aloud with the phone's own voice. Hidden when no voice exists for the language. */
export function ReadAloud({ text }: { text: string }) {
  const { t, bcp47, language } = useI18n();
  const [available, setAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const check = () => setAvailable(speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(language)));
    check();
    speechSynthesis.addEventListener('voiceschanged', check);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', check);
      speechSynthesis.cancel();
    };
  }, [language]);

  if (!available) return null;

  function toggle() {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#>`]/g, ''));
    utterance.lang = bcp47;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(utterance);
  }

  return (
    <button type="button" className="btn" onClick={toggle} aria-pressed={speaking}>
      {speaking ? <VolumeX aria-hidden="true" size={20} /> : <Volume2 aria-hidden="true" size={20} />} {speaking ? t('speak.stop') : t('speak.listen')}
    </button>
  );
}
