const { fetchPage } = require('./http');
const { discoverInternalPages } = require('./pages');
const { analyzePage } = require('./analyzePage');
const { checkSitemap } = require('./sitemap');
const { getMobileSpeedScore } = require('./pagespeed');
const { computeSiteScore } = require('./score');

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

  const [sitemapPresent, mobileSpeed] = await Promise.all([
    checkSitemap(homeUrl),
    getMobileSpeedScore(homeUrl, homeFetch),
  ]);

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
    ...risultato,
  };
}

module.exports = { runAudit, normalizeUrl };
