const https = require('https');
const cache = require('./cache');
const { computeMetrics } = require('./metrics');

const N_VIDEO = 10;
const GIORNI_INATTIVO = 365;

const TEMI_CHIAVE = [
  { etichetta: 'virtual tour', pattern: /virtual\s*tour|tour\s*virtuale|tour\s*della\s*scuola/i },
  { etichetta: 'interviste ai docenti', pattern: /intervist[ae][^.]{0,30}(docent|insegnant|prof)/i },
  { etichetta: 'giornata tipo', pattern: /giornata\s*tipo|una?\s*giornata\s*a\s*scuola/i },
];

const LIVELLI = { 0: 'Insufficiente', 1: 'Sufficiente', 3: 'Buono' };

function erroreYoutube(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(body) });
        } catch (e) {
          reject(erroreYoutube('UNKNOWN', 'Risposta non valida da YouTube'));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(erroreYoutube('RATE_LIMIT', 'YouTube non ha risposto in tempo'));
    });
    req.on('error', () => reject(erroreYoutube('UNKNOWN', 'Errore di rete verso YouTube')));
  });
}

function analizzaInput(handleOUrl) {
  const valore = (handleOUrl || '').trim();
  if (!valore) return null;

  if (/^https?:\/\//i.test(valore)) {
    try {
      const u = new URL(valore);
      const parti = u.pathname.split('/').filter(Boolean);
      if (parti[0] === 'channel' && parti[1]) return { tipo: 'id', valore: parti[1] };
      if (parti[0] === 'user' && parti[1]) return { tipo: 'forUsername', valore: parti[1] };
      if (parti[0] === 'c' && parti[1]) return { tipo: 'forHandle', valore: parti[1] };
      if (parti[0] && parti[0].startsWith('@')) return { tipo: 'forHandle', valore: parti[0] };
      if (parti[0]) return { tipo: 'forHandle', valore: '@' + parti[0].replace(/^@/, '') };
      return null;
    } catch (e) {
      return null;
    }
  }

  return { tipo: 'forHandle', valore: valore.startsWith('@') ? valore : '@' + valore };
}

async function risolviCanale(input, apiKey) {
  const params = new URLSearchParams({ key: apiKey, part: 'snippet,statistics,contentDetails' });
  if (input.tipo === 'id') params.set('id', input.valore);
  else if (input.tipo === 'forUsername') params.set('forUsername', input.valore);
  else params.set('forHandle', input.valore);

  let { status, json } = await getJson(`https://www.googleapis.com/youtube/v3/channels?${params.toString()}`);

  if (status === 200 && (!json.items || !json.items.length) && input.tipo === 'forHandle') {
    const ricerca = new URLSearchParams({
      key: apiKey,
      part: 'snippet',
      type: 'channel',
      maxResults: '1',
      q: input.valore.replace(/^@/, ''),
    });
    const trovato = await getJson(`https://www.googleapis.com/youtube/v3/search?${ricerca.toString()}`);
    const channelId = trovato.json && trovato.json.items && trovato.json.items[0] && trovato.json.items[0].id && trovato.json.items[0].id.channelId;
    if (channelId) {
      const dettaglio = await getJson(
        `https://www.googleapis.com/youtube/v3/channels?${new URLSearchParams({ key: apiKey, part: 'snippet,statistics,contentDetails', id: channelId }).toString()}`
      );
      status = dettaglio.status;
      json = dettaglio.json;
    }
  }

  if (status === 403) throw erroreYoutube('RATE_LIMIT', 'Quota YouTube esaurita o chiave non valida');
  if (status !== 200) throw erroreYoutube('UNKNOWN', 'Errore nella richiesta a YouTube');
  if (!json.items || !json.items.length) throw erroreYoutube('NOT_FOUND', 'Canale YouTube non trovato');

  return json.items[0];
}

function livelloDaSoglie(valore, sogliaBuono, sogliaSufficiente) {
  if (valore == null) return null;
  if (valore >= sogliaBuono) return 3;
  if (valore >= sogliaSufficiente) return 1;
  return 0;
}

async function analizzaCanaleYouTube(canale) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return {
      ...canale,
      disponibile: false,
      motivo: 'Chiave API di YouTube non configurata sul server.',
      youtube: null,
    };
  }

  const input = analizzaInput(canale.url);
  if (!input) {
    return { ...canale, disponibile: false, motivo: 'Indirizzo del canale YouTube non riconosciuto.', youtube: null };
  }

  const cacheKey = canale.url.toLowerCase();
  const inCache = cache.leggi('youtube', cacheKey);
  if (inCache) return { ...canale, ...inCache };

  try {
    const canaleInfo = await risolviCanale(input, apiKey);
    const channelId = canaleInfo.id;
    const stats = canaleInfo.statistics || {};
    const uploadsPlaylist = canaleInfo.contentDetails && canaleInfo.contentDetails.relatedPlaylists && canaleInfo.contentDetails.relatedPlaylists.uploads;

    let video = [];
    if (uploadsPlaylist) {
      const itemsRes = await getJson(
        `https://www.googleapis.com/youtube/v3/playlistItems?${new URLSearchParams({
          key: apiKey,
          part: 'contentDetails',
          playlistId: uploadsPlaylist,
          maxResults: String(N_VIDEO),
        }).toString()}`
      );
      const videoIds = ((itemsRes.json && itemsRes.json.items) || []).map((it) => it.contentDetails && it.contentDetails.videoId).filter(Boolean);

      if (videoIds.length) {
        const videosRes = await getJson(
          `https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({
            key: apiKey,
            part: 'snippet,statistics',
            id: videoIds.join(','),
          }).toString()}`
        );
        video = (videosRes.json && videosRes.json.items) || [];
      }
    }

    const posts = video.map((v) => ({
      timestamp: v.snippet && v.snippet.publishedAt,
      likes: v.statistics && v.statistics.likeCount != null ? Number(v.statistics.likeCount) : null,
      comments: v.statistics && v.statistics.commentCount != null ? Number(v.statistics.commentCount) : null,
      views: v.statistics && v.statistics.viewCount != null ? Number(v.statistics.viewCount) : null,
    }));

    const metriche = computeMetrics({ posts, historyTruncated: video.length >= N_VIDEO });

    const iscritti = stats.hiddenSubscriberCount ? null : stats.subscriberCount != null ? Number(stats.subscriberCount) : null;
    const videoTotali = stats.videoCount != null ? Number(stats.videoCount) : null;

    const conViste = posts.filter((p) => p.views != null);
    const mediaVisualizzazioni = conViste.length ? Math.round(conViste.reduce((s, p) => s + p.views, 0) / conViste.length) : null;

    let ultimoVideoIso = null;
    let giorniUltimoVideo = null;
    for (const p of posts) {
      const t = p.timestamp ? new Date(p.timestamp).getTime() : null;
      if (t && (!ultimoVideoIso || t > new Date(ultimoVideoIso).getTime())) ultimoVideoIso = p.timestamp;
    }
    if (ultimoVideoIso) {
      giorniUltimoVideo = Math.max(0, Math.round((Date.now() - new Date(ultimoVideoIso).getTime()) / 86400000));
    }

    const testoRecente = video.map((v) => `${(v.snippet && v.snippet.title) || ''} ${(v.snippet && v.snippet.description) || ''}`).join(' \n ');
    const temiTrovati = TEMI_CHIAVE.filter((t) => t.pattern.test(testoRecente)).map((t) => t.etichetta);

    const livelloVideoTotali = livelloDaSoglie(videoTotali, 30, 10);
    const livelloUltimoVideo = giorniUltimoVideo == null ? null : giorniUltimoVideo <= 180 ? 3 : giorniUltimoVideo <= GIORNI_INATTIVO ? 1 : 0;
    const livelloIscritti = livelloDaSoglie(iscritti, 1000, 500);
    const livelloVisualizzazioni = livelloDaSoglie(mediaVisualizzazioni, 1000, 300);
    const livelloInterazioni = livelloDaSoglie(metriche.mediaInterazioni, 30, 15);
    const livelloTemi = temiTrovati.length ? 3 : 0;

    const risultato = {
      disponibile: true,
      motivo: null,
      youtube: {
        videoTotali,
        livelloVideoTotali: livelloVideoTotali != null ? LIVELLI[livelloVideoTotali] : null,
        ultimoVideoIso,
        giorniUltimoVideo,
        inattivo: giorniUltimoVideo != null && giorniUltimoVideo > GIORNI_INATTIVO,
        livelloUltimoVideo: livelloUltimoVideo != null ? LIVELLI[livelloUltimoVideo] : null,
        iscritti,
        livelloIscritti: livelloIscritti != null ? LIVELLI[livelloIscritti] : null,
        mediaVisualizzazioni,
        livelloVisualizzazioni: livelloVisualizzazioni != null ? LIVELLI[livelloVisualizzazioni] : null,
        mediaInterazioni: metriche.mediaInterazioni,
        livelloInterazioni: livelloInterazioni != null ? LIVELLI[livelloInterazioni] : null,
        temiTrovati,
        livelloTemi: LIVELLI[livelloTemi],
        notaCommunity: "Post della scheda Community: non verificabile in automatico con le API pubbliche di YouTube — valutalo manualmente se rilevante.",
      },
    };

    cache.scrivi('youtube', cacheKey, risultato);
    return { ...canale, ...risultato };
  } catch (e) {
    return { ...canale, disponibile: false, motivo: e.message || 'Analisi del canale YouTube non riuscita.', youtube: null };
  }
}

module.exports = { analizzaCanaleYouTube, TEMI_CHIAVE, GIORNI_INATTIVO };
