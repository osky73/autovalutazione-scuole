// Giudizio sull'efficacia della comunicazione (richiesta di Andrea, 2026-10-05): lista dei blocchi per importanza rispetto
// agli obiettivi del dirigente + commento di 5-6 righe. Testi scritti a mano e scelti da regole (nessuna AI).
// I voti (lib/punteggi.js) servono solo a scegliere i testi: non vengono mai mostrati.
const { calcolaPunteggi, SOGLIA_ALTA } = require('./punteggi');
const { OBIETTIVI } = require('./obiettivi');

const IMPORTANZA_ETICHETTE = { fondamentale: 'Fondamentale', importante: 'Importante', accessorio: 'Accessorio' };
const COSA_COMPRENDE = {
  tecnica: 'velocità, struttura e dati tecnici del sito',
  contenuti: 'competenze comunicate, posizionamento su Google, blog',
  comunicazione: 'social, scheda Google Business Profile, newsletter',
};
const ORDINE_IMPORTANZA = ['fondamentale', 'importante', 'accessorio'];

const GIUDIZI = {
  alta: { chiave: 'efficace', etichetta: 'efficace' },
  media: { chiave: 'parziale', etichetta: 'efficace solo in parte' },
  bassa: { chiave: 'insufficiente', etichetta: 'non ancora sufficiente' },
};

// Frase completa sul blocco (per fondamentale e importante), per fascia del blocco.
const FRASE_BLOCCO = {
  tecnica: {
    alta: 'Il sito è tecnicamente solido: si carica bene, funziona da mobile ed è leggibile dai motori di ricerca, quindi non ostacola chi arriva dalla ricerca.',
    media: 'Il sito funziona, ma ha alcune carenze tecniche che rallentano chi arriva e riducono la resa dei contenuti.',
    bassa: 'Il sito ha problemi tecnici rilevanti che penalizzano visibilità ed esperienza di chi lo visita: conviene risolverli prima di investire in altro.',
  },
  contenuti: {
    alta: 'I contenuti lavorano bene: le competenze della scuola emergono sul sito, compaiono nelle ricerche delle famiglie e il blog è aggiornato con regolarità.',
    media: 'I contenuti ci sono ma raccontano solo in parte ciò che distingue la scuola: alcune competenze non emergono o non compaiono nelle ricerche, e il blog è poco regolare.',
    bassa: 'Le famiglie che cercano online faticano a trovare la scuola e a capire che cosa la distingue: poche competenze comunicate, scarsa presenza nelle ricerche, blog fermo o assente.',
  },
  comunicazione: {
    alta: 'La scuola comunica con continuità: social attivi, scheda Google curata e newsletter regolare mantengono vivo il rapporto con le famiglie.',
    media: 'La comunicazione c\'è ma è discontinua: alcuni canali sono attivi, altri trascurati (social, scheda Google o newsletter).',
    bassa: 'La comunicazione è quasi assente: canali social fermi o mancanti, scheda Google poco curata e nessuna newsletter, quindi poco contatto con le famiglie.',
  },
};

// Versione breve (una riga) per il blocco accessorio.
const FRASE_BREVE = {
  tecnica: { alta: 'Il sito è tecnicamente solido.', media: 'Il sito funziona, con alcune carenze tecniche.', bassa: 'Il sito ha problemi tecnici da risolvere.' },
  contenuti: { alta: 'I contenuti lavorano bene.', media: 'I contenuti raccontano solo in parte la scuola.', bassa: 'I contenuti sono ancora scarsi.' },
  comunicazione: { alta: 'La comunicazione è continua.', media: 'La comunicazione è discontinua.', bassa: 'La comunicazione è quasi assente.' },
};

const NON_VALUTATO = {
  tecnica: 'L\'analisi tecnica del sito non è disponibile.',
  contenuti: 'I contenuti non sono stati valutati perché i passaggi relativi sono stati saltati.',
  comunicazione: 'La comunicazione non è stata valutata perché i passaggi relativi sono stati saltati.',
};

const CHIUSURA = {
  alta: 'L\'impostazione è buona: conviene consolidarla e misurarne i risultati.',
  media: 'Intervenendo sui punti deboli, l\'efficacia della tua comunicazione può crescere in modo sensibile.',
  bassa: 'Serve un intervento mirato, partendo dal blocco più importante per il tuo obiettivo.',
};

function fasciaDaVoto(voto) {
  return voto == null ? null : voto >= SOGLIA_ALTA ? 'alta' : voto >= 40 ? 'media' : 'bassa';
}

// Frase che riassume gli obiettivi predefiniti scelti ("a, b e c"); quelli liberi non entrano nel commento.
function fraseObiettivi(obiettivi) {
  const frasi = ((obiettivi && obiettivi.scelti) || []).map((k) => (OBIETTIVI.find((o) => o.key === k) || {}).frase).filter(Boolean);
  if (!frasi.length) return null;
  if (frasi.length === 1) return frasi[0];
  return frasi.slice(0, -1).join(', ') + ' e ' + frasi[frasi.length - 1];
}

// Dato concreto tratto dall'analisi reale, per un indicatore e il suo voto. Ritorna null se non c'è nulla di sensato da dire.
function dettaglioIndicatore(key, voto, sessione) {
  const basso = voto < 50;
  const alto = voto >= SOGLIA_ALTA;
  const ae = sessione.attivitaEditoriale || {};
  switch (key) {
    case 'audit_tecnico': {
      const peggiore = sessione.audit && sessione.audit.worst;
      return peggiore && peggiore.label && !alto ? `Il punto tecnico più debole è: ${peggiore.label.toLowerCase()}.` : alto ? 'I controlli tecnici sul sito danno un buon esito.' : null;
    }
    case 'competenze_sito': {
      const dichiarate = (sessione.dichiarati || []).length;
      if (!dichiarate) return null;
      const trovate = Math.round((voto / 100) * dichiarate);
      return trovate >= dichiarate
        ? 'Tutte le competenze che hai indicato si ritrovano nel sito.'
        : `Delle ${dichiarate} competenze che hai indicato, ${trovate} si ritrovano nel sito.`;
    }
    case 'posizionamento': {
      const risultati = (sessione.posizionamento || []).filter((r) => r.disponibile);
      if (!risultati.length) return null;
      const presenti = risultati.filter((r) => r.migliore).length;
      return presenti === 0
        ? 'Per nessuna delle competenze cercate la scuola compare nella prima pagina di Google.'
        : `Su Google la scuola compare in prima pagina per ${presenti} delle ${risultati.length} competenze cercate.`;
    }
    case 'blog_stato': {
      const stato = ae.contenuti && ae.contenuti.stato;
      return { assente: 'Sul sito non c\'è un blog o una sezione news.', fermo: 'Il blog risulta fermo da tempo.', rallentato: 'Il blog viene aggiornato in modo poco regolare.', attivo: 'Il blog è aggiornato con regolarità.' }[stato] || null;
    }
    case 'blog_frequenza':
      return basso ? 'La frequenza di pubblicazione nel blog è bassa.' : alto ? 'Il blog pubblica con buona frequenza.' : null;
    case 'blog_ottimizzazione':
      return basso ? 'Gli ultimi articoli del blog sono poco ottimizzati per i motori di ricerca.' : alto ? 'Gli ultimi articoli del blog sono ben ottimizzati.' : null;
    case 'blog_competenze':
      return voto === 0 ? 'Il blog non tratta le competenze che hai indicato.' : 'Il blog tratta le competenze che hai indicato.';
    case 'social':
      return basso ? 'I canali social indicati risultano poco attivi o poco seguiti.' : alto ? 'I canali social indicati sono attivi e seguiti.' : 'I canali social indicati sono attivi solo in parte.';
    case 'gbp':
      return sessione.gbp && sessione.gbp.stato === 'assente'
        ? 'Non abbiamo trovato una scheda Google Business Profile della scuola.'
        : basso ? 'La scheda Google della scuola è poco curata.' : alto ? 'La scheda Google della scuola è curata.' : 'La scheda Google della scuola è curata solo in parte.';
    case 'newsletter': {
      const n = sessione.audit && sessione.audit.newsletter;
      if (!n) return null;
      if (n.stato === 'presente') return 'Sul sito c\'è un sistema di iscrizione alla newsletter collegato a una piattaforma.';
      return n.sottocaso === 'meccanismo_senza_esp'
        ? 'Il sito raccoglie indirizzi email ma non risulta collegato a una piattaforma di newsletter.'
        : 'Sul sito non c\'è un sistema di iscrizione alla newsletter.';
    }
    default:
      return null;
  }
}

// Indicatore su cui costruire il dato concreto: il più debole tra quelli valutabili del blocco (a pari voto, il più pesante).
function indicatorePiuDebole(blocco) {
  const validi = blocco.indicatori.filter((i) => i.voto != null);
  if (!validi.length) return null;
  return validi.slice().sort((a, b) => a.voto - b.voto || b.peso - a.peso)[0];
}

// I 3 blocchi ordinati per importanza rispetto agli obiettivi (fondamentale/importante/accessorio), con le
// etichette pronte per la vista. Riusata anche dal passaggio 13 (punti deboli e contatto, lib/contatto.js) per
// mostrare gli stessi blocchi nello stesso ordine del giudizio, senza ricalcolare nulla di diverso.
function blocchiOrdinati(p) {
  return ORDINE_IMPORTANZA.map((imp) => {
    const key = Object.keys(p.importanza).find((b) => p.importanza[b] === imp);
    return { key, importanza: imp, importanzaEtichetta: IMPORTANZA_ETICHETTE[imp], etichetta: p.blocchi[key].etichetta, comprende: COSA_COMPRENDE[key], fascia: p.blocchi[key].fascia };
  });
}

function costruisciGiudizio(sessione) {
  const p = calcolaPunteggi(sessione);
  const fasciaFinale = p.finale.fascia;

  const blocchi = blocchiOrdinati(p);

  if (!fasciaFinale) {
    return {
      blocchi,
      giudizio: null,
      commento: ['Non abbiamo dati sufficienti per formulare un giudizio: i passaggi dell\'analisi sono stati saltati o non hanno restituito risultati.'],
    };
  }

  const obiettivi = fraseObiettivi(sessione.obiettivi);
  const piuObiettivi = ((sessione.obiettivi && sessione.obiettivi.scelti) || []).length > 1;
  const giudizio = GIUDIZI[fasciaFinale];
  const apertura = obiettivi
    ? `Rispetto ${piuObiettivi ? 'agli obiettivi' : "all'obiettivo"} di ${obiettivi}, la comunicazione della tua scuola risulta ${giudizio.etichetta}.`
    : `Nel complesso, la comunicazione della tua scuola risulta ${giudizio.etichetta}.`;

  const [fondamentale, importante, accessorio] = blocchi;
  const frase = (b, breve) => (b.fascia == null ? NON_VALUTATO[b.key] : (breve ? FRASE_BREVE : FRASE_BLOCCO)[b.key][b.fascia]);

  const righe = [apertura, frase(fondamentale, false), frase(importante, false), frase(accessorio, true)];

  // Dato concreto dall'analisi reale: indicatore più debole del blocco fondamentale (se non valutabile, del successivo).
  for (const b of [fondamentale, importante, accessorio]) {
    const debole = indicatorePiuDebole(p.blocchi[b.key]);
    const testo = debole ? dettaglioIndicatore(debole.key, debole.voto, sessione) : null;
    if (testo) {
      righe.push(testo);
      break;
    }
  }
  righe.push(CHIUSURA[fasciaFinale]);

  return { blocchi, giudizio: { fascia: fasciaFinale, chiave: giudizio.chiave, etichetta: giudizio.etichetta }, commento: righe };
}

module.exports = { costruisciGiudizio, fraseObiettivi, fasciaDaVoto, blocchiOrdinati, dettaglioIndicatore };
