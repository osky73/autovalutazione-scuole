const https = require('https');

function fetchPsiScore(url, { timeoutMs = 7000 } = {}) {
  return new Promise((resolve) => {
    const api =
      'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=performance&url=' +
      encodeURIComponent(url);

    const req = https.get(api, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const score = json?.lighthouseResult?.categories?.performance?.score;
          if (typeof score === 'number') {
            return resolve({ source: 'psi', score: Math.round(score * 100) });
          }
        } catch (e) {
          /* fallthrough a euristica */
        }
        resolve({ source: 'unavailable' });
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ source: 'unavailable' });
    });
    req.on('error', () => resolve({ source: 'unavailable' }));
  });
}

function heuristicScore({ bytes = 0, timeMs = 0 }) {
  let score = 100;
  if (bytes > 3_000_000) score -= 40;
  else if (bytes > 1_500_000) score -= 25;
  else if (bytes > 800_000) score -= 12;

  if (timeMs > 4000) score -= 35;
  else if (timeMs > 2000) score -= 20;
  else if (timeMs > 1000) score -= 10;

  return { source: 'euristica', score: Math.max(0, Math.min(100, score)) };
}

async function getMobileSpeedScore(url, fetchResult) {
  const psi = await fetchPsiScore(url);
  if (psi.source === 'psi') return psi;
  return heuristicScore({ bytes: fetchResult.bytes, timeMs: fetchResult.timeMs });
}

module.exports = { getMobileSpeedScore };
