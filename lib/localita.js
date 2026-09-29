const cheerio = require('cheerio');

const CAP_CITTA_RE = /\b\d{5}\s+([A-ZÀ-Ý][a-zà-ÿ'’.-]+)\b/;

function cercaAddressLocality(nodo) {
  if (!nodo || typeof nodo !== 'object') return null;
  if (Array.isArray(nodo)) {
    for (const el of nodo) {
      const trovato = cercaAddressLocality(el);
      if (trovato) return trovato;
    }
    return null;
  }
  if (typeof nodo.addressLocality === 'string' && nodo.addressLocality.trim()) {
    return nodo.addressLocality.trim();
  }
  for (const key of Object.keys(nodo)) {
    const trovato = cercaAddressLocality(nodo[key]);
    if (trovato) return trovato;
  }
  return null;
}

function daJsonLd(html) {
  const $ = cheerio.load(html);
  let trovato = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (trovato) return;
    try {
      const dati = JSON.parse($(el).contents().text());
      trovato = cercaAddressLocality(dati);
    } catch (e) {
      /* JSON-LD non valido: ignora e prova il prossimo blocco */
    }
  });
  return trovato;
}

function daMicrodata(html) {
  const $ = cheerio.load(html);
  const testo = $('[itemprop="addressLocality"]').first().text().trim();
  return testo || null;
}

function daTesto(html) {
  const $ = cheerio.load(html);
  const testo = $('body').text().replace(/\s+/g, ' ');
  const m = testo.match(CAP_CITTA_RE);
  return m ? m[1].trim() : null;
}

function estraiLocalita(pagesHtml) {
  const pagine = pagesHtml || [];
  for (const html of pagine) {
    const viaJsonLd = daJsonLd(html);
    if (viaJsonLd) return viaJsonLd;
  }
  for (const html of pagine) {
    const viaMicrodata = daMicrodata(html);
    if (viaMicrodata) return viaMicrodata;
  }
  for (const html of pagine) {
    const viaTesto = daTesto(html);
    if (viaTesto) return viaTesto;
  }
  return null;
}

module.exports = { estraiLocalita };
