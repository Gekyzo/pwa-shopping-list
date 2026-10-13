import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem, toggleBought, activeItems, nextItems } from '../src/store.js';
import { interpret } from '../src/voice-commands.js';

let counter = 0;
const newId = () => `id-${++counter}`;

const build = (...specs) =>
  specs.reduce((state, [name, list = 'active', bought = false]) => {
    const { state: added } = addItem(state, name, list, newId);
    return bought ? toggleBought(added, added.items.at(-1).id).state : added;
  }, emptyState());

const say = (state, text, pending = null) => interpret(state, text, { pending, newId });

const names = (items) => items.map((item) => item.name);
const pendingNames = (state) => names(activeItems(state).filter((item) => !item.bought));

test('adds an item to Active', () => {
  const start = emptyState();
  const result = say(start, 'Añade leche');
  assert.deepEqual(pendingNames(result.state), ['Leche']);
  assert.equal(result.reply, 'Añadido a Actual: Leche.');
  assert.equal(result.pending, null);
  assert.deepEqual(start.items, []);
});

test('adds without the article and without the list words', () => {
  const result = say(emptyState(), 'apunta la leche a la lista');
  assert.deepEqual(pendingNames(result.state), ['Leche']);
});

test('adds several items in one command', () => {
  const result = say(emptyState(), 'Añade leche, pan y huevos');
  assert.deepEqual(pendingNames(result.state), ['Leche', 'Pan', 'Huevos']);
  assert.equal(result.reply, 'Añadido a Actual: Leche, Pan y Huevos.');
});

test('adds an item to Next', () => {
  const result = say(emptyState(), 'añade café para la próxima');
  assert.deepEqual(names(nextItems(result.state)), ['Café']);
  assert.deepEqual(pendingNames(result.state), []);
  assert.equal(result.reply, 'Añadido a Próxima: Café.');
});

test('an add of an item that is there already changes nothing', () => {
  const start = build(['Leche']);
  const result = say(start, 'añade leche');
  assert.equal(result.state, start);
  assert.equal(result.reply, 'Ya estaba en Actual: Leche.');
});

test('an add of a bought item makes it pending again', () => {
  const result = say(build(['Leche', 'active', true]), 'necesito leche');
  assert.deepEqual(pendingNames(result.state), ['Leche']);
  assert.equal(result.state.items.length, 1);
  assert.equal(result.reply, 'Añadido a Actual: Leche.');
});

test('an add finds the existing item without accent distinction', () => {
  const start = build(['Café']);
  const result = say(start, 'añade cafe');
  assert.equal(result.state, start);
});

test('reads the items that are left to buy', () => {
  const start = build(['Leche'], ['Pan'], ['Café', 'active', true]);
  const result = say(start, '¿Qué me falta por comprar?');
  assert.equal(result.state, start);
  assert.equal(result.reply, 'Te faltan 2 artículos: Leche y Pan.');
});

test('reads one item that is left', () => {
  assert.equal(say(build(['Leche']), 'qué queda').reply, 'Te falta 1 artículo: Leche.');
});

test('says that nothing is left', () => {
  assert.equal(say(build(['Leche', 'active', true]), 'lee la lista').reply, 'No te falta nada por comprar.');
});

test('reads the Next list', () => {
  const start = build(['Leche'], ['Arroz', 'next']);
  assert.equal(say(start, '¿qué hay en la próxima?').reply, 'En Próxima hay 1 artículo: Arroz.');
  assert.equal(say(build(['Leche']), 'qué hay para la próxima').reply, 'Próxima está vacía.');
});

test('marks an item as bought', () => {
  const start = build(['Leche'], ['Café']);
  const result = say(start, 'Marca el café como comprado');
  assert.deepEqual(pendingNames(result.state), ['Leche']);
  assert.equal(result.reply, '«Café» marcado. Te falta 1 artículo.');
  assert.equal(start.items[1].bought, false);
});

test('marks the last item and says that the list is complete', () => {
  assert.equal(say(build(['Café']), 'ya tengo café').reply, '«Café» marcado. No te falta nada más.');
});

test('marks an item by a part of its name', () => {
  const result = say(build(['Café molido'], ['Pan']), 'he comprado café');
  assert.deepEqual(pendingNames(result.state), ['Pan']);
});

test('does not mark an item twice', () => {
  const start = build(['Café', 'active', true]);
  const result = say(start, 'marca café');
  assert.equal(result.state, start);
  assert.equal(result.reply, '«Café» ya está marcado.');
});

test('says when the item is not in Active', () => {
  const start = build(['Leche']);
  const result = say(start, 'marca el café');
  assert.equal(result.state, start);
  assert.equal(result.reply, 'No encuentro «café» en Actual.');
});

test('asks which item when the name is ambiguous, then marks the answer', () => {
  const start = build(['Café molido'], ['Café en grano']);
  const question = say(start, 'marca el café');
  assert.equal(question.state, start);
  assert.equal(question.reply, '¿Cuál: Café molido o Café en grano?');
  assert.equal(question.pending.kind, 'choose');

  const answer = say(start, 'el molido', question.pending);
  assert.deepEqual(pendingNames(answer.state), ['Café en grano']);
  assert.equal(answer.pending, null);
});

test('an ambiguous name takes an ordinal as the answer', () => {
  const start = build(['Café molido'], ['Café en grano']);
  const question = say(start, 'marca el café');
  const answer = say(start, 'el segundo', question.pending);
  assert.deepEqual(pendingNames(answer.state), ['Café molido']);
});

test('an exact name is not ambiguous', () => {
  const result = say(build(['Café'], ['Café en grano']), 'marca café');
  assert.deepEqual(pendingNames(result.state), ['Café en grano']);
});

test('asks again when the answer does not select one item', () => {
  const start = build(['Café molido'], ['Café en grano']);
  const question = say(start, 'marca el café');
  const again = say(start, 'el descafeinado', question.pending);
  assert.equal(again.state, start);
  assert.deepEqual(again.pending, question.pending);
  assert.equal(again.reply, 'No te he entendido. ¿Cuál: Café molido o Café en grano?');
});

test('removes the mark of a bought item', () => {
  const result = say(build(['Café', 'active', true]), 'desmarca el café');
  assert.deepEqual(pendingNames(result.state), ['Café']);
  assert.equal(result.reply, '«Café» vuelve a estar por comprar.');
});

test('asks before a delete, then deletes on yes', () => {
  const start = build(['Leche'], ['Pan']);
  const question = say(start, 'borra la leche de la lista');
  assert.equal(question.state, start);
  assert.equal(question.reply, '¿Borro «Leche»? Di sí o no.');
  assert.equal(question.pending.kind, 'confirm');

  const answer = say(start, 'sí', question.pending);
  assert.deepEqual(names(answer.state.items), ['Pan']);
  assert.equal(answer.reply, '«Leche» borrado.');
  assert.equal(answer.pending, null);
});

test('does not delete on no', () => {
  const start = build(['Leche']);
  const question = say(start, 'elimina leche');
  const answer = say(start, 'no', question.pending);
  assert.equal(answer.state, start);
  assert.equal(answer.reply, 'Cancelado.');
  assert.equal(answer.pending, null);
});

test('asks again when the answer to a confirmation is not yes or no', () => {
  const start = build(['Leche']);
  const question = say(start, 'quita leche');
  const again = say(start, 'añade pan', question.pending);
  assert.equal(again.state, start);
  assert.deepEqual(again.pending, question.pending);
  assert.equal(again.reply, 'Di sí o no. ¿Borro «Leche»?');
});

test('a delete finds an item of Next', () => {
  const question = say(build(['Arroz', 'next']), 'borra arroz');
  assert.equal(question.reply, '¿Borro «Arroz»? Di sí o no.');
});

test('an ambiguous delete asks which item, then asks for a confirmation', () => {
  const start = build(['Café molido'], ['Café en grano']);
  const which = say(start, 'borra el café');
  const confirm = say(start, 'el primero', which.pending);
  assert.equal(confirm.state, start);
  assert.equal(confirm.reply, '¿Borro «Café molido»? Di sí o no.');
  const done = say(start, 'vale', confirm.pending);
  assert.deepEqual(names(done.state.items), ['Café en grano']);
});

test('asks before the end of the trip, then ends it on yes', () => {
  const start = build(['Leche', 'active', true], ['Pan'], ['Arroz', 'next']);
  const question = say(start, 'termina la compra');
  assert.equal(question.state, start);
  assert.equal(question.reply, 'Se va 1 artículo y vuelven 0. ¿Termino la compra?');

  const answer = say(start, 'sí', question.pending);
  assert.deepEqual(pendingNames(answer.state), ['Pan', 'Arroz']);
  assert.equal(answer.reply, 'Compra terminada.');
});

test('does not ask for the end of a trip that has nothing to end', () => {
  const start = build(['Leche']);
  const result = say(start, 'terminar compra');
  assert.equal(result.state, start);
  assert.equal(result.pending, null);
  assert.equal(result.reply, 'Nada que empezar: marca un artículo o añade uno a Próxima.');
});

test('a cancel word ends a pending question', () => {
  const start = build(['Café molido'], ['Café en grano']);
  const question = say(start, 'marca el café');
  const answer = say(start, 'cancela', question.pending);
  assert.equal(answer.state, start);
  assert.equal(answer.pending, null);
  assert.equal(answer.reply, 'Cancelado.');
});

test('gives help', () => {
  assert.match(say(emptyState(), 'ayuda').reply, /añade leche/);
});

test('says when it does not understand', () => {
  const start = build(['Leche']);
  const result = say(start, 'cuéntame un chiste');
  assert.equal(result.state, start);
  assert.equal(result.pending, null);
  assert.match(result.reply, /^No te he entendido\./);
});

test('says when it hears nothing', () => {
  assert.match(say(emptyState(), '   ').reply, /^No te he entendido\./);
});
