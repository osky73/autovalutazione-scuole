const cheerio = require('cheerio');
const { fetchPage } = require('./http');
const { URL } = require('url');

async function checkSitemap(baseUrl) {
  const origin = new URL(baseUrl).origin;

  const direct = await fetchPage(origin + '/sitemap.xml', { timeoutMs: 6000 });
  if (direct.ok && /<urlset|<sitemapindex/i.test(direct.html || '')) return true;

  const robots = await fetchPage(origin + '/robots.txt', { timeoutMs: 6000 });
  if (robots.ok && /sitemap:/i.test(robots.html || '')) return true;

  return false;
}

// Estrae { loc, lastmod } dalle voci <url> di un urlset. lastmod è un Date valido o null.
function parseUrlset(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  return $('url')
    .map((_, el) => {
      const loc = $(el).find('loc').first().text().trim();
      const lastmodTxt = $(el).find('lastmod').first().text().trim();
      const lastmod = lastmodTxt ? new Date(lastmodTxt) : null;
      return { loc, lastmod: lastmod && !isNaN(lastmod) ? lastmod : null };
    })
    .get()
    .filter((v) => v.loc);
}

// Legge sitemap.xml (seguendo un eventuale sitemapindex per un livello) e ritorna le voci trovate.
// Riusato sia dal criterio blog/Nurturing sia, in futuro, dal criterio "frequenza dei contenuti".
async function getSitemapEntries(baseUrl, { maxSottoSitemap = 5, maxVoci = 3000 } = {}) {
  const origin = new URL(baseUrl).origin;
  const res = await fetchPage(origin + '/sitemap.xml', { timeoutMs: 8000, maxBytes: 3_000_000 });
  if (!res.ok || !res.html) return [];

  const $ = cheerio.load(res.html, { xmlMode: true });

  if ($('sitemapindex').length) {
    const subUrls = $('sitemap > loc')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, maxSottoSitemap);

    const sottoFetch = await Promise.all(subUrls.map((u) => fetchPage(u, { timeoutMs: 8000, maxBytes: 3_000_000 })));

    const voci = [];
    for (const r of sottoFetch) {
      if (!r.ok || !r.html) continue;
      voci.push(...parseUrlset(r.html));
      if (voci.length >= maxVoci) break;
    }
    return voci.slice(0, maxVoci);
  }

  return parseUrlset(res.html).slice(0, maxVoci);
}

module.exports = { checkSitemap, getSitemapEntries };
