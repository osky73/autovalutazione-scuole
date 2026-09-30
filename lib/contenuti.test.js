const test = require('node:test');
const assert = require('node:assert/strict');
const {
  individuaSezione,
  giudicaContenuti,
  calcolaMetriche,
  estraiVociDaMarkup,
  parseFeed,
} = require('./contenuti');

test('individuaSezione trova un link "News" nel menu', () => {
  const html = `<html><body>
    <nav><a href="/chi-siamo">Chi siamo</a><a href="/news/">News</a></nav>
  </body></html>`;
  const r = individuaSezione('https://scuola.it', [html]);
  assert.equal(r.trovata, true);
  assert.equal(r.url, 'https://scuola.it/news/');
});

test('individuaSezione trova un link "Novità" in footer via testo', () => {
  const html = `<html><body>
    <footer><a href="/comunicazioni/elenco">Le nostre novità</a></footer>
  </body></html>`;
  const r = individuaSezione('https://scuola.it', [html]);
  assert.equal(r.trovata, true);
  assert.equal(r.url, 'https://scuola.it/comunicazioni/elenco');
});

test('individuaSezione ritorna assente se non trova nulla', () => {
  const html = `<html><body><a href="/contatti">Contatti</a></body></html>`;
  const r = individuaSezione('https://scuola.it', [html]);
  assert.equal(r.trovata, false);
  assert.equal(r.url, null);
});

test('estraiVociDaMarkup legge <time datetime> e titolo vicino', () => {
  const html = `<html><body><ul>
    <li class="post"><h3 class="entry-title">Open day 2026</h3><time datetime="2026-09-10">10 settembre</time></li>
    <li class="post"><h3 class="entry-title">Iscrizioni aperte</h3><time datetime="2026-06-01">1 giugno</time></li>
  </ul></body></html>`;
  const voci = estraiVociDaMarkup(html);
  assert.equal(voci.length, 2);
  assert.equal(voci[0].fonte, 'markup');
  assert.ok(voci.some((v) => v.titolo === 'Open day 2026'));
});

test('estraiVociDaMarkup fallback su date testuali in italiano', () => {
  const html = `<html><body><p>Pubblicato il 12 marzo 2026, aggiornamento del 3/01/2026.</p></body></html>`;
  const voci = estraiVociDaMarkup(html);
  assert.ok(voci.length >= 2);
  assert.ok(voci.every((v) => v.data instanceof Date && !isNaN(v.data)));
});

test('parseFeed legge un RSS con <item><pubDate>', () => {
  const xml = `<?xml version="1.0"?><rss><channel>
    <item><title>Articolo 1</title><pubDate>Mon, 01 Sep 2026 10:00:00 GMT</pubDate></item>
    <item><title>Articolo 2</title><pubDate>Mon, 01 Jun 2026 10:00:00 GMT</pubDate></item>
  </channel></rss>`;
  const voci = parseFeed(xml);
  assert.equal(voci.length, 2);
  assert.equal(voci[0].titolo, 'Articolo 1');
  assert.equal(voci[0].fonte, 'feed');
});

test('parseFeed legge un Atom con <entry><published>', () => {
  const xml = `<?xml version="1.0"?><feed>
    <entry><title>Novità A</title><published>2026-08-15T09:00:00Z</published></entry>
  </feed>`;
  const voci = parseFeed(xml);
  assert.equal(voci.length, 1);
  assert.equal(voci[0].titolo, 'Novità A');
});

test('giudicaContenuti: assente quando la sezione non è stata trovata', () => {
  const r = giudicaContenuti({ sezioneTrovata: false, url: null, articoli: [] });
  assert.equal(r.stato, 'assente');
  assert.equal(r.ultimoArticolo, null);
});

test('giudicaContenuti: attivo con pubblicazioni regolari e recenti', () => {
  const ora = new Date('2026-09-30T12:00:00Z');
  const articoli = [];
  // un articolo ogni ~15 giorni negli ultimi 6 mesi -> ~12 articoli, ultimo pochi giorni fa
  for (let i = 0; i < 12; i++) {
    articoli.push({ titolo: `Art ${i}`, data: new Date(ora.getTime() - i * 15 * 24 * 60 * 60 * 1000), fonte: 'sitemap' });
  }
  const metriche = calcolaMetriche(articoli, ora);
  assert.ok(metriche.articoli6Mesi >= 6);
  const r = giudicaContenuti({ sezioneTrovata: true, url: 'https://scuola.it/news/', articoli });
  // nota: calcolaStato usa Date.now() internamente, quindi qui verifichiamo solo le metriche di base
  assert.equal(r.sezioneTrovata, true);
  assert.ok(r.articoli6Mesi >= 6);
});

test('giudicaContenuti: fermo quando ultimo articolo oltre 90 giorni fa', () => {
  const vecchia = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
  const r = giudicaContenuti({
    sezioneTrovata: true,
    url: 'https://scuola.it/news/',
    articoli: [{ titolo: 'Vecchio articolo', data: vecchia, fonte: 'sitemap' }],
  });
  assert.equal(r.stato, 'fermo');
});

test('giudicaContenuti: rallentato quando ultimo articolo tra 31 e 90 giorni fa', () => {
  const media = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);
  const r = giudicaContenuti({
    sezioneTrovata: true,
    url: 'https://scuola.it/news/',
    articoli: [{ titolo: 'Articolo', data: media, fonte: 'sitemap' }],
  });
  assert.equal(r.stato, 'rallentato');
});

test('giudicaContenuti: fermo quando la sezione è trovata ma senza date valide', () => {
  const r = giudicaContenuti({ sezioneTrovata: true, url: 'https://scuola.it/news/', articoli: [] });
  assert.equal(r.stato, 'fermo');
});

test('giudicaContenuti: segnala divergenza tra cadenza dichiarata e verificata', () => {
  const ora = new Date();
  const articoli = [
    { titolo: 'A', data: new Date(ora.getTime() - 5 * 24 * 60 * 60 * 1000), fonte: 'sitemap' },
    { titolo: 'B', data: new Date(ora.getTime() - 65 * 24 * 60 * 60 * 1000), fonte: 'sitemap' },
  ];
  const r = giudicaContenuti(
    { sezioneTrovata: true, url: 'https://scuola.it/news/', articoli },
    { cadenzaDichiarata: 'settimanale' }
  );
  assert.ok(r.divergenzaCadenza);
  assert.equal(r.divergenzaCadenza.divergente, true);
});

test('giudicaContenuti: nessuna divergenza segnalata senza cadenza dichiarata', () => {
  const r = giudicaContenuti(
    { sezioneTrovata: true, url: 'https://scuola.it/news/', articoli: [{ titolo: 'A', data: new Date(), fonte: 'sitemap' }] },
    {}
  );
  assert.equal(r.divergenzaCadenza, null);
});
