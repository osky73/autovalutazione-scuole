const DURATA_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

function chiave(platform, handle) {
  return `${platform}::${(handle || '').toLowerCase()}`;
}

function leggi(platform, handle) {
  const voce = cache.get(chiave(platform, handle));
  if (!voce) return null;
  if (Date.now() - voce.ts > DURATA_MS) {
    cache.delete(chiave(platform, handle));
    return null;
  }
  return voce.dati;
}

function scrivi(platform, handle, dati) {
  cache.set(chiave(platform, handle), { dati, ts: Date.now() });
}

module.exports = { leggi, scrivi, DURATA_MS };
