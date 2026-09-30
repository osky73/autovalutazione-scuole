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
    .map((v) => ({ titolo: null, data: v.lastmod, fonte: 'sitemap' }));
}

// STEP 2.2 — date da feed RSS/Atom, provando alcuni path comuni relativi alla sezione trovata.
function parseFeed(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const voci = [];

  $('item').each((_, el) => {
    const titolo = $(el).find('title').first().text().trim() || null;
    const pubDateTxt = $(el).find('pubDate').first().text().trim();
    const data = pubDateTxt ? new Date(pubDateTxt) : null;
    if (data && !isNaN(data)) voci.push({ titolo, data, fonte: 'feed' });
  });

  $('entry').each((_, el) => {
    const titolo = $(el).find('title').first().text().trim() || null;
    const pubTxt = $(el).find('published').first().text().trim() || $(el).find('updated').first().text().trim();
    const data = pubTxt ? new Date(pubTxt) : null;
    if (data && !isNaN(data)) voci.push({ titolo, data, fonte: 'feed' });
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

// STEP 2.3 — fallback: markup della pagina di elenco (<time>, meta datePublished/article:published_time,
// pattern di data in italiano nel testo).
function estraiVociDaMarkup(html) {
  const $ = cheerio.load(html);
  const voci = [];

  $('time[datetime]').each((_, el) => {
    const d = new Date($(el).attr('datetime'));
    if (isNaN(d)) return;
    voci.push({ titolo: trovaTitoloVicino($, el), data: d, fonte: 'markup' });
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
      articoli = estraiVociDaMarkup(res.html);
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

module.exports = {
  raccogliArticoli,
  giudicaContenuti,
  individuaSezione,
  calcolaMetriche,
  estraiVociDaMarkup,
  parseFeed,
  SOGLIE,
};
