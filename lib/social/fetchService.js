const { infoPiattaforma } = require('./adapters');
const cache = require('./cache');
const { computeMetrics } = require('./metrics');

async function eseguiFetch(platform, handle) {
  const info = infoPiattaforma(platform);
  if (!info || info.livello !== 'A' || !info.adapter || !info.abilitato()) {
    return { ok: false, code: 'NOT_SUPPORTED', supportLevel: 'C' };
  }

  const cacheHit = cache.leggi(platform, handle);
  if (cacheHit) return { ok: true, supportLevel: 'A', metrics: cacheHit, fromCache: true };

  try {
    const profilo = await info.adapter.fetchProfile(handle);
    const metrics = computeMetrics(profilo);
    cache.scrivi(platform, handle, metrics);
    return { ok: true, supportLevel: 'A', metrics };
  } catch (e) {
    return { ok: false, code: e.code || 'UNKNOWN', message: e.message, supportLevel: 'C' };
  }
}

module.exports = { eseguiFetch };
