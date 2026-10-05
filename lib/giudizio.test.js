const test = require('node:test');
const assert = require('node:assert');
const { costruisciGiudizio, fraseObiettivi } = require('./giudizio');

function sessione(extra = {}) {
  return {
    obiettivi: { scelti: ['iscrizioni'], liberi: ['far conoscere il corso di musica'] },
    audit: { score: 85, worst: { label: 'Velocità mobile' }, newsletter: { stato: 'assente', sottocaso: 'nessun_meccanismo' } },
    dichiarati: [{ key: 'lingue', label: 'lingue' }, { key: 'musica', label: 'musica' }],
    temi: { estrazione: { temiTrovati: [{ key: 'lingue' }] }, liberiTrovati: {} },
    confermati: [{ key: 'lingue', label: 'lingue' }],
    posizionamento: [{ disponibile: true, migliore: null }, { disponibile: true, migliore: null }],
    attivitaEditoriale: { sezioneTrovata: false, contenuti: { stato: 'assente' }, relazioneCompetenze: { presente: false } },
    socialAnalisi: [],
    gbp: { stato: 'assente' },
    ...extra,
  };
}

test('frase obiettivi: uno, più d\'uno, nessuno predefinito', () => {
  assert.match(fraseObiettivi({ scelti: ['iscrizioni'] }), /^aumentare le iscrizioni/);
  assert.match(fraseObiettivi({ scelti: ['iscrizioni', 'reputazione'] }), / e migliorare la reputazione/);
  assert.strictEqual(fraseObiettivi({ scelti: [], liberi: ['x'] }), null);
});

test('struttura: 3 blocchi in ordine di importanza e commento di 5-6 righe', () => {
  const g = costruisciGiudizio(sessione());
  assert.deepStrictEqual(g.blocchi.map((b) => b.importanza), ['fondamentale', 'importante', 'accessorio']);
  // obiettivo iscrizioni: contenuti fondamentale, comunicazione importante, tecnica accessorio
  assert.deepStrictEqual(g.blocchi.map((b) => b.etichetta), ['SEO contenuti', 'Comunicazione', 'SEO tecnica']);
  assert.ok(g.commento.length >= 5 && g.commento.length <= 6, `righe: ${g.commento.length}`);
  assert.ok(g.commento[0].startsWith('Rispetto all\'obiettivo di aumentare le iscrizioni'));
});

test('contenuti e comunicazione deboli: giudizio non sufficiente, dato concreto reale', () => {
  const g = costruisciGiudizio(sessione());
  assert.strictEqual(g.giudizio.chiave, 'insufficiente');
  assert.ok(g.commento.some((r) => /blog|Google|competenze/.test(r)));
  assert.ok(g.commento[g.commento.length - 1].startsWith('Serve un intervento mirato'));
});

test('tutto buono: giudizio efficace', () => {
  const s = sessione({
    audit: { score: 90, worst: { label: 'x' }, newsletter: { stato: 'presente' } },
    dichiarati: [{ key: 'lingue', label: 'lingue' }],
    posizionamento: [{ disponibile: true, migliore: { posizione: 1 } }],
    attivitaEditoriale: { sezioneTrovata: true, contenuti: { stato: 'attivo' }, frequenza: { livello: 'ottimo' }, ottimizzazione: { livello: 'buona' }, relazioneCompetenze: { presente: true } },
    socialAnalisi: [{ livelloFrequenza: 'Buono', livelloInterazioni: 'Buono', livelloFollower: 'Buono' }],
    gbp: { stato: 'reclamata', punteggio: 'Buono' },
  });
  const g = costruisciGiudizio(s);
  assert.strictEqual(g.giudizio.chiave, 'efficace');
});

test('nessun dato: nessun giudizio ma messaggio e blocchi presenti', () => {
  const g = costruisciGiudizio({});
  assert.strictEqual(g.giudizio, null);
  assert.strictEqual(g.blocchi.length, 3);
  assert.strictEqual(g.commento.length, 1);
});

test('senza obiettivi predefiniti l\'apertura è generica', () => {
  const g = costruisciGiudizio(sessione({ obiettivi: { scelti: [], liberi: ['x'] } }));
  assert.ok(g.commento[0].startsWith('Nel complesso, la comunicazione della tua scuola'));
});
