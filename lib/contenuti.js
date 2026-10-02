// Modulo condiviso per l'analisi della sezione news/blog del sito scolastico.
//
// Riusato da DUE criteri diversi (per specifica esplicita del cliente, per non scansionare due
// volte lo stesso sito e non mostrare numeri leggermente diversi):
//  - "Aggiornamento dei contenuti / Blog" (blocco Nurturing)
//  - "Frequenza dei contenuti" (area Contenuti, non ancora implementato)
//
// Espone due funzioni principali:
//  - raccogliArticoli(baseUrl, pagineHtml): individua la sezione news/blog e raccoglie le date di
//    pubblicazione (sitemap -> feed RSS/Atom -> markup della pagina), in ordine di affidabilità.
//  - giudicaContenuti(raccolta, opzioni): calcola le metriche e applica le soglie di giudizio.
//
// NON ancora agganciato al wizard (vedi TASKS.md, sezione "Da fare" punto 1): modulo autonomo,
// testato, pronto per essere richiamato da un futuro step del wizard.

const cheerio = require('cheerio');
const { URL } = require('url');
const { fetchPage } = require('./http');
const { getSitemapEntries } = require('./sitemap');
const { estraiTemi } = require('./temi');

const GIORNO_MS = 24 * 60 * 60 * 1000;

const MONTHS_IT = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];

// Soglie regolabili in fase di calibrazione (vedi TASKS.md, STEP 4 della spec).
const SOGLIE = {
  attivoGiorni: 30,
  attivoArticoliMinimiSeiMesi: 6, // "almeno ~1 articolo/mese di media negli ultimi 6 mesi"
  rallentatoGiorniMax: 90,
  gapRallentatoGiorni: 60,
};

// Cadenza dichiarabile nel questionario -> intervallo medio atteso in giorni (per lo STEP 5).
const CADENZA_ATTESA_GIORNI = {
  settimanale: 7,
  quindicinale: 15,
  mensile: 30,
  trimestrale: 90,
};

// (?!...) al posto di un \b finale: \b in JS è basato sui soli caratteri ASCII, quindi non
// scatterebbe correttamente dopo una "à" accentata (es. "novità").
const PATTERN_TESTO_SEZIONE = /\b(news|blog|comunicat[oi]|novit[aà])(?![a-zA-Z0-9])/i;
const PATTERN_URL_SEZIONE = /\/(news|blog|category\/news|novita)\/?(\?|$|\/)/i;

// STEP 1 — cerca nel menu/footer delle pagine già raccolte un link alla sezione news/blog.
function individuaSezione(baseUrl, pagineHtml) {
  for (const html of pagineHtml || []) {
    if (!html) continue;
    const $ = cheerio.load(html);
    let trovato = null;

    $('a[href]').each((_, el) => {
      if (trovato) return;
      const href = $(el).attr('href');
      if (!href) return;
      const testo = $(el).text().trim();

      let abs;
      try {
        abs = new URL(href, baseUrl).toString();
      } catch (e) {
        return;
      }

      if (PATTERN_URL_SEZIONE.test(abs) || PATTERN_TESTO_SEZIONE.test(testo)) {
        trovato = abs.split('#')[0];
      }
    });

    if (trovato) return { trovata: true, url: trovato };
  }
  return { trovata: false, url: null };
}

// STEP 2.1 — date da sitemap.xml (riusa lib/sitemap.js), filtrando le voci sotto il path della sezione.
function estraiVociDaSitemap(vociSitemap, sezioneUrl) {
  let sezionePath;
  try {
    sezionePath = new URL(sezioneUrl).pathname;
  } catch (e) {
    return [];
  }

  return (vociSitemap || [])
    .filter((v) => v.lastmod && v.loc && v.loc.includes(sezionePath) && v.loc.replace(/\/+$/, '') !== sezioneUrl.replace(/\/+$/, ''))
    .map((v) => ({ titolo: null, data: v.lastmod, fonte: 'sitemap', url: v.loc }));
}

// STEP 2.2 — date da feed RSS/Atom, provando alcuni path comuni relativi alla sezione trovata.
function parseFeed(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const voci = [];

  $('item').each((_, el) => {
    const titolo = $(el).find('title').first().text().trim() || null;
    const pubDateTxt = $(el).find('pubDate').first().text().trim();
    const data = pubDateTxt ? new Date(pubDateTxt) : null;
    const url = $(el).find('link').first().text().trim() || null;
    if (data && !isNaN(data)) voci.push({ titolo, data, fonte: 'feed', url });
  });

  $('entry').each((_, el) => {
    const titolo = $(el).find('title').first().text().trim() || null;
    const pubTxt = $(el).find('published').first().text().trim() || $(el).find('updated').first().text().trim();
    const data = pubTxt ? new Date(pubTxt) : null;
    const url = $(el).find('link').first().attr('href') || null;
    if (data && !isNaN(data)) voci.push({ titolo, data, fonte: 'feed', url });
  });

  return voci;
}

async function provaFeed(sezioneUrl) {
  const origin = new URL(sezioneUrl).origin;
  const base = sezioneUrl.replace(/\/?$/, '/');
  const candidati = [...new Set([base + 'feed/', base + 'rss/', origin + '/feed/', origin + '/rss/'])];

  for (const candUrl of candidati) {
    const res = await fetchPage(candUrl, { timeoutMs: 7000, maxBytes: 2_000_000 });
    if (!res.ok || !res.html) continue;
    const voci = parseFeed(res.html);
    if (voci.length) return voci;
  }
  return [];
}

// Cerca un titolo vicino a un elemento data, dentro il contenitore dell'articolo (euristica semplice).
function trovaTitoloVicino($, el) {
  const contenitore = $(el).closest('article, li, .post, .entry, div');
  if (contenitore.length) {
    const heading = contenitore.find('h1, h2, h3, h4, .entry-title, .post-title').first();
    const t = heading.text().trim();
    if (t) return t;
  }
  return null;
}

// Cerca il link all'articolo vicino a un elemento data, dentro lo stesso contenitore (stessa euristica
// di trovaTitoloVicino) — usato poi dall'analisi di ottimizzazione, che deve aprire l'articolo stesso.
function trovaUrlVicino($, el, baseUrl) {
  const contenitore = $(el).closest('article, li, .post, .entry, div');
  const scope = contenitore.length ? contenitore : $(el).parent();
  const link = scope.find('a[href]').first();
  if (!link.length) return null;
  try {
    return new URL(link.attr('href'), baseUrl).toString();
  } catch (e) {
    return null;
  }
}

// STEP 2.3 — fallback: markup della pagina di elenco (<time>, meta datePublished/article:published_time,
// pattern di data in italiano nel testo).
function estraiVociDaMarkup(html, baseUrl) {
  const $ = cheerio.load(html);
  const voci = [];

  $('time[datetime]').each((_, el) => {
    const d = new Date($(el).attr('datetime'));
    if (isNaN(d)) return;
    voci.push({ titolo: trovaTitoloVicino($, el), data: d, fonte: 'markup', url: baseUrl ? trovaUrlVicino($, el, baseUrl) : null });
  });

  $('[itemprop="datePublished"], meta[property="article:published_time"]').each((_, el) => {
    const val = $(el).attr('content') || $(el).attr('datetime') || $(el).text();
    const d = new Date(val);
    if (isNaN(d)) return;
    voci.push({ titolo: null, data: d, fonte: 'markup' });
  });

  if (!voci.length) {
    const testo = $('body').text();
    const now = Date.now();

    const isoRe = /\b(20\d{2})-(\d{2})-(\d{2})\b/g;
    let m;
    while ((m = isoRe.exec(testo))) {
      const d = new Date(`${m[1]}-${m[2]}-${m[3]}`);
      if (!isNaN(d) && d.getTime() <= now + 86400000) voci.push({ titolo: null, data: d, fonte: 'markup' });
    }

    const itRe = new RegExp(`\\b(\\d{1,2})\\s+(${MONTHS_IT.join('|')})\\s+(20\\d{2})\\b`, 'gi');
    while ((m = itRe.exec(testo))) {
      const meseIdx = MONTHS_IT.findIndex((mo) => mo === m[2].toLowerCase());
      const d = new Date(Number(m[3]), meseIdx, Number(m[1]));
      if (!isNaN(d) && d.getTime() <= now + 86400000) voci.push({ titolo: null, data: d, fonte: 'markup' });
    }

    const numRe = /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/g;
    while ((m = numRe.exec(testo))) {
      const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
      if (!isNaN(d) && d.getTime() <= now + 86400000) voci.push({ titolo: null, data: d, fonte: 'markup' });
    }
  }

  return voci;
}

// Funzione di raccolta dati condivisa (spec: "UNA SOLA funzione di raccolta dati condivisa").
// pagineHtml: le pagine già scaricate dall'audit tecnico (home + pagine interne individuate).
async function raccogliArticoli(baseUrl, pagineHtml) {
  const sezione = individuaSezione(baseUrl, pagineHtml);
  if (!sezione.trovata) {
    return { sezioneTrovata: false, url: null, articoli: [] };
  }

  let articoli = [];

  const vociSitemap = await getSitemapEntries(baseUrl).catch(() => []);
  articoli = estraiVociDaSitemap(vociSitemap, sezione.url);

  if (!articoli.length) {
    articoli = await provaFeed(sezione.url).catch(() => []);
  }

  if (!articoli.length) {
    const res = await fetchPage(sezione.url, { timeoutMs: 8000, maxBytes: 3_000_000 });
    if (res.ok && res.html) {
      articoli = estraiVociDaMarkup(res.html, sezione.url);
    }
  }

  articoli.sort((a, b) => b.data - a.data);
  return { sezioneTrovata: true, url: sezione.url, articoli };
}

// STEP 3 — metriche calcolate sulle date raccolte.
function calcolaMetriche(articoli, ora = new Date()) {
  const date = (articoli || [])
    .map((a) => a.data)
    .filter((d) => d instanceof Date && !isNaN(d))
    .sort((a, b) => b - a);

  if (!date.length) {
    return {
      ultimoArticolo: null,
      articoli6Mesi: 0,
      articoli12Mesi: 0,
      intervalloMedioGiorni: null,
      gapMassimoGiorni: null,
      gapMassimoGiorni6Mesi: null,
    };
  }

  const seiMesiFa = new Date(ora.getTime() - 182 * GIORNO_MS);
  const dodiciMesiFa = new Date(ora.getTime() - 365 * GIORNO_MS);

  const in6Mesi = date.filter((d) => d >= seiMesiFa);
  const in12Mesi = date.filter((d) => d >= dodiciMesiFa);

  const gapMassimo = (lista) => {
    if (lista.length < 2) return null;
    const crescente = [...lista].sort((a, b) => a - b);
    let max = 0;
    for (let i = 1; i < crescente.length; i++) {
      max = Math.max(max, (crescente[i] - crescente[i - 1]) / GIORNO_MS);
    }
    return Math.round(max);
  };

  const intervalloMedio = (lista) => {
    if (lista.length < 2) return null;
    const crescente = [...lista].sort((a, b) => a - b);
    const totale = crescente[crescente.length - 1] - crescente[0];
    return Math.round(totale / GIORNO_MS / (crescente.length - 1));
  };

  return {
    ultimoArticolo: date[0],
    articoli6Mesi: in6Mesi.length,
    articoli12Mesi: in12Mesi.length,
    // intervallo medio e gap più lungo: calcolati sugli ultimi 12 mesi, come da spec STEP 3.
    intervalloMedioGiorni: intervalloMedio(in12Mesi),
    gapMassimoGiorni: gapMassimo(in12Mesi),
    // gap più lungo ristretto agli ultimi 6 mesi: usato dal giudizio "rallentato" (STEP 4), che
    // parla esplicitamente di gap "negli ultimi 6 mesi" distinto dal gap a 12 mesi riportato sopra.
    gapMassimoGiorni6Mesi: gapMassimo(in6Mesi),
  };
}

// STEP 4 — giudizio. Nota: quando l'ultimo articolo è recente (<=30gg) e il gap non è ampio, ma la
// frequenza degli ultimi 6 mesi non raggiunge la soglia "attivo", il caso residuo è trattato come
// "rallentato" (non esplicitamente coperto dalla spec, ma coerente con "soglie regolabili").
function calcolaStato(sezioneTrovata, metriche) {
  if (!sezioneTrovata) return 'assente';
  if (!metriche.ultimoArticolo) return 'fermo';

  const giorniDaUltimo = Math.round((Date.now() - metriche.ultimoArticolo.getTime()) / GIORNO_MS);

  if (giorniDaUltimo > SOGLIE.rallentatoGiorniMax) return 'fermo';

  const gapAmpio = metriche.gapMassimoGiorni6Mesi != null && metriche.gapMassimoGiorni6Mesi > SOGLIE.gapRallentatoGiorni;
  if (giorniDaUltimo > SOGLIE.attivoGiorni || gapAmpio) return 'rallentato';

  if (metriche.articoli6Mesi >= SOGLIE.attivoArticoliMinimiSeiMesi) return 'attivo';

  return 'rallentato';
}

// STEP 5 — confronto tra cadenza dichiarata dal cliente e cadenza verificata.
function confrontaCadenza(cadenzaDichiarata, intervalloMedioGiorni) {
  if (!cadenzaDichiarata || intervalloMedioGiorni == null) return null;

  const chiave = String(cadenzaDichiarata).trim().toLowerCase();
  const atteso = CADENZA_ATTESA_GIORNI[chiave];
  if (!atteso) return null;

  return {
    dichiarata: cadenzaDichiarata,
    intervalloAttesoGiorni: atteso,
    intervalloVerificatoGiorni: intervalloMedioGiorni,
    // divergenza significativa se l'intervallo reale è più del doppio di quello dichiarato.
    divergente: intervalloMedioGiorni > atteso * 2,
  };
}

function costruisciMessaggio(stato, metriche) {
  if (stato === 'assente') return 'Nessuna sezione news/blog individuata sul sito.';
  if (!metriche.ultimoArticolo) {
    return 'Sezione news/blog trovata, ma non è stato possibile individuare date di pubblicazione degli articoli.';
  }

  const giorniDaUltimo = Math.round((Date.now() - metriche.ultimoArticolo.getTime()) / GIORNO_MS);
  const dataTxt = metriche.ultimoArticolo.toLocaleDateString('it-IT');
  let messaggio = `Ultimo articolo pubblicato il ${dataTxt} (${giorniDaUltimo} giorni fa).`;

  if (metriche.gapMassimoGiorni6Mesi != null && metriche.gapMassimoGiorni6Mesi > SOGLIE.gapRallentatoGiorni) {
    messaggio += ` Il gap più lungo tra due pubblicazioni negli ultimi 6 mesi è di ${metriche.gapMassimoGiorni6Mesi} giorni.`;
  }

  return messaggio;
}

// STEP 6 — output finale del criterio, a partire dal risultato di raccogliArticoli().
// opzioni.cadenzaDichiarata: risposta del questionario "Con quale cadenza pensate di pubblicare?"
// (chiave tra 'settimanale'|'quindicinale'|'mensile'|'trimestrale', quando la domanda esisterà).
function giudicaContenuti(raccolta, opzioni = {}) {
  const metriche = calcolaMetriche(raccolta.articoli);
  const stato = calcolaStato(raccolta.sezioneTrovata, metriche);
  const divergenzaCadenza = confrontaCadenza(opzioni.cadenzaDichiarata, metriche.intervalloMedioGiorni);

  return {
    stato,
    sezioneTrovata: raccolta.sezioneTrovata,
    url: raccolta.url,
    ultimoArticolo: metriche.ultimoArticolo,
    articoli6Mesi: metriche.articoli6Mesi,
    articoli12Mesi: metriche.articoli12Mesi,
    intervalloMedioGiorni: metriche.intervalloMedioGiorni,
    gapMassimoGiorni: metriche.gapMassimoGiorni,
    divergenzaCadenza,
    messaggio: costruisciMessaggio(stato, metriche),
  };
}

// ---------------------------------------------------------------------------
// Criteri aggiuntivi del nuovo step dedicato "Attività editoriale" (richiesta di Andrea,
// 2026-10-01): frequenza (soglie ridefinite in post/mese), ottimizzazione dell'articolo più
// recente, relazione dei contenuti del blog con le competenze dichiarate/confermate dall'utente
// (passaggi 3/4/5 del wizard, disponibili solo a questo punto perché il nuovo step gira dopo).

// Soglie richieste esplicitamente da Andrea: "1/2 post a settimana" = ottimo, "meno di 1 post a
// settimana" (= ~3 al mese) = sufficiente, "un post ogni due settimane o meno" (<=2 al mese) =
// insufficiente. Calcolate su una finestra di 60 giorni (2 mesi) per avere un campione recente.
const GIORNI_FINESTRA_FREQUENZA = 60;
const SOGLIE_FREQUENZA_EDITORIALE = { ottimoAlMese: 4, sufficienteAlMese: 3 };

function calcolaFrequenzaEditoriale(articoli, ora = new Date()) {
  const sogliaData = new Date(ora.getTime() - GIORNI_FINESTRA_FREQUENZA * GIORNO_MS);
  const recenti = (articoli || []).filter((a) => a.data instanceof Date && !isNaN(a.data) && a.data >= sogliaData);
  const postsAlMese = Math.round((recenti.length / (GIORNI_FINESTRA_FREQUENZA / 30)) * 10) / 10;

  let livello;
  if (postsAlMese >= SOGLIE_FREQUENZA_EDITORIALE.ottimoAlMese) livello = 'ottimo';
  else if (postsAlMese >= SOGLIE_FREQUENZA_EDITORIALE.sufficienteAlMese) livello = 'sufficiente';
  else livello = 'insufficiente';

  const ETICHETTE = { ottimo: 'Ottimo', sufficiente: 'Sufficiente', insufficiente: 'Insufficiente' };
  const COLORI = { ottimo: 'verde', sufficiente: 'arancione', insufficiente: 'rosso' };

  return {
    postsAlMese,
    livello,
    etichetta: ETICHETTE[livello],
    colore: COLORI[livello],
  };
}

// Trova l'URL dell'articolo più recente tra quelli raccolti (serve ad aprirne la pagina per
// l'analisi di ottimizzazione). Può essere null se nessuna fonte ha restituito un link diretto
// (es. fallback a soli pattern di data nel testo, senza ancora vicina riconoscibile).
function trovaUrlArticoloPiuRecente(articoli) {
  const conData = (articoli || [])
    .filter((a) => a.url && a.data instanceof Date && !isNaN(a.data))
    .sort((a, b) => b.data - a.data);
  return conData.length ? conData[0].url : null;
}

// Come trovaUrlArticoloPiuRecente, ma ritorna fino a `n` URL (richiesta di Andrea, 2026-10-03:
// l'ottimizzazione va verificata sugli ultimi 3 articoli, non solo sull'ultimo — un solo articolo
// non è rappresentativo di come la scuola scrive di solito).
function trovaUrlUltimiArticoli(articoli, n = 3) {
  const conData = (articoli || [])
    .filter((a) => a.url && a.data instanceof Date && !isNaN(a.data))
    .sort((a, b) => b.data - a.data);
  return conData.slice(0, n).map((a) => a.url);
}

const PATTERN_ALT_NON_SIGNIFICATIVO = /^(img|image|dsc|photo|foto|screenshot|untitled|senza\s*titolo|wp[-_ ]?image)[-_ ]?\d*$/i;

function altNonSignificativo(alt) {
  const a = (alt || '').trim();
  if (!a) return true;
  if (/^\d+$/.test(a)) return true;
  return PATTERN_ALT_NON_SIGNIFICATIVO.test(a);
}

// Analizza l'articolo più recente: metadescription (solo excerpt o no), link interni/esterni,
// qualità di nomi/alt delle immagini. Lavora sulla pagina HTML già scaricata dal chiamante.
function analizzaOttimizzazioneArticolo(html, articleUrl) {
  const $ = cheerio.load(html);
  const container = $('article, .entry-content, .post-content, .single-content, main').first();
  const scope = container.length ? container : $('body');

  const metaDescription = ($('meta[name="description"]').attr('content') || '').trim();
  const primoParagrafo = scope.find('p').first().text().trim();

  const normalizza = (t) => t.toLowerCase().replace(/\s+/g, ' ').replace(/[.…]+$/, '').trim();
  let metaDescrizioneSoloExcerpt = false;
  if (metaDescription && primoParagrafo) {
    const metaNorm = normalizza(metaDescription);
    const paraNorm = normalizza(primoParagrafo);
    metaDescrizioneSoloExcerpt = paraNorm.startsWith(metaNorm) || metaNorm.startsWith(paraNorm.slice(0, Math.min(60, paraNorm.length)));
  }

  let origin = null;
  try {
    origin = articleUrl ? new URL(articleUrl).hostname : null;
  } catch (e) {
    origin = null;
  }

  let linkInterni = 0;
  let linkEsterni = 0;
  scope.find('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#')) return;
    try {
      const abs = new URL(href, articleUrl || undefined);
      if (origin && abs.hostname === origin) linkInterni++;
      else if (origin) linkEsterni++;
    } catch (e) {
      /* href non valido/relativo senza base: ignora */
    }
  });

  let immaginiTotali = 0;
  let immaginiNonSignificative = 0;
  scope.find('img').each((_, el) => {
    immaginiTotali++;
    if (altNonSignificativo($(el).attr('alt'))) immaginiNonSignificative++;
  });

  const problemi = [
    metaDescrizioneSoloExcerpt,
    linkInterni === 0,
    linkEsterni === 0,
    immaginiTotali > 0 && immaginiNonSignificative === immaginiTotali,
  ].filter(Boolean).length;

  let livello;
  if (problemi <= 1) livello = 'buona';
  else if (problemi === 2) livello = 'parziale';
  else livello = 'scarsa';

  const COLORI = { buona: 'verde', parziale: 'arancione', scarsa: 'rosso' };

  return {
    metaDescrizioneSoloExcerpt,
    linkInterni,
    linkEsterni,
    immaginiTotali,
    immaginiNonSignificative,
    livello,
    colore: COLORI[livello],
  };
}

// Aggrega i risultati di analizzaOttimizzazioneArticolo su più articoli (fino a 3, i più recenti)
// in un unico giudizio complessivo: cautelativo, quindi basato sul caso peggiore — un solo
// articolo scritto male tra gli ultimi pubblicati è comunque un problema da segnalare, non va
// "annacquato" nella media. "buona" solo se tutti gli articoli analizzati sono buoni, "scarsa" se
// almeno uno è scarso, altrimenti "parziale".
function aggregaOttimizzazione(risultatiArticoli) {
  const validi = (risultatiArticoli || []).filter(Boolean);
  if (!validi.length) return null;

  let livello;
  if (validi.some((r) => r.livello === 'scarsa')) livello = 'scarsa';
  else if (validi.every((r) => r.livello === 'buona')) livello = 'buona';
  else livello = 'parziale';

  const COLORI = { buona: 'verde', parziale: 'arancione', scarsa: 'rosso' };

  return {
    livello,
    colore: COLORI[livello],
    numeroArticoliAnalizzati: validi.length,
    articoli: validi,
  };
}

// Confronta i temi/competenze individuati nel contenuto del blog (stesso vocabolario di
// lib/temi.js, già usato per il sito nel suo complesso) con le competenze dichiarate/confermate
// dall'utente ai passaggi 3/4/5. "Presente" (verde) se almeno una competenza dichiarata trova
// riscontro nei contenuti del blog, "assente" (rosso) altrimenti.
function relazioneCompetenze(pagineBlogHtml, competenze) {
  const chiavi = new Set((competenze || []).filter((c) => c.key).map((c) => c.key));
  if (!chiavi.size || !(pagineBlogHtml || []).length) {
    return { presente: false, temiCorrelati: [] };
  }

  const { temiTrovati } = estraiTemi(pagineBlogHtml);
  const correlati = temiTrovati.filter((t) => chiavi.has(t.key));

  return {
    presente: correlati.length > 0,
    temiCorrelati: correlati.map((t) => t.label),
  };
}

module.exports = {
  raccogliArticoli,
  giudicaContenuti,
  individuaSezione,
  calcolaMetriche,
  estraiVociDaMarkup,
  parseFeed,
  SOGLIE,
  calcolaFrequenzaEditoriale,
  trovaUrlArticoloPiuRecente,
  trovaUrlUltimiArticoli,
  analizzaOttimizzazioneArticolo,
  aggregaOttimizzazione,
  relazioneCompetenze,
  SOGLIE_FREQUENZA_EDITORIALE,
};
