const test = require('node:test');
const assert = require('node:assert');
const { scegliPagineExtra, raccogliPagineExtra } = require('./pages');

const HOME = 'https://www.scuola.it/';
const v = (loc, lastmod) => ({ loc, lastmod: lastmod ? new Date(lastmod) : null });

test('pagine specifiche: se la sitemap ne ha, si leggono quelle (non gli articoli)', () => {
  const candidati = [
    v('https://www.scuola.it/'),
    v('https://www.scuola.it/certificazioni-linguistiche/'),
    v('https://www.scuola.it/coding-e-robotica/'),
    v('https://www.scuola.it/news/open-day-2026/', '2026-09-01'),
    v('https://www.scuola.it/storia/'),
  ];
  const r = scegliPagineExtra(candidati, [], HOME);
  assert.strictEqual(r.tipo, 'specifiche');
  assert.deepStrictEqual(r.urls.sort(), ['https://www.scuola.it/certificazioni-linguistiche/', 'https://www.scuola.it/coding-e-robotica/']);
});

test('una pagina già letta o la home non vengono riscaricate', () => {
  const candidati = [v('https://www.scuola.it/certificazioni-linguistiche/'), v('https://scuola.it')];
  const r = scegliPagineExtra(candidati, ['https://www.scuola.it/certificazioni-linguistiche'], HOME);
  assert.deepStrictEqual(r.urls, []);
});

test('un articolo che parla di una competenza non è una pagina specifica', () => {
  const candidati = [v('https://www.scuola.it/2026/05/corso-di-inglese-open-day/', '2026-05-01'), v('https://www.scuola.it/la-nostra-storia/')];
  const r = scegliPagineExtra(candidati, [], HOME);
  assert.strictEqual(r.tipo, 'statiche_articoli');
});

test('senza pagine specifiche: pagine statiche e ultimi 5 articoli (i più recenti)', () => {
  const candidati = [
    v('https://www.scuola.it/la-nostra-storia/'),
    v('https://www.scuola.it/progetto-educativo/'),
    v('https://www.scuola.it/news/a1/', '2026-01-01'),
    v('https://www.scuola.it/news/a2/', '2026-02-01'),
    v('https://www.scuola.it/news/a3/', '2026-03-01'),
    v('https://www.scuola.it/news/a4/', '2026-04-01'),
    v('https://www.scuola.it/news/a5/', '2026-05-01'),
    v('https://www.scuola.it/news/a6/', '2026-06-01'),
  ];
  const r = scegliPagineExtra(candidati, [], HOME);
  assert.strictEqual(r.tipo, 'statiche_articoli');
  assert.strictEqual(r.articoli, 5);
  assert.ok(!r.urls.includes('https://www.scuola.it/news/a1/'), 'il più vecchio resta fuori');
  assert.ok(r.urls.includes('https://www.scuola.it/news/a6/'));
  assert.ok(r.urls.includes('https://www.scuola.it/la-nostra-storia/'));
});

test('mai più di 10 pagine; file, feed, tag e categorie sono scartati', () => {
  const candidati = [v('https://www.scuola.it/brochure.pdf'), v('https://www.scuola.it/feed/'), v('https://www.scuola.it/tag/x/'), v('https://www.scuola.it/category/y/')];
  for (let i = 0; i < 30; i++) candidati.push(v(`https://www.scuola.it/inglese-livello-${i}/`));
  const r = scegliPagineExtra(candidati, [], HOME);
  assert.strictEqual(r.urls.length, 10);
  assert.ok(r.urls.every((u) => !/pdf|feed|tag|category/.test(u)));
});

test('raccogliPagineExtra: usa la sitemap, altrimenti i link della home, e scarta le pagine non raggiungibili', async () => {
  const chiamate = [];
  const fetchImpl = async (u) => {
    chiamate.push(u);
    return u.includes('rotta') ? { ok: false } : { ok: true, html: '<html></html>' };
  };
  const conSitemap = await raccogliPagineExtra(HOME, '<html></html>', [], {
    fetchImpl,
    sitemapImpl: async () => [v('https://www.scuola.it/inglese/'), v('https://www.scuola.it/inglese-rotta/')],
  });
  assert.strictEqual(conSitemap.sitemap, true);
  assert.strictEqual(conSitemap.richieste, 2);
  assert.strictEqual(conSitemap.pagine.length, 1);

  const senza = await raccogliPagineExtra(HOME, '<a href="/musica-e-canto/">Musica</a>', [], { fetchImpl, sitemapImpl: async () => [] });
  assert.strictEqual(senza.sitemap, false);
  assert.deepStrictEqual(senza.pagine.map((p) => p.url), ['https://www.scuola.it/musica-e-canto/']);
});
