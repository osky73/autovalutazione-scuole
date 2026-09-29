const https = require('https');
const cache = require('./cache');

const LIVELLI = { 0: 'Insufficiente', 1: 'Sufficiente', 3: 'Buono' };
const MOTIVO_NON_DISPONIBILE_TITOLARE =
  "Non disponibile con le API pubbliche di Google: richiede l'accesso come titolare verificato tramite la Business Profile API.";

function postJson(url, body, headers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'POST',
        timeout: 8000,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
      },
      (res) => {
        let out = '';
        res.on('data', (c) => (out += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(out || '{}') });
          } catch (e) {
            reject(new Error('Risposta non valida da Google Places'));
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Google Places non ha risposto in tempo'));
    });
    req.on('error', () => reject(new Error('Errore di rete verso Google Places')));
    req.write(data);
    req.end();
  });
}

function getJson(url, headers) {
  return new Promise((resolve, reject) => {
    const https2 = require('https');
    const req = https2.get(url, { timeout: 8000, headers }, (res) => {
      let out = '';
      res.on('data', (c) => (out += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(out || '{}') });
        } catch (e) {
          reject(new Error('Risposta non valida da Google Places'));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Google Places non ha risposto in tempo'));
    });
    req.on('error', () => reject(new Error('Errore di rete verso Google Places')));
  });
}

function livelloDaBooleano(v) {
  return v ? 3 : 0;
}

function criterio(valore, punteggio, escluso, motivoEsclusione) {
  return {
    valore: valore === undefined ? null : valore,
    punteggio: escluso ? null : punteggio,
    etichetta: escluso ? 'Non disponibile' : punteggio != null ? LIVELLI[punteggio] : 'Non disponibile',
    escluso: !!escluso,
    motivoEsclusione: escluso ? motivoEsclusione : null,
  };
}

async function analizzaGBP({ nomeScuola, localita }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {
      stato: 'non_disponibile',
      messaggio: 'Chiave Google Maps non configurata sul server: impossibile verificare la scheda Google Business Profile.',
      criteri: {},
    };
  }

  const query = [nomeScuola, localita].filter(Boolean).join(' ').trim();
  const cacheKey = query.toLowerCase();
  const inCache = cache.leggi('gbp', cacheKey);
  if (inCache) return inCache;

  try {
    const ricerca = await postJson(
      'https://places.googleapis.com/v1/places:searchText',
      { textQuery: query, languageCode: 'it' },
      { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'places.id' }
    );

    if (ricerca.status !== 200) {
      throw new Error('Errore nella ricerca della scheda su Google Places');
    }

    const placeId = ricerca.json.places && ricerca.json.places[0] && ricerca.json.places[0].id;
    if (!placeId) {
      const risultato = {
        stato: 'assente',
        messaggio: 'Non abbiamo trovato alcuna scheda Google Business Profile corrispondente al nome e alla località della scuola.',
        findingCommerciale:
          'Nessuna scheda Google Business Profile: crearla e verificarla è una delle azioni più semplici ed economiche per migliorare subito la visibilità locale su Google Maps e nella ricerca.',
        criteri: {},
      };
      cache.scrivi('gbp', cacheKey, risultato);
      return risultato;
    }

    const dettagli = await getJson(
      `https://places.googleapis.com/v1/places/${placeId}?` +
        new URLSearchParams({
          fields:
            'id,displayName,formattedAddress,businessStatus,types,primaryType,primaryTypeDisplayName,rating,userRatingCount,regularOpeningHours,photos,websiteUri,googleMapsUri',
        }).toString(),
      { 'X-Goog-Api-Key': apiKey }
    );

    if (dettagli.status !== 200) {
      throw new Error('Errore nel recupero dei dettagli della scheda Google Places');
    }

    const p = dettagli.json;

    const haOrariSpecifici = !!(p.regularOpeningHours && p.regularOpeningHours.periods && p.regularOpeningHours.periods.length);
    const haSitoWeb = !!p.websiteUri;
    const numeroFoto = (p.photos || []).length;
    const haMoltefoto = numeroFoto >= 5;

    const segnaliGestione = [haOrariSpecifici, haSitoWeb, haMoltefoto].filter(Boolean).length;
    const stato = segnaliGestione >= 2 ? 'reclamata' : 'non_reclamata';
    const isReclamata = stato === 'reclamata';

    const categoria = (p.primaryTypeDisplayName && p.primaryTypeDisplayName.text) || (p.types && p.types[0]) || null;
    const categoriaCoerente = (p.types || []).some((t) => /school/i.test(t));

    const criteri = {
      categoria: criterio(categoria, categoria == null ? 0 : categoriaCoerente ? 3 : 1, false),
      orari: criterio(haOrariSpecifici ? 'Orari specifici pubblicati' : 'Orari assenti o generici', livelloDaBooleano(haOrariSpecifici), false),
      foto: criterio(numeroFoto, numeroFoto >= 5 ? 3 : numeroFoto >= 1 ? 1 : 0, false),
      recensioni: criterio(
        { numero: p.userRatingCount || 0, media: p.rating || null },
        p.userRatingCount >= 10 && p.rating >= 4 ? 3 : p.userRatingCount >= 1 ? 1 : 0,
        false
      ),
      evento: criterio(null, null, true, 'Le schede Evento (es. open day) non sono esposte dalle Places API pubbliche.'),
      qa: criterio(null, null, true, 'Le Domande e risposte pubbliche non sono esposte dalle Places API pubbliche.'),
      frequenzaPost: criterio(null, null, true, MOTIVO_NON_DISPONIBILE_TITOLARE),
      tassoRisposteRecensioni: criterio(null, null, true, MOTIVO_NON_DISPONIBILE_TITOLARE),
    };

    const applicabili = Object.values(criteri).filter((c) => !c.escluso && c.punteggio != null);
    const media = applicabili.length ? applicabili.reduce((s, c) => s + c.punteggio, 0) / applicabili.length : null;
    const puntiFinali = media == null ? null : media >= 2.5 ? 3 : media >= 1 ? 1 : 0;

    let messaggio;
    if (isReclamata) {
      messaggio =
        `La scheda risulta probabilmente gestita attivamente dalla scuola (stima basata su segnali indiretti: ` +
        `${[haSitoWeb ? 'sito web collegato' : null, haOrariSpecifici ? 'orari specifici' : null, haMoltefoto ? 'diverse foto caricate' : null]
          .filter(Boolean)
          .join(', ')}). Non è comunque possibile verificarlo con certezza senza le credenziali del titolare: frequenza dei post e tasso di risposta alle recensioni restano non disponibili.`;
    } else {
      messaggio =
        'Questa scheda non risulta gestita attivamente dalla scuola (stima basata sull\'assenza di segnali indiretti come sito web collegato, orari specifici o foto caricate in numero significativo): non abbiamo potuto valutare la frequenza dei post e la reattività alle recensioni.';
    }

    const risultato = {
      stato,
      confidenzaStato: 'stimato',
      placeId,
      nome: (p.displayName && p.displayName.text) || nomeScuola,
      indirizzo: p.formattedAddress || null,
      mapsUrl: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      punteggio: puntiFinali != null ? LIVELLI[puntiFinali] : null,
      criteri,
      messaggio,
      findingCommerciale: !isReclamata
        ? 'La scheda Google Business Profile della scuola non risulta gestita attivamente: prenderne possesso e verificarla è una quick win a basso costo, spesso la più semplice da proporre per migliorare subito la presenza locale su Google.'
        : null,
    };

    cache.scrivi('gbp', cacheKey, risultato);
    return risultato;
  } catch (e) {
    return {
      stato: 'errore',
      messaggio: e.message || 'Impossibile verificare la scheda Google Business Profile in questo momento.',
      criteri: {},
    };
  }
}

module.exports = { analizzaGBP };
