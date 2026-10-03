const test = require('node:test');
const assert = require('node:assert/strict');
const { VOCABOLARIO, queryPerTema } = require('./temi');

const tema = (key) => ({ key, label: VOCABOLARIO[key].label });

test('queryPerTema: numero di ricerche per cluster dopo le esclusioni di Andrea (57 totali)', () => {
  const attesi = { lingue: 18, musica: 8, teatro: 6, sport: 5, tecnologia: 4, ambiente: 5, umanistica: 5, arte: 6 };
  let totale = 0;
  for (const [key, n] of Object.entries(attesi)) {
    const q = queryPerTema(tema(key), 'Milano');
    assert.equal(q.length, n, `cluster ${key}`);
    totale += q.length;
  }
  assert.equal(totale, 57);
});

test('queryPerTema: la ricerca generica manca solo nei cluster senzaQueryGenerica', () => {
  for (const key of ['lingue', 'musica', 'teatro', 'sport', 'tecnologia', 'ambiente', 'arte']) {
    assert.ok(queryPerTema(tema(key), 'Milano')[0].startsWith(`scuola ${VOCABOLARIO[key].label.replace(/\//g, " ")}`), key);
  }
  for (const key of ['umanistica']) {
    const q = queryPerTema(tema(key), 'Milano');
    assert.ok(!q.includes(`scuola ${VOCABOLARIO[key].label.replace(/\//g, ' ')} Milano`), key);
  }
});

test('queryPerTema: elenchi esatti per tecnologia e umanistica, località in coda', () => {
  assert.deepEqual(queryPerTema(tema('tecnologia'), 'Roma'), [
    'scuola tecnologia coding Roma',
    'scuola coding Roma',
    'scuola pensiero computazionale Roma',
    'scuola curvatura digitale Roma',
  ]);
  assert.deepEqual(queryPerTema(tema('umanistica'), 'Roma'), [
    'scuola potenziamento lettere Roma',
    'scuola avviamento al latino Roma',
    'scuola laboratorio di latino Roma',
    'scuola scrittura creativa Roma',
    'scuola giornalismo scolastico Roma',
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

test('queryPerTema: competenza scritta a mano (senza chiave) -> generica + potenziamento/curvatura/indirizzo', () => {
  assert.deepEqual(queryPerTema({ key: null, label: 'cucina/gastronomia' }, 'Pavia'), [
    'scuola cucina gastronomia Pavia',
    'scuola potenziamento cucina gastronomia Pavia',
    'scuola curvatura cucina gastronomia Pavia',
    'scuola indirizzo cucina gastronomia Pavia',
  ]);
});

test('queryPerTema: le varianti potenziamento/curvatura/indirizzo NON si applicano ai temi del vocabolario', () => {
  const q = queryPerTema(tema('arte'), 'Milano');
  assert.ok(!q.includes('scuola indirizzo arte design creatività Milano'));
});

// --- Link "vedi pagina" delle competenze (caso suoremantellate.org, 2026-10-03) ---
const { estraiTemi } = require('./temi');

const HOME = 'https://www.suoremantellate.org/';
const homeConMenu = `<html><body>
  <nav>
    <a href="/calendario-scolastico/">Calendario scolastico</a>
    <a href="/progetti/">Progetti</a>
    <ul>
      <li><a href="https://www.suoremantellate.org/certificazioni-linguistiche/">Certificazioni linguistiche</a></li>
      <li><a href="/coding-pensiero-computazionale-e-robotica-educativa/">Coding, pensiero computazionale e robotica educativa</a></li>
    </ul>
    <a href="/about/">News</a>
    <a href="https://www.instagram.com/certificazioni-linguistiche/">Instagram</a>
  </nav>
  <p>Benvenuti nella nostra scuola.</p>
</body></html>`;
const paginaNews = '<html><body><h1>News</h1><p>Esami di certificazione linguistica e laboratorio di coding: tutte le novità.</p></body></html>';

function trovato(esito, key) {
  return esito.temiTrovati.find((t) => t.key === key);
}

test('estraiTemi: il link porta alla pagina dedicata indicata dal menu, non alla home/news', () => {
  const esito = estraiTemi([homeConMenu, paginaNews], [HOME, HOME + 'about/']);
  assert.equal(trovato(esito, 'lingue').url, 'https://www.suoremantellate.org/certificazioni-linguistiche/');
  assert.equal(
    trovato(esito, 'tecnologia').url,
    'https://www.suoremantellate.org/coding-pensiero-computazionale-e-robotica-educativa/'
  );
});

test('estraiTemi: i link esterni (es. Instagram) non vengono mai scelti', () => {
  const esito = estraiTemi([homeConMenu], [HOME]);
  assert.ok(!trovato(esito, 'lingue').url.includes('instagram.com'));
});

test('estraiTemi: indirizzo relativo risolto rispetto alla pagina', () => {
  const html = '<html><body><a href="progetti/teatro-in-lingua/">Laboratorio teatrale</a></body></html>';
  const esito = estraiTemi([html], ['https://scuola.it/']);
  assert.equal(trovato(esito, 'teatro').url, 'https://scuola.it/progetti/teatro-in-lingua/');
});

test('estraiTemi: senza link dedicato sceglie la pagina più specifica, non la prima né le notizie', () => {
  const home = '<html><body><p>Benvenuti</p></body></html>';
  const news = '<html><body><p>Laboratorio teatrale, laboratorio teatrale, laboratorio teatrale.</p></body></html>';
  const progetti = '<html><body><p>Il nostro laboratorio teatrale del giovedì.</p></body></html>';
  const esito = estraiTemi([home, news, progetti], [HOME, HOME + 'news/', HOME + 'progetti/']);
  assert.equal(trovato(esito, 'teatro').url, HOME + 'progetti/');
});

test('estraiTemi: sigle corte non attirano link non correlati ("pet" vs "petizione")', () => {
  const html = '<html><body><a href="/petizione/">Firma la petizione</a><a href="/lingue/">Esame PET</a></body></html>';
  const esito = estraiTemi([html], [HOME]);
  assert.equal(trovato(esito, 'lingue').url, HOME + 'lingue/');
});

test('estraiTemi: senza URL delle pagine funziona come prima (url null)', () => {
  const esito = estraiTemi([homeConMenu]);
  assert.equal(trovato(esito, 'lingue').url, null);
});
