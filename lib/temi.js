const cheerio = require('cheerio');

const VOCABOLARIO = {
  lingue: {
    label: 'lingue',
    keywords: [
      'potenziamento inglese', 'sezione cambridge', 'curricolo cambridge', 'cambridge checkpoint',
      'sezione internazionale', 'sezione bilingue', 'curricolo bilingue', 'potenziamento seconda lingua',
      'potenziamento spagnolo', 'potenziamento francese', 'potenziamento tedesco',
      'certificazione cambridge', 'certificazione delf', 'certificazione dele',
    ],
  },
  musica: {
    label: 'musica/canto',
    keywords: [
      'indirizzo musicale', 'percorsi a indirizzo musicale', 'sezione a indirizzo musicale', 'smim',
      'potenziamento musicale', 'curvatura musicale', 'orchestra scolastica',
      'coro scolastico',
    ],
  },
  teatro: {
    label: 'teatro',
    keywords: [
      'laboratorio teatrale', 'teatro in lingua', 'compagnia teatrale scolastica',
      'corso di teatro', 'potenziamento teatrale', 'curvatura teatrale',
      'rassegna teatrale scolastica', 'saggio teatrale scolastico',
    ],
  },
  sport: {
    label: 'sport',
    keywords: [
      'indirizzo sportivo', 'sezione sportiva', 'curvatura sportiva', 'potenziamento sportivo',
      'potenziamento scienze motorie', 'avviamento allo sport', 'centro sportivo scolastico',
    ],
  },
  tecnologia: {
    label: 'tecnologia/coding',
    keywords: [
      'curvatura stem', 'potenziamento stem', 'curvatura steam', 'potenziamento scienze',
      'potenziamento matematica', 'laboratorio scientifico', 'robotica educativa', 'coding',
      'pensiero computazionale', 'curvatura digitale', 'fabbricazione digitale', 'fablab scolastico',
      'stampa 3d',
    ],
  },
  ambiente: {
    label: 'ambiente/natura',
    keywords: [
      'curvatura ecologica', 'curvatura ambientale', 'curvatura green', 'educazione alla sostenibilità',
      'outdoor education', 'orto scolastico didattico',
    ],
  },
  umanistica: {
    label: 'umanistica/lettere',
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

function elencoTemi() {
  return Object.entries(VOCABOLARIO).map(([key, v]) => ({ key, label: v.label }));
}

function estraiTemi(pagesHtml) {
  const text = pagesHtml.map(stripHtmlToText).join(' ');
  const risultati = [];

  for (const [key, { label, keywords }] of Object.entries(VOCABOLARIO)) {
    let count = 0;
    const matched = new Set();
    for (const kw of keywords) {
      const re = new RegExp(`\\b${escapeRegex(kw)}\\w*`, 'gi');
      const m = text.match(re);
      if (m) {
        count += m.length;
        matched.add(kw);
      }
    }
    if (count > 0) {
      risultati.push({ key, label, count, keywordsTrovate: Array.from(matched) });
    }
  }

  risultati.sort((a, b) => b.count - a.count);
  return {
    tuttiITemi: elencoTemi(),
    temiTrovati: risultati,
    top5: risultati.slice(0, 5),
  };
}

module.exports = { estraiTemi, elencoTemi, VOCABOLARIO };
