// Obiettivi di una comunicazione efficace tra cui il dirigente sceglie al passaggio 2 (concordati con Andrea, 2026-10-05).
const OBIETTIVI = [
  {
    key: 'iscrizioni',
    label: "Aumentare le iscrizioni e ottimizzare l'occupazione dei posti nelle classi",
    frase: "aumentare le iscrizioni e ottimizzare l'occupazione dei posti nelle classi",
  },
  {
    key: 'numeri',
    label: 'Raggiungere più velocemente i numeri necessari per attivare classi e corsi',
    frase: 'raggiungere più velocemente i numeri necessari per attivare classi e corsi',
  },
  {
    key: 'reputazione',
    label: 'Migliorare la reputazione della scuola e il gradimento degli iscritti',
    frase: 'migliorare la reputazione della scuola e il gradimento degli iscritti',
  },
];

const CHIAVI = new Set(OBIETTIVI.map((o) => o.key));

// Ripulisce l'input del modulo: solo chiavi note (senza doppioni, nell'ordine dell'elenco) e obiettivi liberi
// (testo ripulito, max `maxLiberi`, max 200 caratteri ciascuno, senza doppioni).
function normalizzaObiettivi(sceltiInput, liberiInput, maxLiberi = 5) {
  const arr = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
  const richiesti = new Set(arr(sceltiInput).filter((k) => CHIAVI.has(k)));
  const scelti = OBIETTIVI.map((o) => o.key).filter((k) => richiesti.has(k));
  const visti = new Set();
  const liberi = [];
  for (const v of arr(liberiInput)) {
    const t = String(v || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!t || visti.has(t.toLowerCase())) continue;
    visti.add(t.toLowerCase());
    liberi.push(t);
    if (liberi.length >= maxLiberi) break;
  }
  return { scelti, liberi };
}

module.exports = { OBIETTIVI, normalizzaObiettivi };
