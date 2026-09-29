const express = require('express');
const { creaSessione, getSessione } = require('./lib/store');
const { runAudit } = require('./lib/runAudit');
const { estraiTemi, elencoTemi, VOCABOLARIO } = require('./lib/temi');
const { estraiLocalita } = require('./lib/localita');
const { verificaPosizionamentoCluster } = require('./lib/serp');
const { discoverSocialLinks, analizzaCanali } = require('./lib/social');
const { eseguiFetch } = require('./lib/social/fetchService');
const { riconosciPiattaforma } = require('./lib/social/platforms');
const { estraiDati } = require('./lib/social/extract');
const { valutaPresenza } = require('./lib/social/assess');
const { providerDisponibile } = require('./lib/social/ai');
const { consentito } = require('./lib/social/rateLimit');
const { computeMetrics } = require('./lib/social/metrics');
const { analizzaGBP } = require('./lib/social/gbp');

const app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '8mb' }));

const PORT = process.env.PORT || 3000;

function calcolaConfermati(sessione) {
  const dichiarati = sessione.dichiarati || [];
  const trovati = (sessione.temi && sessione.temi.estrazione && sessione.temi.estrazione.temiTrovati) || [];
  const chiaviDichiarate = new Set(dichiarati.filter((t) => t.key).map((t) => t.key));
  const aggiuntivi = trovati
    .filter((t) => !chiaviDichiarate.has(t.key))
    .map((t) => ({ key: t.key, label: t.label }));

  const etichetteViste = new Set();
  const confermati = [];
  for (const t of [...dichiarati, ...aggiuntivi]) {
    const chiave = t.label.toLowerCase();
    if (etichetteViste.has(chiave) || confermati.length >= 10) continue;
    etichetteViste.add(chiave);
    confermati.push(t);
  }
  return confermati;
}

app.get('/', (req, res) => {
  res.render('landing');
});

app.post('/avvia', async (req, res) => {
  const scuola = (req.body.scuola || '').trim();
  const url = (req.body.url || '').trim();

  if (!scuola || !url) {
    return res.status(400).render('landing', {
      errore: 'Inserisci sia il nome della scuola sia l\'indirizzo del sito.',
      valori: { scuola, url },
    });
  }

  const sessione = creaSessione({ scuola, url });
  res.redirect(`/audit/${sessione.id}`);
});

app.get('/audit/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');

  if (sessione.auditErrore) {
    return res.render('audit-errore', { sessione, errore: sessione.auditErrore });
  }

  if (!sessione.audit) {
    return res.render('attesa', {
      titolo: 'Analisi in corso',
      step: 2,
      sessione,
      messaggi: ['Scansione del sito...', 'Lettura dei contenuti...', 'Verifica SEO...', 'Quasi pronto...'],
      pollUrl: `/audit/${sessione.id}/esegui`,
      redirectUrl: `/audit/${sessione.id}`,
    });
  }

  res.render('audit', { sessione, audit: sessione.audit });
});

app.get('/audit/:id/esegui', async (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.status(404).json({ ok: false });

  if (!sessione.audit && !sessione.auditErrore) {
    const risultato = await runAudit(sessione.url);
    if (!risultato.ok) {
      sessione.auditErrore = risultato.error;
    } else {
      sessione.audit = risultato;
      sessione.pagineHtml = risultato.pagineHtml;
    }
  }

  res.json({ ok: true });
});

app.get('/dichiarazione/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.audit) return res.redirect(`/audit/${sessione.id}`);

  res.render('dichiarazione', { sessione, temi: elencoTemi() });
});

app.post('/dichiarazione/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');

  let scelti = req.body.dichiarati || [];
  if (!Array.isArray(scelti)) scelti = [scelti];
  scelti = scelti.filter((k) => VOCABOLARIO[k]);

  let extra = req.body.extra || [];
  if (!Array.isArray(extra)) extra = [extra];
  extra = extra.map((v) => (v || '').trim()).filter(Boolean);

  const daVocabolario = scelti.map((k) => ({ key: k, label: VOCABOLARIO[k].label }));
  const personalizzate = extra.map((testo) => ({ key: null, label: testo }));

  const etichetteViste = new Set();
  const dichiarati = [];
  for (const t of [...daVocabolario, ...personalizzate]) {
    const chiave = t.label.toLowerCase();
    if (etichetteViste.has(chiave) || dichiarati.length >= 5) continue;
    etichetteViste.add(chiave);
    dichiarati.push(t);
  }

  if (!dichiarati.length) {
    return res.redirect(`/dichiarazione/${sessione.id}`);
  }

  sessione.dichiarati = dichiarati;
  sessione.temi = null;
  sessione.confermati = null;
  sessione.posizionamento = null;

  res.redirect(`/verifica/${sessione.id}`);
});

app.get('/verifica/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.audit) return res.redirect(`/audit/${sessione.id}`);
  if (!sessione.dichiarati) return res.redirect(`/dichiarazione/${sessione.id}`);

  if (!sessione.temi) {
    const estrazione = estraiTemi(sessione.pagineHtml || []);
    const chiaviDichiarate = new Set(sessione.dichiarati.map((t) => t.key));
    const temaPiuCitato = estrazione.temiTrovati[0] || null;

    let finding = null;
    if (temaPiuCitato && !chiaviDichiarate.has(temaPiuCitato.key)) {
      const elenco = sessione.dichiarati.map((t) => t.label).join(', ');
      finding = `Il tema più citato nel sito è "${temaPiuCitato.label}", ma non è tra le competenze dichiarate dalla scuola (${elenco}).`;
    }

    sessione.temi = { estrazione, finding };
    sessione.confermati = calcolaConfermati(sessione);

    return res.render('attesa', {
      titolo: 'Verifica in corso',
      step: 4,
      sessione,
      messaggi: ['Lettura dei contenuti...', 'Confronto con le competenze dichiarate...', 'Quasi pronto...'],
      redirectUrl: `/verifica/${sessione.id}`,
      fakeDelayMs: 1400,
    });
  }

  res.render('verifica', { sessione, temi: sessione.temi.estrazione, finding: sessione.temi.finding });
});

app.get('/posizionamento/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.temi) return res.redirect(`/verifica/${sessione.id}`);

  if (!sessione.confermati) {
    sessione.confermati = calcolaConfermati(sessione);
  }
  if (!sessione.confermati.length) {
    return res.redirect(`/dichiarazione/${sessione.id}`);
  }

  if (sessione.localita === undefined) {
    sessione.localita = estraiLocalita(sessione.pagineHtml || []);
  }

  if (!sessione.localita) {
    return res.render('posizionamento-localita', { sessione });
  }

  if (!sessione.posizionamento) {
    return res.render('attesa', {
      titolo: 'Verifica posizionamento',
      step: 5,
      sessione,
      messaggi: ['Interrogazione di Google...', 'Analisi dei risultati...', 'Quasi pronto...'],
      pollUrl: `/posizionamento/${sessione.id}/esegui`,
      redirectUrl: `/posizionamento/${sessione.id}`,
    });
  }

  res.render('posizionamento', { sessione, risultati: sessione.posizionamento });
});

app.get('/posizionamento/:id/esegui', async (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.status(404).json({ ok: false });

  if (sessione.localita && !sessione.posizionamento && sessione.confermati) {
    const valoriConQuery = sessione.confermati.map((t) => {
      const etichettaQuery = t.label.replace(/\//g, ' ');
      const queries = [`scuola media ${etichettaQuery} ${sessione.localita}`];

      if (t.key && VOCABOLARIO[t.key]) {
        for (const kw of VOCABOLARIO[t.key].keywords) {
          queries.push(`scuola media ${kw} ${sessione.localita}`);
        }
      }

      return { label: t.label, queries };
    });

    sessione.posizionamento = await verificaPosizionamentoCluster(valoriConQuery, sessione.audit.homeUrl);
  }

  res.json({ ok: true });
});

app.post('/posizionamento/:id/localita', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');

  const localita = (req.body.localita || '').trim();
  if (!localita) return res.redirect(`/posizionamento/${sessione.id}`);

  sessione.localita = localita;
  res.redirect(`/posizionamento/${sessione.id}`);
});

const ETICHETTE_PIATTAFORMA = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
};

const FASCE_VALIDE = new Set(['alta', 'media', 'bassa']);

function parseFascia(v) {
  return FASCE_VALIDE.has(v) ? v : null;
}

function parseDatiAI(json) {
  if (!json) return null;
  try {
    const dati = JSON.parse(json);
    return dati && typeof dati === 'object' ? dati : null;
  } catch (e) {
    return null;
  }
}

// Passaggio 6 — "Canali social indicati sul sito": tutti i canali trovati con un
// link sul sito, esclusi YouTube e la scheda Google Business Profile, che hanno un
// trattamento dedicato al passaggio successivo.
app.get('/social/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.posizionamento) return res.redirect(`/posizionamento/${sessione.id}`);

  if (sessione.socialTrovati === undefined) {
    sessione.socialTrovati = discoverSocialLinks(sessione.pagineHtml || []);
  }

  const trovatiSenzaYoutube = (sessione.socialTrovati || []).filter((c) => c.platform !== 'youtube');
  res.render('social-conferma', { sessione, trovati: trovatiSenzaYoutube });
});

app.post('/social/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');

  let includiTrovato = req.body.includiTrovato || [];
  if (!Array.isArray(includiTrovato)) includiTrovato = [includiTrovato];
  let meno6mesiTrovato = req.body.meno6mesiTrovato || [];
  if (!Array.isArray(meno6mesiTrovato)) meno6mesiTrovato = [meno6mesiTrovato];
  const meno6mesiSet = new Set(meno6mesiTrovato);

  let freqTrovato = req.body.freqTrovato || [];
  if (!Array.isArray(freqTrovato)) freqTrovato = [freqTrovato];
  let likeTrovato = req.body.likeTrovato || [];
  if (!Array.isArray(likeTrovato)) likeTrovato = [likeTrovato];
  let followerTrovato = req.body.followerTrovato || [];
  if (!Array.isArray(followerTrovato)) followerTrovato = [followerTrovato];
  let aiDatiTrovato = req.body.aiDatiTrovato || [];
  if (!Array.isArray(aiDatiTrovato)) aiDatiTrovato = [aiDatiTrovato];

  const trovatiSenzaYoutube = (sessione.socialTrovati || []).filter((c) => c.platform !== 'youtube');
  const confermati = trovatiSenzaYoutube
    .map((c, i) => ({
      ...c,
      meno6mesi: meno6mesiSet.has(c.url),
      frequenzaFascia: parseFascia(freqTrovato[i]),
      likeFascia: parseFascia(likeTrovato[i]),
      followerFascia: parseFascia(followerTrovato[i]),
      datiAI: parseDatiAI(aiDatiTrovato[i]),
    }))
    .filter((c) => includiTrovato.includes(c.url));

  sessione.socialConfermati = confermati;
  sessione.gbp = null;
  sessione.socialAnalisi = null;
  sessione.socialValutazione = null;

  res.redirect(`/social/${sessione.id}/altri`);
});

// Passaggio 7 — "Altri canali social": YouTube (solo se trovato sul sito), la
// scheda Google Business Profile (valutata automaticamente, senza conferma
// manuale: è deterministica) e l'aggiunta di un canale a mano.
app.get('/social/:id/altri', async (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.socialConfermati) return res.redirect(`/social/${sessione.id}`);

  const youtube = (sessione.socialTrovati || []).find((c) => c.platform === 'youtube') || null;

  if (!sessione.gbp) {
    sessione.gbp = await analizzaGBP({ nomeScuola: sessione.scuola, localita: sessione.localita });
  }

  res.render('social-altri', { sessione, youtube, gbp: sessione.gbp });
});

app.post('/social/:id/altri', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');

  const youtube = (sessione.socialTrovati || []).find((c) => c.platform === 'youtube') || null;

  let includiYoutube = req.body.includiYoutube || [];
  if (!Array.isArray(includiYoutube)) includiYoutube = [includiYoutube];
  const youtubeConfermato = youtube && includiYoutube.includes(youtube.url) ? [{ ...youtube }] : [];

  let extraUrl = req.body.extraUrl || [];
  if (!Array.isArray(extraUrl)) extraUrl = [extraUrl];
  let extraPlatform = req.body.extraPlatform || [];
  if (!Array.isArray(extraPlatform)) extraPlatform = [extraPlatform];
  let extraMeno6mesi = req.body.extraMeno6mesi || [];
  if (!Array.isArray(extraMeno6mesi)) extraMeno6mesi = [extraMeno6mesi];
  let extraFreq = req.body.extraFreq || [];
  if (!Array.isArray(extraFreq)) extraFreq = [extraFreq];
  let extraLike = req.body.extraLike || [];
  if (!Array.isArray(extraLike)) extraLike = [extraLike];
  let extraFollower = req.body.extraFollower || [];
  if (!Array.isArray(extraFollower)) extraFollower = [extraFollower];
  let aiDatiExtra = req.body.aiDatiExtra || [];
  if (!Array.isArray(aiDatiExtra)) aiDatiExtra = [aiDatiExtra];

  const confermatiExtra = extraUrl
    .map((url, i) => ({
      platform: extraPlatform[i] || 'altro',
      label: ETICHETTE_PIATTAFORMA[extraPlatform[i]] || 'Altro',
      url: (url || '').trim(),
      meno6mesi: extraMeno6mesi[i] === 'si',
      frequenzaFascia: parseFascia(extraFreq[i]),
      likeFascia: parseFascia(extraLike[i]),
      followerFascia: parseFascia(extraFollower[i]),
      datiAI: parseDatiAI(aiDatiExtra[i]),
    }))
    .filter((c) => c.url);

  const urlViste = new Set((sessione.socialConfermati || []).map((c) => c.url));
  const nuovi = [];
  for (const c of [...youtubeConfermato, ...confermatiExtra]) {
    if (urlViste.has(c.url)) continue;
    urlViste.add(c.url);
    nuovi.push(c);
  }

  sessione.socialConfermati = [...(sessione.socialConfermati || []), ...nuovi];
  sessione.socialAnalisi = null;
  sessione.socialValutazione = null;

  res.redirect(`/social/${sessione.id}/analisi`);
});

app.post('/social/:id/ai-aiuto', async (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.status(404).json({ ok: false });

  if (!consentito(req.ip)) {
    return res.status(429).json({ ok: false, error: 'Troppe richieste, riprova tra un minuto' });
  }

  let canali = (req.body && req.body.canali) || [];
  if (!Array.isArray(canali)) canali = [];

  const risultati = await Promise.all(
    canali.map(async (c) => {
      const riconosciuta = riconosciPiattaforma(c.url, c.platform);
      if (!riconosciuta.platform) {
        return { url: c.url, ok: false, code: 'PLATFORM_UNKNOWN', supportLevel: 'C' };
      }
      const esito = await eseguiFetch(riconosciuta.platform, riconosciuta.handle);
      if (!esito.ok) {
        return { url: c.url, platform: riconosciuta.platform, ok: false, code: esito.code, message: esito.message, supportLevel: 'C' };
      }
      return { url: c.url, platform: riconosciuta.platform, ok: true, supportLevel: 'A', metrics: esito.metrics };
    })
  );

  res.json({ ok: true, risultati });
});

app.post('/social/:id/ai-estrai', async (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.status(404).json({ ok: false });
  if (!consentito(req.ip)) return res.status(429).json({ ok: false, error: 'Troppe richieste, riprova tra un minuto' });
  if (!providerDisponibile()) {
    return res.status(501).json({ ok: false, error: 'Servizio di estrazione AI non configurato lato server' });
  }

  const { platform, testo, immagineBase64 } = req.body || {};
  try {
    const estratto = await estraiDati({ platform, testo, immagineBase64 });
    const posts = (estratto.post || []).map((p) => ({ timestamp: p.dataApprox, likes: p.like, comments: p.commenti }));
    const metrics = computeMetrics({ followers: estratto.followers, posts, historyTruncated: false });

    if (estratto.dataAperturaVisibile) {
      metrics.dataApertura = estratto.dataAperturaVisibile;
      metrics.aperturaStimata = false;
    }

    res.json({ ok: true, metrics, estratto });
  } catch (e) {
    const status = e.code === 'EMPTY_INPUT' ? 422 : e.code === 'AI_NOT_CONFIGURED' ? 501 : 502;
    res.status(status).json({ ok: false, error: e.message || 'Estrazione non riuscita' });
  }
});

// Passaggio 8 — analisi finale combinata (canali social + YouTube + GBP).
app.get('/social/:id/analisi', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.socialConfermati) return res.redirect(`/social/${sessione.id}`);

  if (!sessione.socialConfermati.length) {
    return res.render('social-analisi', { sessione, canali: [], gbp: sessione.gbp });
  }

  if (!sessione.socialAnalisi) {
    return res.render('attesa', {
      titolo: 'Analisi canali social',
      step: 8,
      sessione,
      messaggi: ['Verifica dei canali social...', 'Lettura dei profili pubblici...', 'Quasi pronto...'],
      pollUrl: `/social/${sessione.id}/esegui`,
      redirectUrl: `/social/${sessione.id}/analisi`,
    });
  }

  res.render('social-analisi', { sessione, canali: sessione.socialAnalisi, valutazione: sessione.socialValutazione, gbp: sessione.gbp });
});

app.get('/social/:id/esegui', async (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.status(404).json({ ok: false });

  if (!sessione.socialAnalisi && sessione.socialConfermati && sessione.socialConfermati.length) {
    sessione.socialAnalisi = await analizzaCanali(sessione.socialConfermati);

    if (providerDisponibile()) {
      try {
        sessione.socialValutazione = await valutaPresenza(sessione.socialAnalisi, sessione.settore);
      } catch (e) {
        console.error('Valutazione AI non riuscita:', e.message);
        sessione.socialValutazione = null;
      }
    }
  }

  res.json({ ok: true });
});

app.post('/api/social/fetch', async (req, res) => {
  if (!consentito(req.ip)) return res.status(429).json({ error: 'Troppe richieste, riprova tra un minuto' });

  const { handle, url, platform } = req.body || {};
  const input = url || handle;
  if (!input) return res.status(422).json({ error: 'Indirizzo o handle mancante' });

  const riconosciuta = riconosciPiattaforma(input, platform);
  if (!riconosciuta.platform) {
    return res.status(422).json({ error: 'Piattaforma non riconosciuta: indicala esplicitamente', ambiguo: true });
  }

  const esito = await eseguiFetch(riconosciuta.platform, riconosciuta.handle);
  if (!esito.ok) {
    const status = esito.code === 'RATE_LIMIT' ? 429 : esito.code === 'NOT_SUPPORTED' ? 501 : 422;
    return res
      .status(status)
      .json({ error: esito.message || 'Impossibile leggere il profilo automaticamente', code: esito.code, supportLevel: esito.supportLevel });
  }

  res.json({ platform: riconosciuta.platform, supportLevel: 'A', metrics: esito.metrics });
});

app.post('/api/social/extract', async (req, res) => {
  if (!consentito(req.ip)) return res.status(429).json({ error: 'Troppe richieste, riprova tra un minuto' });
  if (!providerDisponibile()) {
    return res.status(501).json({ error: 'Servizio di estrazione AI non configurato lato server' });
  }

  const { platform, testo, immagineBase64 } = req.body || {};
  try {
    const dati = await estraiDati({ platform, testo, immagineBase64 });
    res.json({ platform: platform || null, estratto: dati });
  } catch (e) {
    const status = e.code === 'EMPTY_INPUT' ? 422 : e.code === 'AI_NOT_CONFIGURED' ? 501 : 502;
    res.status(status).json({ error: e.message || 'Estrazione non riuscita' });
  }
});

app.post('/api/social/assess', async (req, res) => {
  if (!providerDisponibile()) {
    return res.status(501).json({ error: 'Servizio di valutazione AI non configurato lato server' });
  }
  const { canali, settore } = req.body || {};
  if (!Array.isArray(canali) || !canali.length) {
    return res.status(422).json({ error: 'Nessuna metrica confermata da valutare' });
  }
  try {
    const valutazione = await valutaPresenza(canali, settore);
    res.json(valutazione);
  } catch (e) {
    res.status(502).json({ error: e.message || 'Valutazione non riuscita' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Autoanalisi scuole in ascolto su http://localhost:${PORT}`);
  });
}

module.exports = app;
