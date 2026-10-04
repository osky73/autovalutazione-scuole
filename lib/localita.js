const cheerio = require('cheerio');

const CAP_CITTA_RE = /\b\d{5}\s+([A-ZÀ-Ý][a-zà-ÿ'’.-]+)\b/;

const TIPI_ORGANIZZAZIONE_RE = /^(School|EducationalOrganization|ElementarySchool|MiddleSchool|HighSchool|PrimarySchool|Preschool|Organization|LocalBusiness|Corporation)$/i;

const SUFFISSI_TITLE_RE = /\s*[-|–—]\s*(home|homepage|sito ufficiale|sito web).*$/i;
// Parti generiche di un <title> che non fanno parte del nome ("Sito ufficiale - Scuola X - Sezione primavera...").
const PARTE_TITLE_GENERICA_RE = /^(home(page)?|sito (ufficiale|web)|benvenuti?|welcome|pagina principale|il sito (ufficiale )?(della|di)\b.*)$/i;

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
    const loc = nodo.address && typeof nodo.address === 'object' && typeof nodo.address.addressLocality === 'string' ? nodo.address.addressLocality.trim() : null;
    return { nome: nodo.name.trim(), indirizzo: formattaIndirizzo(nodo.address), citta: loc || null };
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
  return nome ? { nome, indirizzo, citta: localita || null } : null;
}

function nomeDaTitle(html) {
  const $ = cheerio.load(html);
  const titolo = ($('title').first().text() || '').replace(/\s+/g, ' ').trim();
  if (!titolo) return null;
  // Il titolo è spesso "Sito ufficiale - Nome scuola - Altre parole": si tiene la prima parte che non è generica.
  const parti = titolo.split(/\s*[-|–—·•]\s*/).map((x) => x.trim()).filter(Boolean);
  const utile = parti.find((x) => !PARTE_TITLE_GENERICA_RE.test(x));
  if (utile) return utile;
  const pulito = titolo.replace(SUFFISSI_TITLE_RE, '').trim();
  return pulito || titolo;
}

// --- Indirizzo scritto nel testo del sito (piè di pagina, pagina contatti), quando mancano i dati strutturati ---
const TIPI_VIA = 'via|viale|v\\.le|piazza|p\\.zza|piazzale|corso|c\\.so|largo|vicolo|strada|borgo|salita|lungotevere|lungarno|contrada|località';
const VIA_RE = new RegExp(
  `\\b(${TIPI_VIA})\\s+((?:[A-Za-zÀ-ÿ'’.]+\\s+){0,4}?[A-Za-zÀ-ÿ'’.]+)\\s*,?\\s*(?:n\\.?\\s*|civico\\s*)?(\\d{1,4}[A-Za-z]?(?:/\\d+)?)(?![\\d])`,
  'gi'
);
const PAROLE_NON_CITTA_RE = /^(tel|telefono|fax|email|e-mail|mail|pec|p\.?\s?iva|c\.?f|cod|codice|www|http|orari|segreteria|scuola|dirigente|copyright|privacy|cookie|iscrizioni|contatti|mappa|come)/i;

function cittaDopoIndirizzo(coda) {
  const m = coda.match(/^\s*[,–\-.]?\s*(?:(\d{5})\s*[-–,]?\s*)?([A-ZÀ-Ý][A-Za-zà-ÿ'’.]+(?:\s+(?:d[ie]l?|d'|a|al|sul|in)\s+[A-ZÀ-Ý][a-zà-ÿ'’.]+|\s+[A-ZÀ-Ý][a-zà-ÿ'’.]+){0,2})\s*(?:\(([A-Z]{2})\))?/);
  if (!m) return null;
  const citta = m[2].trim();
  if (PAROLE_NON_CITTA_RE.test(citta)) return null;
  return { cap: m[1] || null, citta, provincia: m[3] || null };
}

// Cerca nel testo il primo indirizzo del tipo "via Nome 8, 20158 Milano (MI)". Ritorna {indirizzo, citta} o null.
function indirizzoDaTesto(testo) {
  const t = (testo || '').replace(/\s+/g, ' ');
  VIA_RE.lastIndex = 0;
  let m;
  while ((m = VIA_RE.exec(t))) {
    const nomeVia = m[2].trim();
    if (!/^([A-ZÀ-Ý0-9]|(di|del|dei|della|delle|degli|dello|dell|d|dal|dalla|san|santa|s)\b)/i.test(nomeVia) || /^(email|e-mail|mail|telefono|tel|fax|posta|pec|internet|whatsapp)\b/i.test(nomeVia)) continue; // "via email 3", "via telefono 1": non è una via
    if (PAROLE_NON_CITTA_RE.test(nomeVia)) continue;
    const parteVia = `${m[1]} ${nomeVia} ${m[3]}`.replace(/\s+/g, ' ').trim();
    const dopo = cittaDopoIndirizzo(t.slice(m.index + m[0].length, m.index + m[0].length + 80));
    const indirizzo = [parteVia, [dopo && dopo.cap, dopo && dopo.citta].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return { indirizzo, citta: dopo ? dopo.citta : null };
  }
  return null;
}

// Sezioni dove di solito sta l'indirizzo, prima del resto della pagina.
function testiIndirizzoProbabili(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const testi = [];
  $('address, [itemprop="address"], footer, [class*="footer"], [id*="footer"], [class*="contatt"], [id*="contatt"]').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t) testi.push(t);
  });
  testi.push($('body').text().replace(/\s+/g, ' ').trim());
  return testi;
}

function indirizzoDaPagine(pagine) {
  for (const html of pagine) {
    for (const t of testiIndirizzoProbabili(html).slice(0, -1)) {
      const trovato = indirizzoDaTesto(t);
      if (trovato) return trovato;
    }
  }
  for (const html of pagine) {
    const corpo = testiIndirizzoProbabili(html).slice(-1)[0];
    const trovato = indirizzoDaTesto(corpo);
    if (trovato) return trovato;
  }
  return null;
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
  let org = null;
  for (const html of pagine) {
    org = organizzazioneDaJsonLd(html);
    if (org) break;
  }
  if (!org) {
    for (const html of pagine) {
      org = organizzazioneDaMicrodata(html);
      if (org) break;
    }
  }
  if (!org) {
    for (const html of pagine) {
      const viaTitle = nomeDaTitle(html);
      if (viaTitle) {
        org = { nome: viaTitle, indirizzo: null, citta: null };
        break;
      }
    }
  }
  if (!org) return null;

  // Indirizzo completo (via + civico + città) quando i dati strutturati non lo danno o lo danno monco:
  // lo si legge dal testo del sito (piè di pagina/contatti).
  const haViaNumero = org.indirizzo && /\d/.test(org.indirizzo);
  if (!haViaNumero) {
    const daTesto = indirizzoDaPagine(pagine);
    if (daTesto) {
      org = { ...org, indirizzo: daTesto.indirizzo, citta: org.citta || daTesto.citta };
    }
  }
  if (!org.citta) org = { ...org, citta: estraiLocalita(pagine) };
  return org;
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
  const indirizzo = indirizzoDaPagine(pagine);
  return indirizzo && indirizzo.citta ? indirizzo.citta : null;
}

module.exports = { estraiLocalita, estraiDatiOrganizzazione, indirizzoDaTesto, nomeDaTitle };
