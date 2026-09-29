const cheerio = require('cheerio');

const MONTHS_IT = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];

function analyzePage(fetchResult, url) {
  if (!fetchResult.ok || !fetchResult.html) {
    return { url, reachable: false, error: fetchResult.error || `HTTP ${fetchResult.status}` };
  }

  const $ = cheerio.load(fetchResult.html);
  const title = ($('title').first().text() || '').trim();
  const metaDescription = ($('meta[name="description"]').attr('content') || '').trim();
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  const h1Count = $('h1').length;

  const jsonLdSchemaOrg = $('script[type="application/ld+json"]')
    .toArray()
    .some((el) => {
      try {
        const txt = $(el).contents().text();
        return /schema\.org/i.test(txt);
      } catch (e) {
        return false;
      }
    });
  const microdataSchemaOrg = $('[itemtype*="schema.org"]').length > 0;
  const hasSchemaOrg = jsonLdSchemaOrg || microdataSchemaOrg;

  const bodyText = $('body').text();
  const hasGA4 = /gtag\(|G-[A-Z0-9]{6,}|googletagmanager\.com\/gtag/i.test(fetchResult.html);
  const hasGTM = /GTM-[A-Z0-9]+|googletagmanager\.com\/gtm\.js/i.test(fetchResult.html);
  const hasCookieBanner = /cookie/i.test(bodyText) && /(consenso|accetta|preferenze cookie|cookie policy)/i.test(bodyText);

  const googleBusinessLink = $('a[href]')
    .toArray()
    .some((el) => {
      const href = $(el).attr('href') || '';
      return /maps\.google|g\.page|business\.google\.com|goo\.gl\/maps/i.test(href);
    });

  const dates = extractDates(fetchResult.html, bodyText);

  return {
    url,
    reachable: true,
    status: fetchResult.status,
    timeMs: fetchResult.timeMs,
    bytes: fetchResult.bytes,
    https: fetchResult.https,
    title,
    titleLength: title.length,
    metaDescription,
    metaDescriptionLength: metaDescription.length,
    hasViewport: /width=device-width/i.test(viewport),
    h1Count,
    hasSchemaOrg,
    hasGA4,
    hasGTM,
    hasCookieBanner,
    googleBusinessLink,
    lastDateFound: dates[0] || null,
  };
}

function extractDates(html, text) {
  const found = [];
  const $ = cheerio.load(html);

  $('time[datetime]').each((_, el) => {
    const d = new Date($(el).attr('datetime'));
    if (!isNaN(d)) found.push(d);
  });

  const isoRe = /\b(20\d{2})-(\d{2})-(\d{2})\b/g;
  let m;
  while ((m = isoRe.exec(text))) {
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}`);
    if (!isNaN(d)) found.push(d);
  }

  const itRe = new RegExp(`\\b(\\d{1,2})\\s+(${MONTHS_IT.join('|')})\\s+(20\\d{2})\\b`, 'gi');
  while ((m = itRe.exec(text))) {
    const monthIdx = MONTHS_IT.findIndex((mo) => mo.toLowerCase() === m[2].toLowerCase());
    const d = new Date(Number(m[3]), monthIdx, Number(m[1]));
    if (!isNaN(d)) found.push(d);
  }

  const now = Date.now();
  const plausible = found.filter((d) => d.getTime() <= now + 86400000 && d.getFullYear() >= 2015);
  plausible.sort((a, b) => b - a);
  return plausible;
}

module.exports = { analyzePage };
