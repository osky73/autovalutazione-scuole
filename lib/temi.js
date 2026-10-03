const cheerio = require('cheerio');

const VOCABOLARIO = {
  lingue: {
    label: 'lingue',
    // Ricerche su Google (SERP): NON toccano `keywords`, che servono anche a riconoscere il tema nel sito.
    escludiDaSerp: ['curricolo cambridge', 'cambridge checkpoint', 'curricolo bilingue', 'certificazione delf', 'certificazione dele', 'cambridge assessment', 'ielts', 'cils', 'telc', 'ket', 'pet', 'fce', 'cae'],
    keywords: [
      'potenziamento inglese', 'sezione cambridge', 'curricolo cambridge', 'cambridge checkpoint',
      'sezione internazionale', 'sezione bilingue', 'curricolo bilingue', 'potenziamento seconda lingua',
      'potenziamento spagnolo', 'potenziamento francese', 'potenziamento tedesco',
      'certificazione cambridge', 'certificazione delf', 'certificazione dele',
      // Aggiunti perché la dicitura più comune sui siti delle scuole è generica ("certificazioni
      // linguistiche" come voce di menu) o nomina l'ente/esame invece della lingua: senza queste
      // varianti una scuola che le offre risultava segnalata come priva della competenza pur
      // dichiarandola esplicitamente (es. suoremantellate.org, segnalato da Andrea il 2026-10-01).
      'certificazione linguistica', 'certificazione internazionale', 'cambridge english',
      'cambridge assessment', 'trinity college', 'goethe institut', 'instituto cervantes',
      'ielts', 'toefl', 'cils', 'celi', 'telc', 'ket', 'pet', 'fce', 'cae',
    ],
  },
  musica: {
    label: 'musica/canto',
    // Ricerche su Google (SERP): NON toccano `keywords`, che servono anche a riconoscere il tema nel sito.
    escludiDaSerp: ['smim'],
    keywords: [
      'indirizzo musicale', 'percorsi a indirizzo musicale', 'sezione a indirizzo musicale', 'smim',
      'potenziamento musicale', 'curvatura musicale', 'orchestra scolastica',
      'coro scolastico',
    ],
  },
  teatro: {
    label: 'teatro',
    // Ricerche su Google (SERP): NON toccano `keywords`, che servono anche a riconoscere il tema nel sito.
    escludiDaSerp: ['teatro in lingua', 'rassegna teatrale scolastica', 'saggio teatrale scolastico'],
    keywords: [
      'laboratorio teatrale', 'teatro in lingua', 'compagnia teatrale scolastica',
      'corso di teatro', 'potenziamento teatrale', 'curvatura teatrale',
      'rassegna teatrale scolastica', 'saggio teatrale scolastico',
    ],
  },
  sport: {
    label: 'sport',
    // Ricerche su Google (SERP): NON toccano `keywords`, che servono anche a riconoscere il tema nel sito.
    escludiDaSerp: ['potenziamento scienze motorie', 'avviamento allo sport', 'centro sportivo scolastico'],
    keywords: [
      'indirizzo sportivo', 'sezione sportiva', 'curvatura sportiva', 'potenziamento sportivo',
      'potenziamento scienze motorie', 'avviamento allo sport', 'centro sportivo scolastico',
    ],
  },
  tecnologia: {
    label: 'tecnologia/coding',
    // Ricerche su Google (SERP): NON toccano `keywords`, che servono anche a riconoscere il tema nel sito.
    escludiDaSerp: ['curvatura stem', 'potenziamento stem', 'curvatura steam', 'potenziamento scienze', 'potenziamento matematica', 'laboratorio scientifico', 'robotica educativa', 'fabbricazione digitale', 'fablab scolastico', 'stampa 3d'],
    keywords: [
      'curvatura stem', 'potenziamento stem', 'curvatura steam', 'potenziamento scienze',
      'potenziamento matematica', 'laboratorio scientifico', 'robotica educativa', 'coding',
      'pensiero computazionale', 'curvatura digitale', 'fabbricazione digitale', 'fablab scolastico',
      'stampa 3d',
    ],
  },
  ambiente: {
    label: 'ambiente/natura',
    // Ricerche su Google (SERP): NON toccano `keywords`, che servono anche a riconoscere il tema nel sito.
    escludiDaSerp: ['outdoor education', 'orto scolastico didattico'],
    keywords: [
      'curvatura ecologica', 'curvatura ambientale', 'curvatura green', 'educazione alla sostenibilità',
      'outdoor education', 'orto scolastico didattico',
    ],
  },
  umanistica: {
    label: 'umanistica/lettere',
    // Ricerche su Google (SERP): NON toccano `keywords`, che servono anche a riconoscere il tema nel sito.
    senzaQueryGenerica: true,
    escludiDaSerp: ['potenziamento italiano', 'propedeutica al latino', 'debate', 'laboratorio di debate', 'filosofia con i bambini', 'philosophy for children', 'giochi matematici', 'logica e pensiero critico', 'web radio scolastica'],
    keywords: [
      'potenziamento lettere', 'potenziamento italiano', 'avviamento al latino', 'propedeutica al latino',
      'laboratorio di latino', 'scrittura creativa', 'debate', 'laboratorio di debate',
      'filosofia con i bambini', 'philosophy for children', 'giochi matematici', 'logica e pensiero critico',
      'giornalismo scolastico', 'web radio scolastica',
    ],
  },
  arte: {
    label: 'arte/design/creatività',
    keywords: [
      'potenziamento artistico', 'curvatura artistica', 'laboratorio artistico', 'arti visive e digitali',
      'design e creatività',
    ],
  },
};

function stripHtmlToText(html) {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').toLowerCase();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Riduce una parola alla sua radice tagliando l'ultima lettera, per far matchare le normali
// variazioni singolare/plurale e maschile/femminile dell'italiano (es. "certificazione" trova
// anche "certificazioni", "certificazione" trova "certificazioni linguistiche" ecc.). Applicata
// solo alle parole abbastanza lunghe: su parole corte (es. "pet", "cae") taglierebbe troppo e
// farebbe scattare falsi positivi su parole non correlate.
function radice(parola) {
  return parola.length > 4 ? parola.slice(0, -1) : parola;
}

// Costruisce la regex di una keyword (anche multi-parola) applicando la flessione a ogni singola
// parola, non solo all'ultima: la versione precedente permetteva variazioni solo sull'ultima
// parola di una frase, quindi "certificazione linguistica" non trovava "certificazioni
// linguistiche" sul sito reale di una scuola.
function costruisciRegexKeyword(kw) {
  const parti = kw
    .split(' ')
    .map((parola) => `${escapeRegex(radice(parola))}\\w*`)
    .join('\\s+');
  return new RegExp(`\\b${parti}`, 'gi');
}


// --- Link "vedi pagina" di una competenza (richiesta di Andrea, 2026-10-03, su suoremantellate.org) ---
// Prima il link era la PRIMA pagina scaricata in cui compariva una parola chiave (di solito home o
// notizie), anche se il sito ha una pagina dedicata (es. /certificazioni-linguistiche/). Ora:
//  1) se una parola chiave compare nel TESTO o nell'INDIRIZZO di un link interno (voce di menu, link nel
//     testo), il link punta a quel link — è la pagina dedicata che il sito stesso indica;
//  2) altrimenti la pagina scaricata più specifica in cui compare (non home/notizie/contatti, poi home).
const PAGINA_GENERICA_RE = /(news|notizi|blog|attualit|about|chi-siamo|contatt|iscrizion)/i;

function regexPerLink(kw) {
  // Per sigle corte ("ket", "pet", "cae") solo parola intera: con la radice troncata farebbero scattare
  // parole non correlate ("petizione") e porterebbero al link sbagliato.
  if (kw.length <= 4) return new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i');
  return new RegExp(costruisciRegexKeyword(kw).source, 'i');
}

function slugComeTesto(url) {
  try {
    return decodeURIComponent(new URL(url).pathname).replace(/[-_/]+/g, ' ').toLowerCase();
  } catch (e) {
    return '';
  }
}

function stessoSito(a, b) {
  try {
    return new URL(a).host.replace(/^www\./, '') === new URL(b).host.replace(/^www\./, '');
  } catch (e) {
    return false;
  }
}

// Link interni (testo + indirizzo assoluto) di una pagina.
function raccogliLink(html, baseUrl) {
  const $ = cheerio.load(html);
  const link = [];
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (!href || /^(#|mailto:|tel:|javascript:)/i.test(href)) return;
    let assoluto;
    try {
      assoluto = new URL(href, baseUrl || undefined).toString().split('#')[0];
    } catch (e) {
      return;
    }
    if (!/^https?:/i.test(assoluto)) return;
    if (baseUrl && !stessoSito(baseUrl, assoluto)) return;
    link.push({ testo: $(el).text().replace(/\s+/g, ' ').trim().toLowerCase(), url: assoluto });
  });
  return link;
}

function trovaLinkTema(pagine, keywords) {
  const regex = keywords.map((kw) => regexPerLink(kw));
  let migliore = null;
  for (const pagina of pagine) {
    if (!pagina.url) continue;
    const paginaNorm = pagina.url.replace(/\/$/, '');
    for (const l of raccogliLink(pagina.html, pagina.url)) {
      if (l.url.replace(/\/$/, '') === paginaNorm) continue;
      const slug = slugComeTesto(l.url);
      let punti = 0;
      for (const re of regex) {
        if (l.testo && re.test(l.testo)) punti += 2;
        if (slug && re.test(slug)) punti += 1;
      }
      if (punti > 0 && (!migliore || punti > migliore.punti)) migliore = { url: l.url, punti };
    }
  }
  return migliore ? migliore.url : null;
}

function rangoPagina(url) {
  try {
    const path = new URL(url).pathname;
    if (PAGINA_GENERICA_RE.test(path)) return 2;
    if (path === '/' || path === '') return 1;
    return 0;
  } catch (e) {
    return 2;
  }
}

function elencoTemi() {
  return Object.entries(VOCABOLARIO).map(([key, v]) => ({ key, label: v.label }));
}

// pagesHtml: array di HTML delle pagine già scaricate dall'audit tecnico.
// pagesUrl: array parallelo (stesso ordine/indice) con l'URL di ciascuna pagina — opzionale, per
// compatibilità con le chiamate esistenti che passano solo l'HTML (es. lib/contenuti.js). Quando
// presente, permette di riportare in quale pagina del sito è stata trovata ogni competenza.
function estraiTemi(pagesHtml, pagesUrl) {
  const pagine = (pagesHtml || []).map((html, i) => ({
    html,
    testo: stripHtmlToText(html),
    url: (pagesUrl && pagesUrl[i]) || null,
  }));

  const risultati = [];

  for (const [key, { label, keywords }] of Object.entries(VOCABOLARIO)) {
    let count = 0;
    const matched = new Set();
    const perPagina = [];

    pagine.forEach((pagina, indice) => {
      let nellaPagina = 0;
      for (const kw of keywords) {
        const re = costruisciRegexKeyword(kw);
        const m = pagina.testo.match(re);
        if (m) {
          count += m.length;
          nellaPagina += m.length;
          matched.add(kw);
        }
      }
      if (nellaPagina > 0 && pagina.url) perPagina.push({ url: pagina.url, n: nellaPagina, indice });
    });

    if (count > 0) {
      // Link: prima quello indicato dal sito stesso (voce di menu/link con la parola chiave), poi la
      // pagina scaricata più specifica in cui compare (meno generica, poi con più occorrenze).
      let url = trovaLinkTema(pagine, keywords);
      if (!url && perPagina.length) {
        perPagina.sort((a, b) => rangoPagina(a.url) - rangoPagina(b.url) || b.n - a.n || a.indice - b.indice);
        url = perPagina[0].url;
      }
      risultati.push({ key, label, count, keywordsTrovate: Array.from(matched), url });
    }
  }

  risultati.sort((a, b) => b.count - a.count);
  return {
    tuttiITemi: elencoTemi(),
    temiTrovati: risultati,
    top5: risultati.slice(0, 5),
  };
}


// Ricerche da fare su Google per un tema confermato: la generica ("scuola <etichetta> <località>",
// salvo i temi con `senzaQueryGenerica`) più le parole chiave del vocabolario, tolte quelle in
// `escludiDaSerp` (scelta di Andrea, 2026-10-03, per contenere i crediti Serper). Per i temi senza
// chiave nel vocabolario (competenze scritte a mano dall'utente) si fanno la ricerca generica più le tre
// varianti "potenziamento", "curvatura" e "indirizzo" (richiesta di Andrea, 2026-10-03).
function queryPerTema(tema, localita) {
  const v = tema.key && VOCABOLARIO[tema.key];
  const etichetta = tema.label.replace(/\//g, ' ');
  const queries = [];
  if (!(v && v.senzaQueryGenerica)) queries.push(`scuola ${etichetta} ${localita}`);
  if (v) {
    const escluse = new Set(v.escludiDaSerp || []);
    for (const kw of v.keywords) {
      if (!escluse.has(kw)) queries.push(`scuola ${kw} ${localita}`);
    }
  } else {
    for (const prefisso of ['potenziamento', 'curvatura', 'indirizzo']) {
      queries.push(`scuola ${prefisso} ${etichetta} ${localita}`);
    }
  }
  return queries;
}

// Chiavi dei temi del vocabolario che compaiono nell'INDIRIZZO di una pagina (es. /certificazioni-linguistiche/
// → ['lingue']). Serve a riconoscere, dalla sitemap, le pagine dedicate a una competenza.
const REGEX_TEMI_INDIRIZZO = Object.entries(VOCABOLARIO).map(([key, v]) => ({
  key,
  regex: v.keywords.map((kw) => regexPerLink(kw)),
}));

function temiDaIndirizzo(url) {
  const slug = slugComeTesto(url);
  if (!slug) return [];
  return REGEX_TEMI_INDIRIZZO.filter((t) => t.regex.some((re) => re.test(slug))).map((t) => t.key);
}

module.exports = { estraiTemi, elencoTemi, queryPerTema, temiDaIndirizzo, VOCABOLARIO };
