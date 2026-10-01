const { fetchPage } = require('./http');
const { discoverInternalPages } = require('./pages');
const { analyzePage } = require('./analyzePage');
const { checkSitemap } = require('./sitemap');
const { getMobileSpeedScore } = require('./pagespeed');
const { computeSiteScore } = require('./score');
const { raccogliArticoli, giudicaContenuti } = require('./contenuti');
const { analizzaNewsletter } = require('./newsletter');

function normalizeUrl(input) {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

async function runAudit(rawUrl) {
  const homeUrl = normalizeUrl(rawUrl);
  const homeFetch = await fetchPage(homeUrl);

  if (!homeFetch.ok) {
    return {
      ok: false,
      error: homeFetch.error || `Il sito ha risposto con codice ${homeFetch.status}`,
      homeUrl,
    };
  }

  const internalUrls = discoverInternalPages(homeUrl, homeFetch.html, 3);
  const otherFetches = await Promise.all(internalUrls.map((u) => fetchPage(u)));

  const allFetches = [{ url: homeUrl, fetch: homeFetch }, ...internalUrls.map((u, i) => ({ url: u, fetch: otherFetches[i] }))];

  const pages = allFetches.map(({ url, fetch }) => analyzePage(fetch, url));
  const pagineHtml = allFetches.filter((f) => f.fetch.ok).map((f) => f.fetch.html);

  // Criterio "Newsletter" (blocco Nurturing, TASKS.md punto 2): per spec va eseguito in background
  // durante l'audit tecnico iniziale, indipendentemente dalla risposta dichiarata dall'utente nel
  // questionario (non ancora esistente - vedi nota in TASKS.md). Analizza solo le pagine già
  // raccolte (home + pagine interne individuate), nessuna richiesta di rete aggiuntiva.
  let newsletter;
  try {
    newsletter = analizzaNewsletter(pagineHtml);
  } catch (e) {
    newsletter = { stato: 'assente', sottocaso: 'nessun_meccanismo', verificaA: false, verificaB: false, verificaDeterminante: null, piattaforma: null, piattaformaChiave: null, messaggio: 'Analisi non riuscita.' };
  }

  const [sitemapPresent, mobileSpeed, raccoltaContenuti] = await Promise.all([
    checkSitemap(homeUrl),
    getMobileSpeedScore(homeUrl, homeFetch),
    // Criterio "Aggiornamento dei contenuti / Blog" (blocco Nurturing, TASKS.md punto 1): girato in
    // background durante l'audit tecnico iniziale, così è pronto a prescindere da come procede il
    // resto del wizard (stessa logica richiesta dalla spec del criterio newsletter).
    raccogliArticoli(homeUrl, pagineHtml).catch(() => ({ sezioneTrovata: false, url: null, articoli: [] })),
  ]);

  // La cadenza dichiarata dal cliente (nuova domanda del blocco "Nurturing") non è ancora raccolta
  // a questo punto del wizard (arriva dopo, nel passaggio di dichiarazione) né esiste ancora nel
  // questionario: il confronto dello STEP 5 resta quindi "null" finché quella domanda non c'è.
  const contenuti = giudicaContenuti(raccoltaContenuti);

  const lastDateFound = pages
    .filter((p) => p.reachable && p.lastDateFound)
    .map((p) => new Date(p.lastDateFound))
    .sort((a, b) => b - a)[0] || null;

  const googleBusinessLink = pages.some((p) => p.reachable && p.googleBusinessLink);

  const risultato = computeSiteScore({
    pages,
    sitemapPresent,
    mobileSpeedScore: mobileSpeed.score,
    googleBusinessLink,
    lastDateFound,
  });

  return {
    ok: true,
    homeUrl,
    pages,
    pagineHtml,
    sitemapPresent,
    mobileSpeed,
    contenuti,
    // Raccolta grezza (articoli con data/url, non solo le metriche aggregate): serve al nuovo
    // step dedicato "Attività editoriale" (passaggio 9), che gira più avanti nel wizard e deve
    // calcolare la frequenza con le sue soglie e recuperare l'URL dell'articolo più recente.
    raccoltaContenuti,
    newsletter,
    ...risultato,
  };
}

module.exports = { runAudit, normalizeUrl };
