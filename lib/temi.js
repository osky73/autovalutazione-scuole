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
    senzaQueryGenerica: true,
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
    senzaQueryGenerica: true,
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

function elencoTemi() {
  return Object.entries(VOCABOLARIO).map(([key, v]) => ({ key, label: v.label }));
}

// pagesHtml: array di HTML delle pagine già scaricate dall'audit tecnico.
// pagesUrl: array parallelo (stesso ordine/indice) con l'URL di ciascuna pagina — opzionale, per
// compatibilità con le chiamate esistenti che passano solo l'HTML (es. lib/contenuti.js). Quando
// presente, permette di riportare in quale pagina del sito è stata trovata ogni competenza.
function estraiTemi(pagesHtml, pagesUrl) {
  const pagine = (pagesHtml || []).map((html, i) => ({
    testo: stripHtmlToText(html),
    url: (pagesUrl && pagesUrl[i]) || null,
  }));

  const risultati = [];

  for (const [key, { label, keywords }] of Object.entries(VOCABOLARIO)) {
    let count = 0;
    const matched = new Set();
    let urlTrovato = null;

    for (const pagina of pagine) {
      for (const kw of keywords) {
        const re = costruisciRegexKeyword(kw);
        const m = pagina.testo.match(re);
        if (m) {
          count += m.length;
          matched.add(kw);
          if (!urlTrovato && pagina.url) urlTrovato = pagina.url;
        }
      }
    }

    if (count > 0) {
      risultati.push({ key, label, count, keywordsTrovate: Array.from(matched), url: urlTrovato });
    }
  }

  risultati.sort((a, b) => b.count - a.count);
  return {
    tuttiITemi: elencoTemi(),
    temiTrovati: risultati,
    top5: risultati.slice(0, 5),
  };
}


// Ricerche da fare su Google per un tema confermato: la generica ("scuola media <etichetta> <località>",
// salvo i temi con `senzaQueryGenerica`) più le parole chiave del vocabolario, tolte quelle in
// `escludiDaSerp` (scelta di Andrea, 2026-10-03, per contenere i crediti Serper). Per i temi senza
// chiave nel vocabolario (competenze scritte a mano dall'utente) si fanno la ricerca generica più le tre
// varianti "potenziamento", "curvatura" e "indirizzo" (richiesta di Andrea, 2026-10-03).
function queryPerTema(tema, localita) {
  const v = tema.key && VOCABOLARIO[tema.key];
  const etichetta = tema.label.replace(/\//g, ' ');
  const queries = [];
  if (!(v && v.senzaQueryGenerica)) queries.push(`scuola media ${etichetta} ${localita}`);
  if (v) {
    const escluse = new Set(v.escludiDaSerp || []);
    for (const kw of v.keywords) {
      if (!escluse.has(kw)) queries.push(`scuola media ${kw} ${localita}`);
    }
  } else {
    for (const prefisso of ['potenziamento', 'curvatura', 'indirizzo']) {
      queries.push(`scuola media ${prefisso} ${etichetta} ${localita}`);
    }
  }
  return queries;
}

module.exports = { estraiTemi, elencoTemi, queryPerTema, VOCABOLARIO };
