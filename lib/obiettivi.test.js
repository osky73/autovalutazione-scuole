const test = require('node:test');
const assert = require('node:assert');
const { normalizzaObiettivi, OBIETTIVI } = require('./obiettivi');

test('tiene solo gli obiettivi noti, senza doppioni, nell\'ordine dell\'elenco', () => {
  const r = normalizzaObiettivi(['reputazione', 'x', 'iscrizioni', 'iscrizioni'], []);
  assert.deepStrictEqual(r.scelti, ['iscrizioni', 'reputazione']);
});
test('un solo valore (non array) è accettato; nessun valore dà liste vuote', () => {
  assert.deepStrictEqual(normalizzaObiettivi('numeri', undefined), { scelti: ['numeri'], liberi: [] });
  assert.deepStrictEqual(normalizzaObiettivi(undefined, undefined), { scelti: [], liberi: [] });
});
test('obiettivi liberi: ripuliti, senza vuoti né doppioni, massimo 5', () => {
  const r = normalizzaObiettivi([], ['  più  open day ', '', 'Più open day', 'a', 'b', 'c', 'd', 'e'], 5);
  assert.deepStrictEqual(r.liberi, ['più open day', 'a', 'b', 'c', 'd']);
});
test('tutti gli obiettivi hanno chiave, etichetta e frase', () => {
  OBIETTIVI.forEach((o) => assert.ok(o.key && o.label && o.frase));
});
