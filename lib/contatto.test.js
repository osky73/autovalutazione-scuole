const test = require('node:test');
const assert = require('node:assert');
const { puntiDeboliPerBlocco, nessunPuntoDebole } = require('./contatto');

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

test('3 blocchi in ordine di importanza, frasi testuali senza il voto 0-100', () => {
  const blocchi = puntiDeboliPerBlocco(sessione());
  assert.deepStrictEqual(blocchi.map((b) => b.importanza), ['fondamentale', 'importante', 'accessorio']);
  // obiettivo iscrizioni: contenuti fondamentale, comunicazione importante, tecnica accessorio (come nel giudizio)
  assert.deepStrictEqual(blocchi.map((b) => b.etichetta), ['SEO contenuti', 'Comunicazione', 'SEO tecnica']);
  blocchi.forEach((b) => b.punti.forEach((testo) => assert.strictEqual(typeof testo, 'string')));
});

test('blocco contenuti e comunicazione deboli: punti deboli elencati, nessuno vuoto', () => {
  const blocchi = puntiDeboliPerBlocco(sessione());
  const contenuti = blocchi.find((b) => b.key === 'contenuti');
  const comunicazione = blocchi.find((b) => b.key === 'comunicazione');
  assert.ok(contenuti.punti.length > 0);
  assert.ok(comunicazione.punti.length > 0);
  assert.ok(contenuti.punti.some((t) => /blog/i.test(t)));
  assert.strictEqual(nessunPuntoDebole(blocchi), false);
});

test('tutto buono: nessun punto debole in nessun blocco', () => {
  const s = sessione({
    audit: { score: 90, worst: { label: 'x' }, newsletter: { stato: 'presente' } },
    dichiarati: [{ key: 'lingue', label: 'lingue' }],
    posizionamento: [{ disponibile: true, migliore: { posizione: 1 } }],
    attivitaEditoriale: { sezioneTrovata: true, contenuti: { stato: 'attivo' }, frequenza: { livello: 'ottimo' }, ottimizzazione: { livello: 'buona' }, relazioneCompetenze: { presente: true } },
    socialAnalisi: [{ livelloFrequenza: 'Buono', livelloInterazioni: 'Buono', livelloFollower: 'Buono' }],
    gbp: { stato: 'reclamata', punteggio: 'Buono' },
  });
  const blocchi = puntiDeboliPerBlocco(s);
  blocchi.forEach((b) => assert.strictEqual(b.punti.length, 0));
  assert.strictEqual(nessunPuntoDebole(blocchi), true);
});

test('nessun dato: 3 blocchi non valutati, nessun punto debole (nulla da valutare)', () => {
  const blocchi = puntiDeboliPerBlocco({});
  assert.strictEqual(blocchi.length, 3);
  blocchi.forEach((b) => assert.strictEqual(b.valutato, false));
  assert.strictEqual(nessunPuntoDebole(blocchi), true);
});
