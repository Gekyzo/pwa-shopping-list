import * as store from './store.js';

const LIST_LABELS = { active: 'Actual', next: 'Próxima' };
const NAME_MAX = 80;
// More matches than this are not read as a question.
const CHOICE_MAX = 4;

const HELP = 'Di, por ejemplo: añade leche, qué me falta, marca el café o borra el pan.';
const UNKNOWN = `No te he entendido. ${HELP}`;
const CANCELLED = 'Cancelado.';
const FINISH_QUESTION = '¿Termino la compra?';

// These two test a folded text: no case and no accent.
const YES = /^(si|vale|claro|adelante|hazlo|confirmo|ok|okay|de acuerdo|venga)\b/;
const NO = /^(no|cancela|cancelar|dejalo|olvidalo|nada)\b/;
const ORDINALS = [/\bprimer[oa]?\b/, /\bsegund[oa]\b/, /\btercer[oa]?\b/, /\bcuart[oa]\b/];

const ARTICLE = /^(el|la|los|las|un|una|unos|unas)\s+/i;
const TO_NEXT = /\s+(a|en|para)\s+(la\s+)?(lista\s+)?(de\s+la\s+)?pr[oó]xima(\s+(compra|vez))?$/i;
const TO_ACTIVE = /\s+((a|en)\s+(la|mi)\s+lista(\s+de\s+la\s+compra)?|(a|en|para)\s+(hoy|actual))$/i;
const FROM_LIST = /\s+de\s+(la|mi)\s+lista$/i;
const AS_BOUGHT = /\s+como\s+comprad[oa]s?$/i;
const SEPARATOR = /\s*,\s*|\s+y\s+/i;

const done = (state, reply, pending = null) => ({ state, reply, pending });

const countOf = (count) => `${count} ${count === 1 ? 'artículo' : 'artículos'}`;

const joined = (names, last) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${last} ${names.at(-1)}`;

const namesOf = (items) => items.map((item) => item.name);

const quoted = (name) => `«${name}»`;

const phraseOf = (raw, ...suffixes) =>
  suffixes
    .reduce((text, suffix) => text.replace(suffix, ''), raw)
    .replace(ARTICLE, '')
    .trim();

// The items that a spoken name selects: the exact name, or else each name that contains it.
const matchItems = (items, phrase) => {
  const key = store.fold(phrase);
  if (!key) return [];
  const exact = items.filter((item) => store.fold(item.name) === key);
  return exact.length ? exact : items.filter((item) => store.fold(item.name).includes(key));
};

const leftText = (state) => {
  const { left } = store.tripSummary(state);
  return left === 0 ? 'No te falta nada más.' : `Te ${left === 1 ? 'falta' : 'faltan'} ${countOf(left)}.`;
};

const deleteQuestion = (item) => `¿Borro ${quoted(item.name)}?`;

// What a command does with the one item that it selected.
const ACTIONS = {
  mark: (state, item) => {
    const result = store.toggleBought(state, item.id);
    return result.error ? done(state, result.error) : done(result.state, `${quoted(item.name)} marcado. ${leftText(result.state)}`);
  },
  unmark: (state, item) => {
    const result = store.toggleBought(state, item.id);
    return result.error ? done(state, result.error) : done(result.state, `${quoted(item.name)} vuelve a estar por comprar.`);
  },
  delete: (state, item) =>
    done(state, `${deleteQuestion(item)} Di sí o no.`, { kind: 'confirm', action: 'delete', id: item.id }),
};

const choiceQuestion = (items) => `¿Cuál: ${joined(namesOf(items), 'o')}?`;

const select = (state, action, matches, missing) => {
  if (matches.length === 0) return done(state, missing);
  if (matches.length === 1) return ACTIONS[action](state, matches[0]);
  if (matches.length > CHOICE_MAX) return done(state, `Hay ${matches.length} artículos con ese nombre. Di el nombre completo.`);
  return done(state, choiceQuestion(matches), { kind: 'choose', action, ids: matches.map((item) => item.id) });
};

const inActive = (state, bought) => state.items.filter((item) => item.list === 'active' && item.bought === bought);

const mark = (state, raw) => {
  const phrase = phraseOf(raw, AS_BOUGHT);
  const matches = matchItems(inActive(state, false), phrase);
  if (matches.length) return select(state, 'mark', matches);
  const [bought] = matchItems(inActive(state, true), phrase);
  return done(state, bought ? `${quoted(bought.name)} ya está marcado.` : `No encuentro ${quoted(phrase)} en Actual.`);
};

const unmark = (state, raw) => {
  const phrase = phraseOf(raw);
  return select(state, 'unmark', matchItems(inActive(state, true), phrase), `No encuentro ${quoted(phrase)} entre los comprados.`);
};

const askDelete = (state, raw) => {
  const phrase = phraseOf(raw, FROM_LIST);
  return select(state, 'delete', matchItems(state.items, phrase), `No encuentro ${quoted(phrase)} en la lista.`);
};

const nameOf = (raw) => {
  const name = raw.replace(ARTICLE, '').trim().slice(0, NAME_MAX);
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// An item that exists already goes to the list in place of a duplicate, as in the add sheet.
const add = (state, raw, { newId }) => {
  const list = TO_NEXT.test(raw) ? 'next' : 'active';
  const names = raw.replace(TO_NEXT, '').replace(TO_ACTIVE, '').split(SEPARATOR).map(nameOf).filter(Boolean);
  if (!names.length) return done(state, UNKNOWN);
  const start = { state, added: [], already: [], errors: [] };
  const { state: next, added, already, errors } = names.reduce((sum, name) => {
    const key = store.fold(name);
    const existing = sum.state.items.find((item) => store.fold(item.name) === key);
    const result = existing ? store.bringToList(sum.state, existing.id, list) : store.addItem(sum.state, name, list, newId);
    if (result.error) return { ...sum, errors: [...sum.errors, result.error] };
    if (existing && !result.changed) return { ...sum, already: [...sum.already, existing.name] };
    return { ...sum, state: result.state, added: [...sum.added, existing?.name ?? name] };
  }, start);
  const label = LIST_LABELS[list];
  const reply = [
    added.length ? `Añadido a ${label}: ${joined(added, 'y')}.` : null,
    already.length ? `Ya estaba en ${label}: ${joined(already, 'y')}.` : null,
    ...errors,
  ].filter(Boolean);
  return done(next, reply.join(' '));
};

const readActive = (state) => {
  const left = store.activeItems(state).filter((item) => !item.bought);
  if (!left.length) return done(state, 'No te falta nada por comprar.');
  return done(state, `Te ${left.length === 1 ? 'falta' : 'faltan'} ${countOf(left.length)}: ${joined(namesOf(left), 'y')}.`);
};

const readNext = (state) => {
  const next = store.nextItems(state);
  if (!next.length) return done(state, 'Próxima está vacía.');
  return done(state, `En Próxima hay ${countOf(next.length)}: ${joined(namesOf(next), 'y')}.`);
};

const askFinish = (state) => {
  if (!store.canStartNewShopping(state)) return done(state, store.startNewShopping(state).error);
  const { gone, back } = store.tripSummary(state);
  const summary = `${gone === 1 ? 'Se va' : 'Se van'} ${countOf(gone)} y ${back === 1 ? 'vuelve' : 'vuelven'} ${back}.`;
  return done(state, `${summary} ${FINISH_QUESTION}`, { kind: 'confirm', action: 'finish' });
};

const help = (state) => done(state, HELP);

// The first pattern that matches the text runs. `name` is the part that the command works on.
const COMMANDS = [
  [/^(ayuda|qu[eé]\s+puedes\s+hacer)$/i, help],
  [/^(termina|terminar|acaba|acabar|finaliza|finalizar)\s+(la\s+|mi\s+)?compra$/i, askFinish],
  [/^qu[eé]\s+(hay|tengo|queda)\s+(en|para)\s+(la\s+)?pr[oó]xima/i, readNext],
  [/^(qu[eé]\s+(me\s+)?(falta|queda|hay|tengo)|(lee|l[eé]eme|dime)\s+(la|mi)\s+lista|cu[aá]nt[oa]s?\s.*(falta|queda))/i, readActive],
  [/^(desmarca|desmarcar)\s+(?<name>.+)$/i, unmark],
  [/^(marca|marcar|tacha|tachar|ya\s+tengo|ya\s+he\s+comprado|he\s+comprado|he\s+cogido)\s+(?<name>.+)$/i, mark],
  [/^(borra|borrar|elimina|eliminar|quita|quitar)\s+(?<name>.+)$/i, askDelete],
  [/^(a[ñn]ade|a[ñn]adir|agrega|agregar|apunta|apuntar|pon|poner|mete|meter|necesito|falta|faltan|compra|comprar)\s+(?<name>.+)$/i, add],
];

const confirmed = (state, pending) => {
  if (pending.action === 'finish') {
    const result = store.startNewShopping(state);
    return done(result.state, result.error ?? 'Compra terminada.');
  }
  const item = state.items.find((entry) => entry.id === pending.id);
  const result = store.deleteItem(state, pending.id);
  return done(result.state, result.error ?? `${quoted(item.name)} borrado.`);
};

const questionOf = (state, pending) => {
  if (pending.action === 'finish') return FINISH_QUESTION;
  const item = state.items.find((entry) => entry.id === pending.id);
  return item ? deleteQuestion(item) : '';
};

// The answer to the question that the last reply asked.
const answer = (state, text, pending) => {
  const key = store.fold(text);
  if (NO.test(key)) return done(state, CANCELLED);
  if (pending.kind === 'confirm') {
    return YES.test(key) ? confirmed(state, pending) : done(state, `Di sí o no. ${questionOf(state, pending)}`.trim(), pending);
  }
  const options = pending.ids.map((id) => state.items.find((item) => item.id === id)).filter(Boolean);
  const index = ORDINALS.findIndex((ordinal) => ordinal.test(key));
  const matches = index >= 0 ? options.slice(index, index + 1) : matchItems(options, phraseOf(text));
  if (matches.length !== 1) return done(state, `No te he entendido. ${choiceQuestion(options)}`, pending);
  return ACTIONS[pending.action](state, matches[0]);
};

// Runs one spoken command. Answers `{ state, reply, pending }`: `reply` is the text to say, and
// `pending` is the question that the next command answers, or null.
export const interpret = (state, rawText, { pending = null, newId } = {}) => {
  const text = String(rawText ?? '')
    .normalize('NFC')
    .replace(/[¿?¡!.;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (pending) return answer(state, text, pending);
  const command = COMMANDS.map(([pattern, run]) => [text.match(pattern), run]).find(([match]) => match);
  if (!command) return done(state, UNKNOWN);
  const [match, run] = command;
  return run(state, match.groups?.name ?? '', { newId });
};
