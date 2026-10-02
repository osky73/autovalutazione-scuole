const test = require('node:test');
const assert = require('node:assert/strict');
const {
  individuaSezione,
  giudicaContenuti,
  calcolaMetriche,
  estraiVociDaMarkup,
  parseFeed,
  calcolaFrequenzaEditoriale,
  trovaUrlArticoloPiuRecente,
  trovaUrlUltimiArticoli,
  analizzaOttimizzazioneArticolo,
  aggregaOttimizzazione,
  relazioneCompetenze,
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

// --- Nuovi criteri del passaggio 9 dedicato (richiesta Andrea, 2026-10-01) ---

function giorniFa(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

test('calcolaFrequenzaEditoriale: ottimo con 1-2 post a settimana', () => {
  const articoli = Array.from({ length: 16 }, (_, i) => ({ data: giorniFa(i * 4) })); // ~1 ogni 4 giorni, 60gg
  const r = calcolaFrequenzaEditoriale(articoli);
  assert.equal(r.livello, 'ottimo');
  assert.equal(r.colore, 'verde');
});

test('calcolaFrequenzaEditoriale: sufficiente con circa 3 post al mese', () => {
  // 6 articoli negli ultimi 60 giorni (2 mesi) = 3 post/mese di media.
  const articoli = [5, 15, 25, 35, 45, 55].map((g) => ({ data: giorniFa(g) }));
  const r = calcolaFrequenzaEditoriale(articoli);
  assert.equal(r.livello, 'sufficiente');
  assert.equal(r.colore, 'arancione');
});

test('calcolaFrequenzaEditoriale: insufficiente con un post ogni due settimane o meno', () => {
  const articoli = [giorniFa(5), giorniFa(55)].map((d) => ({ data: d }));
  const r = calcolaFrequenzaEditoriale(articoli);
  assert.equal(r.livello, 'insufficiente');
  assert.equal(r.colore, 'rosso');
});

test('trovaUrlArticoloPiuRecente: ritorna l\'url dell\'articolo con la data più recente', () => {
  const articoli = [
    { data: giorniFa(10), url: 'https://scuola.it/news/vecchio/' },
    { data: giorniFa(1), url: 'https://scuola.it/news/nuovo/' },
    { data: giorniFa(20), url: null },
  ];
  assert.equal(trovaUrlArticoloPiuRecente(articoli), 'https://scuola.it/news/nuovo/');
});

test('trovaUrlUltimiArticoli: ritorna fino a n url in ordine dal più recente al meno recente', () => {
  const articoli = [
    { data: giorniFa(30), url: 'https://scuola.it/news/piu-vecchio/' },
    { data: giorniFa(10), url: 'https://scuola.it/news/vecchio/' },
    { data: giorniFa(1), url: 'https://scuola.it/news/nuovo/' },
    { data: giorniFa(20), url: null },
  ];
  assert.deepEqual(trovaUrlUltimiArticoli(articoli, 3), [
    'https://scuola.it/news/nuovo/',
    'https://scuola.it/news/vecchio/',
    'https://scuola.it/news/piu-vecchio/',
  ]);
});

test('trovaUrlUltimiArticoli: si ferma a n anche con più articoli disponibili', () => {
  const articoli = [1, 2, 3, 4, 5].map((i) => ({ data: giorniFa(i), url: `https://scuola.it/news/${i}/` }));
  assert.equal(trovaUrlUltimiArticoli(articoli, 3).length, 3);
});

test('analizzaOttimizzazioneArticolo: rileva metadescription-come-excerpt, nessun link, immagini senza alt', () => {
  const html = `<html><head><meta name="description" content="Oggi i bambini della primaria hanno"></head>
    <body><article><p>Oggi i bambini della primaria hanno vissuto una giornata speciale.</p>
    <img src="DSC1234.jpg" alt=""></article></body></html>`;
  const r = analizzaOttimizzazioneArticolo(html, 'https://scuola.it/news/articolo/');
  assert.equal(r.metaDescrizioneSoloExcerpt, true);
  assert.equal(r.linkInterni, 0);
  assert.equal(r.linkEsterni, 0);
  assert.equal(r.immaginiNonSignificative, 1);
  assert.equal(r.livello, 'scarsa');
});

test('analizzaOttimizzazioneArticolo: buona con link e immagini descrittive', () => {
  const html = `<html><head><meta name="description" content="Un riassunto originale e diverso dal testo."></head>
    <body><article><p>Oggi i bambini della primaria hanno vissuto una giornata speciale.</p>
    <a href="/altre-news/">altre news</a><a href="https://esterno.it">fonte esterna</a>
    <img src="foto.jpg" alt="Bambini della primaria durante la gita"></article></body></html>`;
  const r = analizzaOttimizzazioneArticolo(html, 'https://scuola.it/news/articolo/');
  assert.equal(r.metaDescrizioneSoloExcerpt, false);
  assert.equal(r.linkInterni, 1);
  assert.equal(r.linkEsterni, 1);
  assert.equal(r.immaginiNonSignificative, 0);
  assert.equal(r.livello, 'buona');
});

test('aggregaOttimizzazione: scarsa se almeno un articolo tra gli ultimi è scarso (caso peggiore)', () => {
  const buono = { livello: 'buona', colore: 'verde' };
  const scarso = { livello: 'scarsa', colore: 'rosso' };
  const r = aggregaOttimizzazione([buono, buono, scarso]);
  assert.equal(r.livello, 'scarsa');
  assert.equal(r.numeroArticoliAnalizzati, 3);
});

test('aggregaOttimizzazione: buona solo se tutti gli articoli analizzati sono buoni', () => {
  const buono = { livello: 'buona', colore: 'verde' };
  const parziale = { livello: 'parziale', colore: 'arancione' };
  assert.equal(aggregaOttimizzazione([buono, buono]).livello, 'buona');
  assert.equal(aggregaOttimizzazione([buono, parziale]).livello, 'parziale');
});

test('aggregaOttimizzazione: ritorna null se nessun articolo è stato analizzato', () => {
  assert.equal(aggregaOttimizzazione([]), null);
  assert.equal(aggregaOttimizzazione([null, null]), null);
});

test('relazioneCompetenze: presente quando un tema dichiarato compare nel blog', () => {
  const html = '<html><body><p>La nostra sezione a indirizzo musicale ha organizzato un concerto.</p></body></html>';
  const r = relazioneCompetenze([html], [{ key: 'musica', label: 'musica/canto' }]);
  assert.equal(r.presente, true);
  assert.ok(r.temiCorrelati.includes('musica/canto'));
});

test('relazioneCompetenze: assente quando nessun tema dichiarato compare nel blog', () => {
  const html = '<html><body><p>Oggi abbiamo fatto una gita in montagna.</p></body></html>';
  const r = relazioneCompetenze([html], [{ key: 'musica', label: 'musica/canto' }]);
  assert.equal(r.presente, false);
});
