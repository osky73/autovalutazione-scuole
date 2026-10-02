const test = require('node:test');
const assert = require('node:assert/strict');
const { VOCABOLARIO, queryPerTema } = require('./temi');

const tema = (key) => ({ key, label: VOCABOLARIO[key].label });

test('queryPerTema: numero di ricerche per cluster dopo le esclusioni di Andrea (55 totali)', () => {
  const attesi = { lingue: 18, musica: 7, teatro: 6, sport: 5, tecnologia: 4, ambiente: 4, umanistica: 5, arte: 6 };
  let totale = 0;
  for (const [key, n] of Object.entries(attesi)) {
    const q = queryPerTema(tema(key), 'Milano');
    assert.equal(q.length, n, `cluster ${key}`);
    totale += q.length;
  }
  assert.equal(totale, 55);
});

test('queryPerTema: la ricerca generica manca solo nei cluster senzaQueryGenerica', () => {
  for (const key of ['lingue', 'teatro', 'sport', 'tecnologia', 'arte']) {
    assert.ok(queryPerTema(tema(key), 'Milano')[0].startsWith(`scuola media ${VOCABOLARIO[key].label.replace(/\//g, " ")}`), key);
  }
  for (const key of ['musica', 'ambiente', 'umanistica']) {
    const q = queryPerTema(tema(key), 'Milano');
    assert.ok(!q.includes(`scuola media ${VOCABOLARIO[key].label.replace(/\//g, ' ')} Milano`), key);
  }
});

test('queryPerTema: elenchi esatti per tecnologia e umanistica, località in coda', () => {
  assert.deepEqual(queryPerTema(tema('tecnologia'), 'Roma'), [
    'scuola media tecnologia coding Roma',
    'scuola media coding Roma',
    'scuola media pensiero computazionale Roma',
    'scuola media curvatura digitale Roma',
  ]);
  assert.deepEqual(queryPerTema(tema('umanistica'), 'Roma'), [
    'scuola media potenziamento lettere Roma',
    'scuola media avviamento al latino Roma',
    'scuola media laboratorio di latino Roma',
    'scuola media scrittura creativa Roma',
    'scuola media giornalismo scolastico Roma',
  ]);
});

test('le esclusioni valgono solo per le ricerche SERP: keywords di rilevamento invariate', () => {
  assert.equal(VOCABOLARIO.lingue.keywords.length, 30);
  assert.ok(VOCABOLARIO.lingue.keywords.includes('ielts'));
  assert.ok(VOCABOLARIO.tecnologia.keywords.includes('stampa 3d'));
  for (const v of Object.values(VOCABOLARIO)) {
    for (const kw of v.escludiDaSerp || []) assert.ok(v.keywords.includes(kw), `escludiDaSerp "${kw}" non è nelle keywords`);
  }
});

test('queryPerTema: tema aggiuntivo senza chiave -> solo la ricerca generica', () => {
  assert.deepEqual(queryPerTema({ label: 'cucina/gastronomia' }, 'Pavia'), ['scuola media cucina gastronomia Pavia']);
});
