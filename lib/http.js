const https = require('https');
const http = require('http');
const { URL } = require('url');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

function fetchPage(targetUrl, { timeoutMs = 9000, maxBytes = 2_000_000 } = {}) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (e) {
      return resolve({ ok: false, error: 'URL non valido', url: targetUrl });
    }
    const lib = parsed.protocol === 'http:' ? http : https;
    const start = Date.now();

    const req = lib.get(
      parsed,
      {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
        },
        timeout: timeoutMs,
      },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          const nextUrl = new URL(res.headers.location, parsed).toString();
          if (nextUrl !== targetUrl) {
            return resolve(fetchPage(nextUrl, { timeoutMs, maxBytes }).then((r) => r));
          }
        }

        let body = '';
        let bytes = 0;
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          bytes += Buffer.byteLength(chunk);
          if (bytes > maxBytes) {
            req.destroy();
            return;
          }
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            html: body,
            bytes,
            timeMs: Date.now() - start,
            headers: res.headers,
            finalUrl: targetUrl,
            https: parsed.protocol === 'https:',
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout', url: targetUrl, timeMs: Date.now() - start });
    });
    req.on('error', (err) => {
      resolve({ ok: false, error: err.message, url: targetUrl, timeMs: Date.now() - start });
    });
  });
}

module.exports = { fetchPage, UA };
