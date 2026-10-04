const test = require('node:test');
const assert = require('node:assert');
const { scegliScheda } = require('./gbp');
const { estraiDatiOrganizzazione } = require('../localita');

const badia = { id: 'A', formattedAddress: 'Via della Badia 1, 50122 Firenze FI', websiteUri: 'https://altra.it' };
const milano = { id: 'B', formattedAddress: 'Via Ampezzo, 8, 20158 Milano MI, Italia', websiteUri: 'https://www.scuolamariaconsolatrice.org/' };
const milanoSenzaSito = { id: 'C', formattedAddress: 'Via Ampezzo, 8, 20158 Milano MI, Italia' };

test('sceglie la scheda con lo stesso sito web', () => {
  assert.strictEqual(scegliScheda([badia, milano], { sitoUrl: 'https://scuolamariaconsolatrice.org', indirizzo: 'via Ampezzo 8, Milano', citta: 'Milano' }).id, 'B');
});
test('senza sito corrispondente usa via e città', () => {
  assert.strictEqual(scegliScheda([badia, milanoSenzaSito], { sitoUrl: 'https://x.org', indirizzo: 'via Ampezzo 8, Milano', citta: 'Milano' }).id, 'C');
});
test('scarta gli omonimi in altre città', () => {
  assert.strictEqual(scegliScheda([badia], { sitoUrl: 'https://x.org', indirizzo: 'via Ampezzo 8, Milano', citta: 'Milano' }), null);
});
test('estrae indirizzo e nome puliti dal piè di pagina', () => {
  const h = "<html><head><title>Sito ufficiale - Scuola Maria Consolatrice - Sezione Primavera</title></head><body><footer>via Ampezzo 8, Milano (MI)</footer></body></html>";
  const o = estraiDatiOrganizzazione([h]);
  assert.strictEqual(o.nome, 'Scuola Maria Consolatrice');
  assert.strictEqual(o.indirizzo, 'via Ampezzo 8, Milano');
  assert.strictEqual(o.citta, 'Milano');
});
