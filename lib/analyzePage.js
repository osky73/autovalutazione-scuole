const cheerio = require('cheerio');

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
  };
}

module.exports = { analyzePage };
