const { URL } = require('url');
const cheerio = require('cheerio');
const { fetchPage } = require('./http');

const BLOCCO_RE =
  /(unusual traffic|traffico intenso|verifica di non essere un robot|\/sorry\/|recaptcha|abilita\s*javascript|enable\s*javascript|abilitare\s+i\s+cookie|our systems have detected|prima di continuare|non è un robot)/i;

const DOMINI_DA_IGNORARE = /(^|\.)google\.[a-z.]+$|(^|\.)gstatic\.com$|(^|\.)googleusercontent\.com$/i;

// Una vera pagina di risultati Google contiene il contenitore dei risultati organici e più tag
// <h3> (i titoli dei singoli risultati). Quando Google serve al posto dei risultati un interstitial
// "per continuare, abilita JavaScript e i cookie" (il caso osservato dal server di produzione,
// bloccato per TUTTE le query a prescindere dal testo cercato — segnalato da Andrea il 2026-10-01:
// "scuola media potenziamento inglese Milano" risultava "non trovata" pur comparendo in prima
// pagina su Google), il body è minuscolo e non contiene questi marker. BLOCCO_RE da solo non basta
// a riconoscerlo (il testo esatto dell'interstitial può cambiare nel tempo e non corrisponde a
// nessuno dei pattern noti), quindi in aggiunta trattiamo come "bloccato" anche una risposta 200
// che non somiglia strutturalmente a una pagina di risultati — invece di concludere silenziosamente
// "nessun risultato trovato" (falso negativo).
function sembraPaginaRisultati(html) {
  const haContenitoreRisultati = /id="search"|id="rso"/i.test(html);
  const numeroTitoli = (html.match(/<h3[\s>]/gi) || []).length;
  return haContenitoreRisultati && numeroTitoli >= 3;
}

async function cercaSuGoogle(query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=it&gl=it&pws=0`;
  const res = await fetchPage(url, { timeoutMs: 9000, maxBytes: 3_000_000 });
  if (!res.ok) return { ok: false, error: res.error || `HTTP ${res.status}` };
  if (BLOCCO_RE.test(res.html)) {
    return { ok: false, error: 'Google ha bloccato la richiesta automatica (rilevamento anti-bot)' };
  }
  if (!sembraPaginaRisultati(res.html)) {
    return { ok: false, error: 'Google non ha restituito una pagina di risultati valida (probabile blocco anti-bot non riconosciuto)' };
  }
  return { ok: true, html: res.html };
}

function estraiUrlOrganici(html) {
  const $ = cheerio.load(html);
  const urls = [];
  $('a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href');
    try {
      const host = new URL(href).hostname;
      if (!DOMINI_DA_IGNORARE.test(host)) urls.push(href);
    } catch (e) {
      /* href non valido: ignora */
    }
  });
  return Array.from(new Set(urls));
}

function trovaPosizione(urls, hostAtteso) {
  const norm = (h) => h.replace(/^www\./i, '').toLowerCase();
  const target = norm(hostAtteso);
  for (let i = 0; i < urls.length; i++) {
    try {
      const host = norm(new URL(urls[i]).hostname);
      if (host === target) return i + 1;
    } catch (e) {
      /* ignora */
    }
  }
  return null;
}

// Ricerca tramite l'API Serper (https://serper.dev): restituisce l'elenco REALE dei risultati
// organici di Google (con posizione), senza passare dal blocco anti-bot che colpisce la lettura
// diretta di google.com dai server Vercel. Attiva solo se è impostata SERPER_API_KEY.
const SERPER_URL = 'https://google.serper.dev/search';

async function cercaConSerper(query, { fetchImpl = globalThis.fetch, timeoutMs = 9000 } = {}) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return { ok: false, error: 'SERPER_API_KEY non configurata', nonConfigurato: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(SERPER_URL, {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'it', hl: 'it', num: 10, autocorrect: false }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, error: `Serper HTTP ${res.status}` };
    const json = await res.json();
    const organici = Array.isArray(json && json.organic) ? json.organic : [];
    // Ordine per `position` (se presente), poi solo i link http(s) validi, senza duplicati.
    const urls = Array.from(
      new Set(
        organici
          .slice()
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((o) => o && o.link)
          .filter((l) => typeof l === 'string' && /^https?:\/\//i.test(l))
      )
    );
    return { ok: true, urls, fonte: 'serper' };
  } catch (e) {
    return { ok: false, error: e && e.name === 'AbortError' ? 'Serper: timeout' : `Serper: ${(e && e.message) || 'errore'}` };
  } finally {
    clearTimeout(timer);
  }
}

// Orchestratore: prima Serper (se configurato); se non disponibile o in errore, ripiega sulla
// lettura diretta di Google (che può essere bloccata: in quel caso l'errore viene riportato).
async function cercaRisultati(query, opzioni = {}) {
  const serper = await cercaConSerper(query, opzioni);
  if (serper.ok) return serper;

  const google = await cercaSuGoogle(query);
  if (google.ok) return { ok: true, urls: estraiUrlOrganici(google.html), fonte: 'google' };

  const motivo = serper.nonConfigurato ? google.error : `${serper.error}; ${google.error}`;
  return { ok: false, error: motivo };
}

async function verificaPosizionamentoCluster(valori, homeUrl) {
  const hostAtteso = new URL(homeUrl).hostname;

  return Promise.all(
    valori.map(async ({ label, queries }) => {
      const risultatiQuery = await Promise.all(
        queries.map(async (query) => {
          const ricerca = await cercaRisultati(query);
          if (!ricerca.ok) {
            return { query, disponibile: false, motivo: ricerca.error };
          }
          const urls = ricerca.urls;
          const posizione = trovaPosizione(urls, hostAtteso);
          return { query, disponibile: true, posizione, risultatiAnalizzati: urls.length, fonte: ricerca.fonte };
        })
      );

      const trovate = risultatiQuery.filter((r) => r.disponibile && r.posizione);
      trovate.sort((a, b) => a.posizione - b.posizione);
      const migliore = trovate[0] || null;
      const disponibile = risultatiQuery.some((r) => r.disponibile);

      return { label, migliore, risultatiQuery, disponibile };
    })
  );
}

module.exports = { verificaPosizionamentoCluster, cercaConSerper, cercaRisultati, trovaPosizione };
