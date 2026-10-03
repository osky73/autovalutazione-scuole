const cheerio = require('cheerio');
const { URL } = require('url');
const { fetchPage } = require('./http');
const { getSitemapEntries } = require('./sitemap');
const { temiDaIndirizzo } = require('./temi');

const KEYWORDS = [
  { key: 'chi-siamo', patterns: [/chi-siamo/i, /chisiamo/i, /la-scuola/i, /istituto/i, /about/i] },
  { key: 'iscrizioni', patterns: [/iscrizion/i, /ammission/i, /enrol/i] },
  { key: 'contatti', patterns: [/contatt/i, /contact/i] },
  { key: 'notizie', patterns: [/notizi/i, /news/i, /blog/i, /attualit/i] },
];

function absolutize(base, href) {
  try {
    return new URL(href, base).toString();
  } catch (e) {
    return null;
  }
}

function sameHost(a, b) {
  try {
    return new URL(a).host.replace(/^www\./, '') === new URL(b).host.replace(/^www\./, '');
  } catch (e) {
    return false;
  }
}

function discoverInternalPages(homeUrl, homeHtml, limit = 3) {
  const $ = cheerio.load(homeHtml);
  const found = new Map();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const abs = absolutize(homeUrl, href);
    if (!abs || !sameHost(homeUrl, abs)) return;
    const clean = abs.split('#')[0];
    if (clean === homeUrl || clean === homeUrl + '/') return;

    for (const { key, patterns } of KEYWORDS) {
      if (found.has(key)) continue;
      if (patterns.some((p) => p.test(clean))) {
        found.set(key, clean);
        break;
      }
    }
  });

  return Array.from(found.values()).slice(0, limit);
}


// --- Raccolta delle pagine da leggere (richiesta di Andrea, 2026-10-03) ---
// Oltre alla home e alle (al massimo) 4 pagine generiche già lette (chi siamo, iscrizioni, contatti,
// notizie), si leggono fino a MAX_PAGINE_EXTRA pagine in più, scelte così:
//  1) si cerca la sitemap (sitemap.xml, robots.txt, wp-sitemap.xml); se non c'è si usano i link della home;
//  2) se tra gli indirizzi ci sono pagine "specifiche" (l'indirizzo contiene una parola chiave di una
//     competenza, es. /certificazioni-linguistiche/) si leggono quelle;
//  3) altrimenti si leggono le pagine statiche del sito e gli ultimi ARTICOLI_MAX articoli, se ci sono.
const MAX_PAGINE_EXTRA = 10;
const ARTICOLI_MAX = 5;
const STATICHE_MAX_PROFONDITA = 2;

const ESTENSIONI_NON_PAGINA = /\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|pptx?|mp3|mp4|xml|css|js|ico)(\?|$)/i;
const INDIRIZZI_DA_SCARTARE = /(\/feed\/?$|\/tag\/|\/category\/|\/author\/|\/wp-(json|admin|content|login)|\/page\/\d+|[?&](replytocom|share|print)=|privacy|cookie|login|carrello|cart\b|\/search)/i;
const INDIRIZZO_ARTICOLO = /(\/\d{4}\/\d{1,2}(\/|$)|\/(news|notizie|notizia|blog|comunicati|avvisi|circolari|eventi|novita)\/[^/]+)/i;

function chiave(url) {
  return url.split('#')[0].replace(/\/+$/, '').replace(/^https?:\/\/(www\.)?/i, '').toLowerCase();
}

function profondita(url) {
  try {
    return new URL(url).pathname.split('/').filter(Boolean).length;
  } catch (e) {
    return 99;
  }
}

function eArticolo(url) {
  try {
    return INDIRIZZO_ARTICOLO.test(new URL(url).pathname);
  } catch (e) {
    return false;
  }
}

// Candidati: voci della sitemap (con lastmod) oppure, se la sitemap manca, link interni della home.
function candidatiDaHome(homeUrl, homeHtml) {
  const $ = cheerio.load(homeHtml || '');
  const voci = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) return;
    const abs = absolutize(homeUrl, href);
    if (abs && /^https?:/i.test(abs) && sameHost(homeUrl, abs)) voci.push({ loc: abs.split('#')[0], lastmod: null });
  });
  return voci;
}

// Funzione pura (testabile): sceglie quali indirizzi leggere, dati i candidati e quelli già letti.
function scegliPagineExtra(candidati, giaLette, homeUrl, { max = MAX_PAGINE_EXTRA, articoliMax = ARTICOLI_MAX } = {}) {
  const viste = new Set([...giaLette, homeUrl].map(chiave));
  const utili = [];
  for (const c of candidati) {
    if (!c.loc || !/^https?:/i.test(c.loc) || !sameHost(homeUrl, c.loc)) continue;
    if (ESTENSIONI_NON_PAGINA.test(c.loc) || INDIRIZZI_DA_SCARTARE.test(c.loc)) continue;
    const k = chiave(c.loc);
    if (!k.includes('/') || viste.has(k)) continue; // home o già letta
    viste.add(k);
    utili.push(c);
  }

  const slots = Math.max(0, max);
  const specifiche = utili
    .filter((c) => !eArticolo(c.loc) && temiDaIndirizzo(c.loc).length > 0)
    .sort((a, b) => profondita(a.loc) - profondita(b.loc) || temiDaIndirizzo(b.loc).length - temiDaIndirizzo(a.loc).length);

  if (specifiche.length) {
    return { tipo: 'specifiche', urls: specifiche.slice(0, slots).map((c) => c.loc) };
  }

  const articoli = utili
    .filter((c) => eArticolo(c.loc))
    .sort((a, b) => (b.lastmod ? b.lastmod.getTime() : 0) - (a.lastmod ? a.lastmod.getTime() : 0))
    .slice(0, Math.min(articoliMax, slots));
  const statiche = utili
    .filter((c) => !eArticolo(c.loc) && profondita(c.loc) <= STATICHE_MAX_PROFONDITA)
    .sort((a, b) => profondita(a.loc) - profondita(b.loc))
    .slice(0, Math.max(0, slots - articoli.length));

  return { tipo: 'statiche_articoli', urls: [...statiche, ...articoli].map((c) => c.loc), statiche: statiche.length, articoli: articoli.length };
}

// Scarica le pagine extra. fetchImpl/sitemapImpl sono iniettabili per i test.
async function raccogliPagineExtra(homeUrl, homeHtml, giaLette, { fetchImpl = fetchPage, sitemapImpl = getSitemapEntries, max = MAX_PAGINE_EXTRA } = {}) {
  let voci = [];
  let daSitemap = false;
  try {
    voci = await sitemapImpl(homeUrl);
    daSitemap = voci.length > 0;
  } catch (e) {
    voci = [];
  }
  if (!voci.length) voci = candidatiDaHome(homeUrl, homeHtml);

  const scelta = scegliPagineExtra(voci, giaLette, homeUrl, { max });
  const fetches = await Promise.all(scelta.urls.map((u) => fetchImpl(u, { timeoutMs: 7000 })));
  const pagine = scelta.urls.map((url, i) => ({ url, fetch: fetches[i] })).filter((p) => p.fetch && p.fetch.ok && p.fetch.html);

  return { pagine, sitemap: daSitemap, tipo: scelta.tipo, richieste: scelta.urls.length };
}

module.exports = { discoverInternalPages, scegliPagineExtra, raccogliPagineExtra, MAX_PAGINE_EXTRA };
