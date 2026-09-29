const { URL } = require('url');
const cheerio = require('cheerio');
const { fetchPage } = require('./http');

const BLOCCO_RE = /(unusual traffic|traffico intenso|verifica di non essere un robot|\/sorry\/|recaptcha)/i;

const DOMINI_DA_IGNORARE = /(^|\.)google\.[a-z.]+$|(^|\.)gstatic\.com$|(^|\.)googleusercontent\.com$/i;

async function cercaSuGoogle(query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=30&hl=it&gl=it&pws=0`;
  const res = await fetchPage(url, { timeoutMs: 9000, maxBytes: 3_000_000 });
  if (!res.ok) return { ok: false, error: res.error || `HTTP ${res.status}` };
  if (BLOCCO_RE.test(res.html)) {
    return { ok: false, error: 'Google ha bloccato la richiesta automatica (rilevamento anti-bot)' };
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

async function verificaPosizionamentoCluster(valori, homeUrl) {
  const hostAtteso = new URL(homeUrl).hostname;

  return Promise.all(
    valori.map(async ({ label, queries }) => {
      const risultatiQuery = await Promise.all(
        queries.map(async (query) => {
          const ricerca = await cercaSuGoogle(query);
          if (!ricerca.ok) {
            return { query, disponibile: false, motivo: ricerca.error };
          }
          const urls = estraiUrlOrganici(ricerca.html);
          const posizione = trovaPosizione(urls, hostAtteso);
          return { query, disponibile: true, posizione, risultatiAnalizzati: urls.length };
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

module.exports = { verificaPosizionamentoCluster };
