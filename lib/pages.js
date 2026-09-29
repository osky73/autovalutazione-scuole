const cheerio = require('cheerio');
const { URL } = require('url');

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

module.exports = { discoverInternalPages };
