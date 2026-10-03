const cheerio = require('cheerio');
const { URL } = require('url');
const { fetchPage } = require('./http');
const { analizzaCanaleYouTube } = require('./social/youtube-analysis');

const LIVELLI = { 0: 'Insufficiente', 1: 'Sufficiente', 3: 'Buono' };

const PIATTAFORME = [
  { key: 'facebook', label: 'Facebook', re: /(^|\.)facebook\.com$|(^|\.)fb\.com$/i },
  { key: 'instagram', label: 'Instagram', re: /(^|\.)instagram\.com$/i },
  { key: 'twitter', label: 'X (Twitter)', re: /(^|\.)twitter\.com$|(^|\.)x\.com$/i },
  { key: 'tiktok', label: 'TikTok', re: /(^|\.)tiktok\.com$/i },
  { key: 'linkedin', label: 'LinkedIn', re: /(^|\.)linkedin\.com$/i },
  { key: 'youtube', label: 'YouTube', re: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
];

const FASCE_FREQUENZA = {
  alta: { livello: 3, etichetta: '3 o più a settimana' },
  media: { livello: 1, etichetta: '2 a settimana' },
  bassa: { livello: 0, etichetta: '1 a settimana o meno' },
};

const FASCE_INTERAZIONI = {
  alta: { livello: 3, etichetta: '30 o più' },
  media: { livello: 1, etichetta: 'tra 15 e 30' },
  bassa: { livello: 0, etichetta: '15 o meno' },
};

const FASCE_FOLLOWER = {
  alta: { livello: 3, etichetta: 'oltre 1000' },
  media: { livello: 1, etichetta: 'tra 500 e 1000' },
  bassa: { livello: 0, etichetta: 'sotto 500' },
};

function riconosciPiattaforma(url) {
  try {
    const host = new URL(url).hostname;
    return PIATTAFORME.find((p) => p.re.test(host)) || null;
  } catch (e) {
    return null;
  }
}

function discoverSocialLinks(pagesHtml) {
  const found = new Map();
  for (const html of pagesHtml || []) {
    const $ = cheerio.load(html);
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const piattaforma = riconosciPiattaforma(href);
      if (!piattaforma) return;

      let pathname;
      try {
        pathname = new URL(href).pathname.replace(/\/+$/, '');
      } catch (e) {
        return;
      }
      if (!pathname) return;

      const norm = href.split('?')[0].split('#')[0];
      if (!found.has(norm)) {
        found.set(norm, { platform: piattaforma.key, label: piattaforma.label, url: norm });
      }
    });
  }
  return Array.from(found.values());
}

function parseConteggio(str) {
  if (!str) return null;
  const m = str.trim().match(/^([\d]+(?:[.,]\d+)?)\s*([kKmM])?$/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(',', '.'));
  if (m[2] && /k/i.test(m[2])) n *= 1000;
  if (m[2] && /m/i.test(m[2])) n *= 1_000_000;
  return Math.round(n);
}

function estraiFollowerAutomatico(html) {
  const $ = cheerio.load(html);
  const testo = [
    $('meta[property="og:description"]').attr('content') || '',
    $('meta[name="description"]').attr('content') || '',
  ].join(' ');

  const m = testo.match(/([\d]+(?:[.,]\d+)?\s*[kKmM]?)\s*(follower|followers|iscritti|fan)/i);
  return m ? parseConteggio(m[1].replace(/\s+/g, '')) : null;
}

function livelloFollowerDaNumero(follower) {
  if (follower == null) return null;
  if (follower > 1000) return 3;
  if (follower >= 500) return 1;
  return 0;
}

function fasciaDaFrequenza(postSettimana) {
  if (postSettimana == null) return null;
  if (postSettimana >= 3) return 'alta';
  if (postSettimana >= 1.5) return 'media';
  return 'bassa';
}

function fasciaDaInterazioni(media) {
  if (media == null) return null;
  if (media >= 30) return 'alta';
  if (media >= 15) return 'media';
  return 'bassa';
}

async function analizzaCanaleGenerico(canale) {
  let followerAutomatico = null;

  // Nota: non riportiamo più il motivo tecnico del fallimento (es. "codice 400") nella
  // schermata finale — mostriamo sempre un messaggio generico quando il dato non è disponibile
  // (vedi 'Non sono state fornite o trovate indicazioni' in views/social-analisi.ejs).
  const res = await fetchPage(canale.url, { timeoutMs: 9000, maxBytes: 3_000_000 });
  if (res.ok && res.html) {
    followerAutomatico = estraiFollowerAutomatico(res.html);
  }

  const ai = canale.datiAI || null;

  const frequenzaFasciaEffettiva = ai && ai.postSettimana != null ? fasciaDaFrequenza(ai.postSettimana) : canale.frequenzaFascia;
  const interazioniValoreAI = ai && (ai.mediaInterazioni != null ? ai.mediaInterazioni : ai.mediaLike);
  const interazioniFasciaEffettiva = interazioniValoreAI != null ? fasciaDaInterazioni(interazioniValoreAI) : canale.likeFascia;

  const freqInfo = frequenzaFasciaEffettiva ? FASCE_FREQUENZA[frequenzaFasciaEffettiva] : null;
  const interazioniInfo = interazioniFasciaEffettiva ? FASCE_INTERAZIONI[interazioniFasciaEffettiva] : null;

  const frequenzaEtichetta =
    ai && ai.postSettimana != null ? `${ai.postSettimana} post/settimana (rilevato dall'AI)` : freqInfo ? freqInfo.etichetta : null;
  const interazioniEtichetta =
    interazioniValoreAI != null ? `${interazioniValoreAI} interazioni medie (rilevato dall'AI)` : interazioniInfo ? interazioniInfo.etichetta : null;

  let followerLivello = null;
  let followerEtichetta = null;
  let followerFonte = null;
  if (!canale.meno6mesi) {
    if (ai && ai.followers != null) {
      followerLivello = livelloFollowerDaNumero(ai.followers);
      followerEtichetta = `${ai.followers} follower (rilevato dall'AI)`;
      followerFonte = 'ai';
    } else if (canale.followerFascia && FASCE_FOLLOWER[canale.followerFascia]) {
      followerLivello = FASCE_FOLLOWER[canale.followerFascia].livello;
      followerEtichetta = FASCE_FOLLOWER[canale.followerFascia].etichetta;
      followerFonte = 'manuale';
    } else if (followerAutomatico != null) {
      followerLivello = livelloFollowerDaNumero(followerAutomatico);
      followerFonte = 'automatico';
    }
  }

  const disponibile = freqInfo != null || interazioniInfo != null || followerLivello != null || (!canale.meno6mesi && followerAutomatico != null) || !!ai;

  return {
    ...canale,
    disponibile,
    motivo: null,
    frequenzaEtichetta,
    interazioniEtichetta,
    followerAutomatico,
    followerEtichetta,
    followerFonte,
    livelloFrequenza: freqInfo ? LIVELLI[freqInfo.livello] : null,
    livelloInterazioni: interazioniInfo ? LIVELLI[interazioniInfo.livello] : null,
    livelloFollower: followerLivello != null ? LIVELLI[followerLivello] : null,
    dataApertura: ai ? ai.dataApertura : null,
    aperturaStimata: ai ? ai.aperturaStimata : null,
    engagementRate: ai ? ai.engagementRate : null,
    avvisiAI: ai && ai.avvisi && ai.avvisi.length ? ai.avvisi : null,
  };
}

async function analizzaCanale(canale) {
  if (canale.platform === 'youtube') return analizzaCanaleYouTube(canale);
  return analizzaCanaleGenerico(canale);
}

async function analizzaCanali(canali) {
  return Promise.all(canali.map(analizzaCanale));
}

module.exports = { discoverSocialLinks, analizzaCanali, riconosciPiattaforma, PIATTAFORME };
