import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoice } from '../src/voice.js';

// A fake SpeechRecognition: `script` gets the instance at `start` and fires its events.
const recognitionOf = (script) =>
  class {
    start() {
      this.started = true;
      script(this);
    }

    abort() {
      this.onerror?.({ error: 'aborted' });
      this.onend?.();
    }
  };

const heard = (transcript) => ({ results: [[{ transcript }]] });

const fakeSynth = () => {
  const synth = {
    spoken: [],
    cancelled: 0,
    speak(utterance) {
      synth.spoken.push(utterance);
      queueMicrotask(() => utterance.onend?.());
    },
    cancel() {
      synth.cancelled += 1;
    },
  };
  return synth;
};

class Utterance {
  constructor(text) {
    this.text = text;
  }
}

test('is not supported without a recognition class', () => {
  assert.equal(createVoice({}).supported, false);
});

test('listen answers the text that the recognition hears, in Spanish', async () => {
  let instance;
  const Recognition = recognitionOf((recognition) => {
    instance = recognition;
    recognition.onresult(heard(' Añade leche '));
    recognition.onend();
  });
  const voice = createVoice({ Recognition });
  assert.equal(voice.supported, true);
  assert.deepEqual(await voice.listen(), { text: 'Añade leche' });
  assert.equal(instance.lang, 'es-ES');
});

test('listen answers a message when the microphone is not allowed', async () => {
  const Recognition = recognitionOf((recognition) => {
    recognition.onerror({ error: 'not-allowed' });
    recognition.onend();
  });
  assert.deepEqual(await createVoice({ Recognition }).listen(), {
    error: 'Permite el micrófono para usar la voz.',
  });
});

test('listen answers a message when the network is not available', async () => {
  const Recognition = recognitionOf((recognition) => {
    recognition.onerror({ error: 'network' });
    recognition.onend();
  });
  assert.deepEqual(await createVoice({ Recognition }).listen(), {
    error: 'El reconocimiento de voz necesita conexión.',
  });
});

test('listen answers a message when it hears nothing', async () => {
  const Recognition = recognitionOf((recognition) => recognition.onend());
  assert.deepEqual(await createVoice({ Recognition }).listen(), { error: 'No he oído nada.' });
});

test('listen answers a message when the recognition does not start', async () => {
  const Recognition = class {
    start() {
      throw new Error('busy');
    }
  };
  assert.deepEqual(await createVoice({ Recognition }).listen(), { error: 'El micrófono no está disponible.' });
});

test('listen answers a message without a recognition class', async () => {
  assert.deepEqual(await createVoice({}).listen(), { error: 'Este navegador no reconoce la voz.' });
});

test('stop ends a listen without a message', async () => {
  const Recognition = recognitionOf(() => {});
  const voice = createVoice({ Recognition, synth: fakeSynth(), Utterance });
  const listening = voice.listen();
  voice.stop();
  assert.deepEqual(await listening, { error: null });
});

test('speak says the text in Spanish and ends with the utterance', async () => {
  const synth = fakeSynth();
  const voice = createVoice({ synth, Utterance });
  await voice.speak('Hola');
  assert.equal(synth.spoken.length, 1);
  assert.equal(synth.spoken[0].text, 'Hola');
  assert.equal(synth.spoken[0].lang, 'es-ES');
});

test('speak ends when the synthesis fails', async () => {
  const synth = { speak: (utterance) => queueMicrotask(() => utterance.onerror?.({ error: 'not-allowed' })), cancel() {} };
  await createVoice({ synth, Utterance }).speak('Hola');
});

test('speak ends at once without a synthesis', async () => {
  await createVoice({}).speak('Hola');
});

test('stop ends a speak', async () => {
  const synth = { speak() {}, cancelled: 0, cancel() { synth.cancelled += 1; } };
  const voice = createVoice({ synth, Utterance });
  const speaking = voice.speak('Hola');
  voice.stop();
  await speaking;
  assert.equal(synth.cancelled, 1);
});
