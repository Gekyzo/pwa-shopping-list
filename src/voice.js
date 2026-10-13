const LANG = 'es-ES';

const NO_SPEECH = 'No he oído nada.';
const NO_MICROPHONE = 'El micrófono no está disponible.';
const NOT_ALLOWED = 'Permite el micrófono para usar la voz.';

const ERRORS = {
  'not-allowed': NOT_ALLOWED,
  'service-not-allowed': NOT_ALLOWED,
  'audio-capture': NO_MICROPHONE,
  'no-speech': NO_SPEECH,
  // Chrome sends the audio to a server: without a connection the recognition fails.
  network: 'El reconocimiento de voz necesita conexión.',
};

// The speech classes of the browser are parameters, so the tests pass fakes.
export const createVoice = ({ Recognition = null, synth = null, Utterance = null, lang = LANG } = {}) => {
  let stopListening = null;
  let stopSpeaking = null;

  // Answers `{ text }`, or `{ error }` with a message for the user. A stop gives `{ error: null }`.
  const listen = () =>
    new Promise((resolve) => {
      if (!Recognition) {
        resolve({ error: 'Este navegador no reconoce la voz.' });
        return;
      }
      const recognition = new Recognition();
      let outcome = null;
      Object.assign(recognition, { lang, interimResults: false, maxAlternatives: 1 });
      recognition.onresult = (event) => {
        const text = event.results[0]?.[0]?.transcript?.trim();
        if (text) outcome = { text };
      };
      recognition.onerror = (event) => {
        outcome ??= { error: event.error === 'aborted' ? null : (ERRORS[event.error] ?? 'No te he podido oír.') };
      };
      recognition.onend = () => {
        stopListening = null;
        resolve(outcome ?? { error: NO_SPEECH });
      };
      stopListening = () => {
        outcome ??= { error: null };
        recognition.abort();
      };
      try {
        recognition.start();
      } catch {
        stopListening = null;
        resolve({ error: NO_MICROPHONE });
      }
    });

  // Ends when the text is said, and also when the browser does not say it.
  const speak = (text) =>
    new Promise((resolve) => {
      if (!synth || !Utterance) {
        resolve();
        return;
      }
      const utterance = new Utterance(text);
      const finish = () => {
        stopSpeaking = null;
        resolve();
      };
      Object.assign(utterance, { lang, onend: finish, onerror: finish });
      stopSpeaking = () => {
        synth.cancel();
        finish();
      };
      synth.speak(utterance);
    });

  const stop = () => {
    stopListening?.();
    stopSpeaking?.();
  };

  return { supported: Boolean(Recognition), listen, speak, stop };
};
