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
// Trova la sitemap: prima /sitemap.xml, poi l'indirizzo dichiarato in robots.txt, poi i nomi usati da
// WordPress (wp-sitemap.xml) e da altri CMS (sitemap_index.xml). Ritorna l'XML della prima valida.
async function scaricaSitemap(origin, fetchImpl) {
  const valida = (r) => r && r.ok && r.html && /<urlset|<sitemapindex/i.test(r.html);

  const diretta = await fetchImpl(origin + '/sitemap.xml', { timeoutMs: 8000, maxBytes: 3_000_000 });
  if (valida(diretta)) return diretta.html;

  const candidati = [];
  const robots = await fetchImpl(origin + '/robots.txt', { timeoutMs: 6000 });
  if (robots.ok && robots.html) {
    const re = /^\s*sitemap:\s*(\S+)/gim;
    let m;
    while ((m = re.exec(robots.html))) candidati.push(m[1]);
  }
  candidati.push(origin + '/wp-sitemap.xml', origin + '/sitemap_index.xml');

  for (const url of [...new Set(candidati)].slice(0, 4)) {
    if (url === origin + '/sitemap.xml') continue;
    const r = await fetchImpl(url, { timeoutMs: 8000, maxBytes: 3_000_000 });
    if (valida(r)) return r.html;
  }
  return null;
}

async function getSitemapEntries(baseUrl, { maxSottoSitemap = 5, maxVoci = 3000, fetchImpl = fetchPage } = {}) {
  const origin = new URL(baseUrl).origin;
  const xml = await scaricaSitemap(origin, fetchImpl);
  if (!xml) return [];

  const $ = cheerio.load(xml, { xmlMode: true });

  if ($('sitemapindex').length) {
    // Le sotto-sitemap delle pagine statiche vengono prima delle altre: con il limite di 5 non devono
    // restare escluse da quelle degli articoli o delle categorie.
    const priorita = (u) => (/page|pagin/i.test(u) ? 0 : /post|article|news/i.test(u) ? 1 : 2);
    const subUrls = $('sitemap > loc')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .sort((a, b) => priorita(a) - priorita(b))
      .slice(0, maxSottoSitemap);

    const sottoFetch = await Promise.all(subUrls.map((u) => fetchImpl(u, { timeoutMs: 8000, maxBytes: 3_000_000 })));

    const voci = [];
    for (const r of sottoFetch) {
      if (!r.ok || !r.html) continue;
      voci.push(...parseUrlset(r.html));
      if (voci.length >= maxVoci) break;
    }
    return voci.slice(0, maxVoci);
  }

  return parseUrlset(xml).slice(0, maxVoci);
}

module.exports = { checkSitemap, getSitemapEntries };
