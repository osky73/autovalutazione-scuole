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

module.exports = { checkSitemap };
