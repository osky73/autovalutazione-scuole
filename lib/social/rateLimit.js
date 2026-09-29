const FINESTRA_MS = 60 * 1000;
const MAX_RICHIESTE = 20;
const contatori = new Map();

function consentito(ip) {
  const chiave = ip || 'sconosciuto';
  const ora = Date.now();
  const voce = contatori.get(chiave);
  if (!voce || ora - voce.inizio > FINESTRA_MS) {
    contatori.set(chiave, { inizio: ora, conteggio: 1 });
    return true;
  }
  voce.conteggio += 1;
  return voce.conteggio <= MAX_RICHIESTE;
}

module.exports = { consentito };
