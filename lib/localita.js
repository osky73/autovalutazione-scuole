const cheerio = require('cheerio');

const CAP_CITTA_RE = /\b\d{5}\s+([A-ZÀ-Ý][a-zà-ÿ'’.-]+)\b/;

const TIPI_ORGANIZZAZIONE_RE = /^(School|EducationalOrganization|ElementarySchool|MiddleSchool|HighSchool|PrimarySchool|Preschool|Organization|LocalBusiness|Corporation)$/i;

const SUFFISSI_TITLE_RE = /\s*[-|–—]\s*(home|homepage|sito ufficiale|sito web).*$/i;

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

function tipoCorrisponde(tipo) {
  if (!tipo) return false;
  const tipi = Array.isArray(tipo) ? tipo : [tipo];
  return tipi.some((t) => typeof t === 'string' && TIPI_ORGANIZZAZIONE_RE.test(t));
}

function formattaIndirizzo(indirizzo) {
  if (!indirizzo || typeof indirizzo !== 'object') return null;
  const parti = [indirizzo.streetAddress, indirizzo.postalCode, indirizzo.addressLocality].filter(
    (v) => typeof v === 'string' && v.trim()
  );
  return parti.length ? parti.join(', ').trim() : null;
}

function cercaOrganizzazione(nodo) {
  if (!nodo || typeof nodo !== 'object') return null;
  if (Array.isArray(nodo)) {
    for (const el of nodo) {
      const trovato = cercaOrganizzazione(el);
      if (trovato) return trovato;
    }
    return null;
  }
  if (
    tipoCorrisponde(nodo['@type']) &&
    typeof nodo.name === 'string' &&
    nodo.name.trim()
  ) {
    return { nome: nodo.name.trim(), indirizzo: formattaIndirizzo(nodo.address) };
  }
  for (const key of Object.keys(nodo)) {
    const trovato = cercaOrganizzazione(nodo[key]);
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

function organizzazioneDaJsonLd(html) {
  const $ = cheerio.load(html);
  let trovato = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (trovato) return;
    try {
      const dati = JSON.parse($(el).contents().text());
      trovato = cercaOrganizzazione(dati);
    } catch (e) {
      /* JSON-LD non valido: ignora e prova il prossimo blocco */
    }
  });
  return trovato;
}

function organizzazioneDaMicrodata(html) {
  const $ = cheerio.load(html);
  const scope = $('[itemtype*="schema.org"]').first();
  if (!scope.length) return null;
  const nome = scope.find('[itemprop="name"]').first().text().trim() || null;
  const via = scope.find('[itemprop="streetAddress"]').first().text().trim();
  const cap = scope.find('[itemprop="postalCode"]').first().text().trim();
  const localita = scope.find('[itemprop="addressLocality"]').first().text().trim();
  const indirizzo = [via, cap, localita].filter(Boolean).join(', ').trim() || null;
  return nome ? { nome, indirizzo } : null;
}

function nomeDaTitle(html) {
  const $ = cheerio.load(html);
  const titolo = ($('title').first().text() || '').trim();
  if (!titolo) return null;
  const pulito = titolo.replace(SUFFISSI_TITLE_RE, '').trim();
  return pulito || titolo;
}

/**
 * Estrae nome e indirizzo dell'organizzazione così come dichiarati sul sito stesso
 * (JSON-LD/microdata schema.org, con fallback al tag <title>), da usare al posto del
 * nome digitato liberamente dall'utente nel passaggio 1 — che può essere un'abbreviazione
 * o un nome ambiguo (es. "LZ" invece di "Istituto La Zolla") e portare a scambiare la
 * scheda Google Business Profile con quella di un'attività non correlata.
 */
function estraiDatiOrganizzazione(pagesHtml) {
  const pagine = pagesHtml || [];
  for (const html of pagine) {
    const viaJsonLd = organizzazioneDaJsonLd(html);
    if (viaJsonLd) return viaJsonLd;
  }
  for (const html of pagine) {
    const viaMicrodata = organizzazioneDaMicrodata(html);
    if (viaMicrodata) return viaMicrodata;
  }
  for (const html of pagine) {
    const viaTitle = nomeDaTitle(html);
    if (viaTitle) return { nome: viaTitle, indirizzo: null };
  }
  return null;
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

module.exports = { estraiLocalita, estraiDatiOrganizzazione };
