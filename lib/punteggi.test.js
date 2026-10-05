const test = require('node:test');
const assert = require('node:assert');
const { calcolaPunteggi, pesiPerObiettivi, importanzaBlocchi, PESI_OBIETTIVO } = require('./punteggi');

function sessioneBuona() {
  return {
    obiettivi: { scelti: ['iscrizioni'], liberi: [] },
    audit: { score: 80, newsletter: { stato: 'presente' } },
    dichiarati: [{ key: 'lingue', label: 'lingue' }, { key: null, label: 'danza' }],
    temi: { estrazione: { temiTrovati: [{ key: 'lingue' }] }, liberiTrovati: { danza: { x: 1 } } },
    confermati: [{ key: 'lingue', label: 'lingue' }],
    posizionamento: [{ disponibile: true, migliore: { posizione: 2 } }, { disponibile: true, migliore: { posizione: 9 } }],
    attivitaEditoriale: {
      sezioneTrovata: true,
      contenuti: { stato: 'attivo' },
      frequenza: { livello: 'ottimo' },
      ottimizzazione: { livello: 'buona' },
      relazioneCompetenze: { presente: true },
    },
    socialAnalisi: [{ livelloFrequenza: 'Buono', livelloInterazioni: 'Sufficiente', livelloFollower: null }],
    gbp: { stato: 'reclamata', punteggio: 'Buono' },
  };
}

test('i pesi di ogni obiettivo sommano 100', () => {
  Object.values(PESI_OBIETTIVO).forEach((p) => assert.strictEqual(p.tecnica + p.contenuti + p.comunicazione, 100));
});

test('pesi: media tra più obiettivi; base se nessun obiettivo predefinito', () => {
  assert.deepStrictEqual(pesiPerObiettivi({ scelti: ['iscrizioni', 'reputazione'] }), { tecnica: 22.5, contenuti: 37.5, comunicazione: 40 });
  assert.deepStrictEqual(pesiPerObiettivi({ scelti: [], liberi: ['x'] }), { tecnica: 25, contenuti: 40, comunicazione: 35 });
  assert.deepStrictEqual(pesiPerObiettivi(null), { tecnica: 25, contenuti: 40, comunicazione: 35 });
});

test('importanza dei blocchi in base al peso', () => {
  assert.deepStrictEqual(importanzaBlocchi(PESI_OBIETTIVO.iscrizioni), { contenuti: 'fondamentale', comunicazione: 'importante', tecnica: 'accessorio' });
  assert.deepStrictEqual(importanzaBlocchi(PESI_OBIETTIVO.reputazione), { comunicazione: 'fondamentale', contenuti: 'importante', tecnica: 'accessorio' });
});

test('sessione completa e buona: voti per blocco e finale coerenti', () => {
  const r = calcolaPunteggi(sessioneBuona());
  assert.strictEqual(r.blocchi.tecnica.voto, 80);
  // contenuti: 100*25 + 75*30 (posizioni 2 e 9 = 100 e 50) + 100*20 + 100*10 + 100*10 + 100*5 = 9250 / 100
  assert.strictEqual(r.blocchi.contenuti.voto, 93);
  // comunicazione: social 75*40 + gbp 100*30 + newsletter 100*30 = 9000 / 100
  assert.strictEqual(r.blocchi.comunicazione.voto, 90);
  assert.strictEqual(r.finale.voto, Math.round((80 * 25 + 93 * 45 + 90 * 30) / 100));
  assert.strictEqual(r.finale.fascia, 'alta');
});

test('indicatori non valutati (passaggi saltati) sono esclusi e i pesi si ridistribuiscono', () => {
  const s = sessioneBuona();
  s.dichiarati = [];
  s.posizionamento = null;
  s.attivitaEditoriale = null;
  s.analisiSocialSaltata = true;
  s.gbp = null;
  const r = calcolaPunteggi(s);
  assert.strictEqual(r.blocchi.contenuti.voto, null);
  assert.strictEqual(r.blocchi.comunicazione.voto, 100); // solo newsletter presente
  assert.strictEqual(r.finale.voto, Math.round((80 * 25 + 100 * 30) / 55));
});

test('blog assente e newsletter assente danno voti bassi', () => {
  const s = sessioneBuona();
  s.attivitaEditoriale = { sezioneTrovata: false, contenuti: { stato: 'assente' }, frequenza: null, ottimizzazione: null, relazioneCompetenze: { presente: false } };
  s.audit.newsletter = { stato: 'assente', sottocaso: 'nessun_meccanismo' };
  s.socialAnalisi = [];
  s.gbp = { stato: 'assente' };
  const r = calcolaPunteggi(s);
  assert.strictEqual(r.blocchi.comunicazione.voto, 0);
  assert.strictEqual(r.blocchi.comunicazione.fascia, 'bassa');
  const blog = r.blocchi.contenuti.indicatori.find((i) => i.key === 'blog_stato');
  assert.strictEqual(blog.voto, 0);
});

test('nessun dato: tutto null senza errori', () => {
  const r = calcolaPunteggi({});
  assert.strictEqual(r.finale.voto, null);
  assert.strictEqual(r.blocchi.tecnica.voto, null);
});
