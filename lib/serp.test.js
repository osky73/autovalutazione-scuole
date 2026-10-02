const test = require('node:test');
const assert = require('node:assert');
const { cercaConSerper, cercaRisultati, trovaPosizione } = require('./serp');

function fetchFinto(risposta, { status = 200, cattura } = {}) {
  return async (url, opts) => {
    if (cattura) cattura.push({ url, opts });
    return { ok: status >= 200 && status < 300, status, json: async () => risposta };
  };
}

test.beforeEach(() => { process.env.SERPER_API_KEY = 'chiave-di-prova'; });
test.afterEach(() => { delete process.env.SERPER_API_KEY; });

test('cercaConSerper: chiave assente -> non configurato, nessuna richiesta', async () => {
  delete process.env.SERPER_API_KEY;
  const chiamate = [];
  const r = await cercaConSerper('x', { fetchImpl: fetchFinto({}, { cattura: chiamate }) });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.nonConfigurato, true);
  assert.strictEqual(chiamate.length, 0);
});

test('cercaConSerper: richiesta corretta (POST, X-API-KEY, gl/hl it, num 30)', async () => {
  const chiamate = [];
  await cercaConSerper('scuola media inglese milano', { fetchImpl: fetchFinto({ organic: [] }, { cattura: chiamate }) });
  assert.strictEqual(chiamate.length, 1);
  assert.strictEqual(chiamate[0].url, 'https://google.serper.dev/search');
  assert.strictEqual(chiamate[0].opts.method, 'POST');
  assert.strictEqual(chiamate[0].opts.headers['X-API-KEY'], 'chiave-di-prova');
  const body = JSON.parse(chiamate[0].opts.body);
  assert.deepStrictEqual(body, { q: 'scuola media inglese milano', gl: 'it', hl: 'it', num: 30, autocorrect: false });
});

test('cercaConSerper: ordina per position, scarta link non http e duplicati', async () => {
  const risposta = {
    organic: [
      { position: 3, link: 'https://c.it/' },
      { position: 1, link: 'https://a.it/' },
      { position: 2, link: 'ftp://x.it/' },
      { position: 4, link: 'https://a.it/' },
      { position: 5 },
    ],
  };
  const r = await cercaConSerper('q', { fetchImpl: fetchFinto(risposta) });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.fonte, 'serper');
  assert.deepStrictEqual(r.urls, ['https://a.it/', 'https://c.it/']);
});

test('cercaConSerper: HTTP di errore o eccezione -> ok false senza lanciare', async () => {
  const e1 = await cercaConSerper('q', { fetchImpl: fetchFinto({}, { status: 429 }) });
  assert.strictEqual(e1.ok, false);
  assert.match(e1.error, /429/);
  const e2 = await cercaConSerper('q', { fetchImpl: async () => { throw new Error('rete giù'); } });
  assert.strictEqual(e2.ok, false);
  assert.match(e2.error, /rete giù/);
});

test('cercaConSerper: risposta senza organic -> elenco vuoto, ok true', async () => {
  const r = await cercaConSerper('q', { fetchImpl: fetchFinto({}) });
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.urls, []);
});

test('cercaRisultati: con Serper ok non ripiega su Google', async () => {
  const r = await cercaRisultati('q', { fetchImpl: fetchFinto({ organic: [{ position: 1, link: 'https://www.scuola.it/pagina' }] }) });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.fonte, 'serper');
  assert.strictEqual(trovaPosizione(r.urls, 'scuola.it'), 1);
});
