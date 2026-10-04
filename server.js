const express = require('express');
const { creaSessione, getSessione } = require('./lib/store');
const { runAudit } = require('./lib/runAudit');
const { estraiTemi, elencoTemi, queryPerTema, VOCABOLARIO } = require('./lib/temi');
const { estraiLocalita, estraiDatiOrganizzazione } = require('./lib/localita');
const {
  calcolaFrequenzaEditoriale,
  trovaUrlUltimiArticoli,
  analizzaOttimizzazioneArticolo,
  aggregaOttimizzazione,
  relazioneCompetenze,
  giudicaContenuti,
} = require('./lib/contenuti');
const { fetchPage } = require('./lib/http');
const { verificaPosizionamentoCluster } = require('./lib/serp');
const { discoverSocialLinks, analizzaCanali } = require('./lib/social');
const { valutaPresenza } = require('./lib/social/assess');
const { providerDisponibile } = require('./lib/social/ai');
const { consentito } = require('./lib/social/rateLimit');
const { analizzaGBP } = require('./lib/social/gbp');

const app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '8mb' }));

// Express 5 (a differenza della 4) lascia `req.body` a `undefined`, anziché `{}`, quando il
// corpo della richiesta è vuoto (es. un form POST senza alcun campo, come succede nel passaggio
// "Canali social" quando sul sito non viene trovato nessun canale: il form viene inviato comunque
// per proseguire, ma senza input). Tutte le route leggono `req.body.campo` assumendo che l'oggetto
// esista sempre: senza questa rete di sicurezza quella lettura lancia un TypeError e la richiesta
// fallisce con 500 (bug segnalato da Andrea: "dopo il passaggio 6 dà errore").
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

// SITO BLOCCATO AI MOTORI DI RICERCA (richiesta di Andrea, 2026-10-04): intestazione noindex su ogni risposta,
// meta robots nelle pagine (views/partials/layout-top.ejs) e robots.txt che vieta la scansione.
// Per riaprire il sito ai motori di ricerca: togliere questo blocco, il meta e rimettere robots.txt permissivo.
app.use((req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  next();
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /\n');
});

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

// Confronto tra competenze dichiarate e contenuto del sito (passaggio 4): calcolo sincrono, nessuna richiesta
// di rete. Separato dalla rotta perché serve anche quando il passaggio 4 viene saltato.
function preparaTemi(sessione) {
  const estrazione = estraiTemi(sessione.pagineHtml || [], sessione.pagineUrl || []);
  const chiaviDichiarate = new Set(sessione.dichiarati.map((t) => t.key));
  const temaPiuCitato = estrazione.temiTrovati[0] || null;

  let finding = null;
  if (temaPiuCitato && !sessione.dichiarati.length) {
    finding = `Il tema più citato nel sito è "${temaPiuCitato.label}".`;
  } else if (temaPiuCitato && !chiaviDichiarate.has(temaPiuCitato.key)) {
    const elenco = sessione.dichiarati.map((t) => t.label).join(', ');
    finding = `Il tema più citato nel sito è "${temaPiuCitato.label}", ma non è tra le competenze dichiarate dalla scuola (${elenco}).`;
  }

  sessione.temi = { estrazione, finding };
  sessione.confermati = calcolaConfermati(sessione);
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
      sessione.pagineUrl = risultato.pagineUrl;
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

// Blocco "Nurturing" (TASKS.md punti 1 e 2): due domande dichiarative, ciascuna spostata (richiesta
// di Andrea, 2026-10-02) in una schermata dedicata subito prima del passaggio che la confronta con
// il dato verificato — la cadenza editoriale prima del passaggio 9 ("Attività editoriale"), la
// domanda sulla newsletter prima del passaggio 10 ("Newsletter") — invece che tutte insieme nel
// passaggio 3 (dichiarazione competenze), dove erano scollegate dal contesto a cui si riferiscono.
// Chiavi valide per la cadenza editoriale, coerenti con CADENZA_ATTESA_GIORNI in lib/contenuti.js
// (STEP 5 del criterio blog).
const CADENZE_EDITORIALI_VALIDE = new Set(['settimanale', 'quindicinale', 'mensile', 'trimestrale']);

// Salta il passaggio 3 (nessuna competenza indicata): si prosegue al passaggio 4.
app.get('/dichiarazione/:id/salta', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.audit) return res.redirect(`/audit/${sessione.id}`);

  sessione.dichiarati = [];
  sessione.temi = null;
  sessione.confermati = null;
  sessione.posizionamento = null;
  sessione.posizionamentoSaltato = false;
  res.redirect(`/verifica/${sessione.id}`);
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

  // Nessuna competenza indicata: si può comunque proseguire (richiesta di Andrea, 2026-10-03). Nel
  // passaggio 4 si vedranno solo le competenze individuate nel sito.
  sessione.dichiarati = dichiarati;
  sessione.temi = null;
  sessione.confermati = null;
  sessione.posizionamento = null;
  sessione.posizionamentoSaltato = false;

  // "Salta il passaggio successivo": il confronto del passaggio 4 viene calcolato senza mostrarlo.
  if (req.body.salta) {
    preparaTemi(sessione);
    return res.redirect(`/posizionamento/${sessione.id}`);
  }

  res.redirect(`/verifica/${sessione.id}`);
});

app.get('/verifica/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.audit) return res.redirect(`/audit/${sessione.id}`);
  if (!sessione.dichiarati) return res.redirect(`/dichiarazione/${sessione.id}`);

  if (!sessione.temi) {
    preparaTemi(sessione);

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
    // Nessuna competenza dichiarata e nessuna individuata nel sito: non c'è nulla da cercare su Google,
    // il passaggio viene saltato.
    sessione.posizionamentoSaltato = true;
    return res.redirect(`/social/${sessione.id}`);
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

// Salta il passaggio 5 (nessuna ricerca su Google, nessun credito consumato).
app.get('/posizionamento/:id/salta', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.temi) return res.redirect(`/verifica/${sessione.id}`);

  sessione.posizionamentoSaltato = true;
  res.redirect(`/social/${sessione.id}`);
});

app.get('/posizionamento/:id/esegui', async (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.status(404).json({ ok: false });

  if (sessione.localita && !sessione.posizionamento && sessione.confermati) {
    const valoriConQuery = sessione.confermati.map((t) => ({
      label: t.label,
      queries: queryPerTema(t, sessione.localita),
    }));

    sessione.posizionamento = await verificaPosizionamentoCluster(valoriConQuery, sessione.audit.homeUrl);
    sessione.posizionamentoSaltato = false;
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

app.get('/social/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.posizionamento && !sessione.posizionamentoSaltato) return res.redirect(`/posizionamento/${sessione.id}`);

  if (sessione.socialTrovati === undefined) {
    sessione.socialTrovati = discoverSocialLinks(sessione.pagineHtml || []);
  }

  const trovatiSenzaYoutube = (sessione.socialTrovati || []).filter((c) => c.platform !== 'youtube');
  res.render('social-conferma', { sessione, trovati: trovatiSenzaYoutube });
});

// Salta il passaggio 6 (conferma dei canali social trovati sul sito): nessun canale confermato, si va al 7.
app.get('/social/:id/salta', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.posizionamento && !sessione.posizionamentoSaltato) return res.redirect(`/posizionamento/${sessione.id}`);

  if (sessione.socialTrovati === undefined) {
    sessione.socialTrovati = discoverSocialLinks(sessione.pagineHtml || []);
  }
  sessione.socialConfermati = [];
  sessione.gbp = null;
  sessione.socialAnalisi = null;
  sessione.socialValutazione = null;
  sessione.analisiSocialSaltata = false;
  res.redirect(`/social/${sessione.id}/altri`);
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
  sessione.analisiSocialSaltata = false;

  // "Salta il passaggio successivo": niente YouTube/GBP/altri canali, si va all'analisi (passaggio 8).
  if (req.body.salta) return res.redirect(`/social/${sessione.id}/analisi`);

  res.redirect(`/social/${sessione.id}/altri`);
});

app.get('/social/:id/altri', async (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.socialConfermati) return res.redirect(`/social/${sessione.id}`);

  const youtube = (sessione.socialTrovati || []).find((c) => c.platform === 'youtube') || null;

  if (sessione.organizzazioneSito === undefined) {
    sessione.organizzazioneSito = estraiDatiOrganizzazione(sessione.pagineHtml || []);
  }

  if (!sessione.gbp) {
    // Usiamo il nome e l'indirizzo dichiarati sul sito stesso (schema.org / <title>), quando
    // disponibili, invece del nome digitato liberamente dall'utente al passaggio 1: quel nome
    // può essere un'abbreviazione o un nome ambiguo e far trovare la scheda di un'attività
    // non correlata (es. "LZ" per "Istituto La Zolla" che matcha un'altra attività con "LZ" nel nome).
    const nomeScuola = (sessione.organizzazioneSito && sessione.organizzazioneSito.nome) || sessione.scuola;
    const indirizzo = sessione.organizzazioneSito && sessione.organizzazioneSito.indirizzo;
    sessione.gbp = await analizzaGBP({ nomeScuola, localita: sessione.localita, indirizzo });
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
  sessione.analisiSocialSaltata = false;

  // "Salta il passaggio successivo": l'analisi social (passaggio 8) non viene eseguita né mostrata.
  // socialAnalisi = [] la segna come "fatta" per i passaggi seguenti; se l'utente torna indietro
  // alla pagina di analisi, questa viene eseguita davvero (vedi GET /social/:id/analisi).
  if (req.body.salta) {
    sessione.socialAnalisi = [];
    sessione.analisiSocialSaltata = true;
    return res.redirect(`/contenuti/${sessione.id}/cadenza`);
  }

  res.redirect(`/social/${sessione.id}/analisi`);
});

app.get('/social/:id/analisi', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.socialConfermati) return res.redirect(`/social/${sessione.id}`);

  if (sessione.analisiSocialSaltata) {
    sessione.analisiSocialSaltata = false;
    sessione.socialAnalisi = null;
  }

  if (!sessione.socialConfermati.length) {
    // `valutazione` va sempre passata alla vista anche qui: social-analisi.ejs la referenzia con
    // `<% if (valutazione) { %>` e, a differenza di un confronto JS normale, EJS lancia un
    // ReferenceError ("valutazione is not defined") se la variabile non è tra i local del render,
    // anche solo per leggerla in un if — non basta che sia "falsy", deve essere DICHIARATA.
    // Bug reale riprodotto su suoremantellate.org (nessun canale social confermato): 500 subito
    // dopo il passaggio "Canali social", nella stessa area del bug segnalato da Andrea ("dopo il
    // passaggio 6 dà errore").
    //
    // sessione.socialAnalisi va impostato (array vuoto, non lasciato null/undefined): il passaggio
    // successivo GET /contenuti/:id controlla `if (!sessione.socialAnalisi) redirect(.../analisi)`
    // per sapere se questo step è già stato eseguito. Lasciandolo non impostato, una scuola senza
    // alcun canale social confermato rimbalzava all'infinito tra questa pagina e /contenuti/:id,
    // senza poter mai raggiungere il passaggio "Attività editoriale" (bug riprodotto nello stesso
    // test su suoremantellate.org).
    sessione.socialAnalisi = [];
    return res.render('social-analisi', { sessione, canali: [], valutazione: null, gbp: sessione.gbp });
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

// Step 9 — "Attività editoriale" (blog/news): passaggio dedicato, richiesto da Andrea il
// 2026-10-01 al posto della card dentro l'audit tecnico. Gira dopo l'analisi social (passaggio 8)
// così le competenze dichiarate/confermate (passaggi 3/4/5) sono già disponibili per il terzo
// criterio (relazione dei contenuti alle competenze). La raccolta di base (sezione trovata,
// articoli con data) resta calcolata in background durante l'audit tecnico (sessione.audit,
// per non riscansionare il sito); qui si aggiungono solo i tre nuovi criteri, che richiedono
// dati non ancora disponibili in quella fase (competenze) o un fetch aggiuntivo mirato
// (ottimizzazione dell'articolo più recente).
// Domanda "Avete un piano editoriale per il sito? Con quale cadenza pensate di pubblicare?" (STEP 5
// del criterio blog/contenuti): schermata dedicata subito prima del passaggio 9, così la cadenza
// dichiarata è raccolta nel punto del wizard a cui si riferisce davvero, invece che nel passaggio 3
// (dichiarazione competenze, scollegato dal contesto). `cadenzaRichiesta` distingue "non ancora
// chiesta" (redirect a questa schermata) da "chiesta ma risposta vuota/non riconosciuta"
// (cadenzaDichiarata resta null, il confronto allo step 9 semplicemente non viene mostrato).
// Salta il passaggio 9 (attività editoriale, domanda sulla cadenza compresa): si va alla domanda sulla newsletter.
app.get('/contenuti/:id/salta', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.socialAnalisi) return res.redirect(`/social/${sessione.id}/analisi`);

  sessione.contenutiSaltato = true;
  res.redirect(`/newsletter/${sessione.id}/importanza`);
});

app.get('/contenuti/:id/cadenza', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.socialAnalisi) return res.redirect(`/social/${sessione.id}/analisi`);

  res.render('contenuti-cadenza', { sessione });
});

app.post('/contenuti/:id/cadenza', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');

  const cadenzaEditoriale = (req.body.cadenzaEditoriale || '').trim().toLowerCase();
  sessione.cadenzaDichiarata = CADENZE_EDITORIALI_VALIDE.has(cadenzaEditoriale) ? cadenzaEditoriale : null;
  sessione.cadenzaRichiesta = true;

  res.redirect(`/contenuti/${sessione.id}`);
});

app.get('/contenuti/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.socialAnalisi) return res.redirect(`/social/${sessione.id}/analisi`);
  if (!sessione.cadenzaRichiesta) return res.redirect(`/contenuti/${sessione.id}/cadenza`);

  if (!sessione.attivitaEditoriale) {
    return res.render('attesa', {
      titolo: 'Attività editoriale',
      step: 9,
      sessione,
      messaggi: [
        'Analisi della sezione news/blog...',
        'Verifica dell\'ottimizzazione dell\'ultimo articolo...',
        'Confronto con le competenze dichiarate...',
        'Quasi pronto...',
      ],
      pollUrl: `/contenuti/${sessione.id}/esegui`,
      redirectUrl: `/contenuti/${sessione.id}`,
    });
  }

  res.render('contenuti', { sessione, dati: sessione.attivitaEditoriale });
});

app.get('/contenuti/:id/esegui', async (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.status(404).json({ ok: false });

  if (!sessione.attivitaEditoriale) {
    const raccolta = (sessione.audit && sessione.audit.raccoltaContenuti) || { sezioneTrovata: false, url: null, articoli: [] };
    // Il giudizio va RICALCOLATO qui (non riusato da sessione.audit.contenuti, calcolato durante
    // l'audit tecnico allo step 2) perché solo a questo punto del wizard, dopo la dichiarazione
    // (step 3), è disponibile sessione.cadenzaDichiarata — serve al confronto dello STEP 5 della
    // spec blog/contenuti (divergenzaCadenza). Operazione sincrona ed economica, nessun nuovo fetch.
    const contenuti = giudicaContenuti(raccolta, { cadenzaDichiarata: sessione.cadenzaDichiarata });
    const competenze = sessione.confermati || [];

    if (!raccolta.sezioneTrovata) {
      sessione.attivitaEditoriale = {
        sezioneTrovata: false,
        contenuti,
        frequenza: null,
        ottimizzazione: null,
        relazioneCompetenze: { presente: false, temiCorrelati: [] },
      };
    } else {
      const frequenza = calcolaFrequenzaEditoriale(raccolta.articoli);
      // Richiesta di Andrea (2026-10-03): l'ottimizzazione va verificata sugli ultimi 3 articoli,
      // non solo sull'ultimo pubblicato — un solo articolo non è rappresentativo.
      const urlUltimiArticoli = trovaUrlUltimiArticoli(raccolta.articoli, 3);

      const risultatiArticoli = [];
      const pagineBlogHtml = [];

      try {
        const resListing = await fetchPage(raccolta.url, { timeoutMs: 8000 });
        if (resListing.ok && resListing.html) pagineBlogHtml.push(resListing.html);
      } catch (e) {
        /* la pagina elenco non è indispensabile: la relazione competenze può basarsi anche solo sugli articoli */
      }

      for (const urlArticolo of urlUltimiArticoli) {
        try {
          const resArticolo = await fetchPage(urlArticolo, { timeoutMs: 8000 });
          if (resArticolo.ok && resArticolo.html) {
            pagineBlogHtml.push(resArticolo.html);
            risultatiArticoli.push({ url: urlArticolo, ...analizzaOttimizzazioneArticolo(resArticolo.html, urlArticolo) });
          }
        } catch (e) {
          /* articolo non raggiungibile: viene semplicemente escluso dall'aggregato */
        }
      }

      const ottimizzazione = aggregaOttimizzazione(risultatiArticoli);
      const relazione = relazioneCompetenze(pagineBlogHtml, competenze);

      sessione.attivitaEditoriale = {
        sezioneTrovata: true,
        contenuti,
        frequenza,
        ottimizzazione,
        relazioneCompetenze: relazione,
      };
    }
  }

  res.json({ ok: true });
});

// Step 10 — Newsletter: passaggio dedicato dopo l'attività editoriale (richiesta Andrea,
// 2026-10-01). Il dato è già calcolato in background durante l'audit tecnico (sincrono, nessun
// fetch aggiuntivo necessario), quindi qui si limita a mostrarlo senza passaggio di attesa.
// Domanda "Considerate la newsletter uno strumento importante?": schermata dedicata subito prima
// del passaggio 10, per lo stesso motivo della domanda sulla cadenza editoriale sopra —
// `newsletterRichiesta` distingue "non ancora chiesta" da "chiesta, nessuna risposta" (resta null,
// nessuna discrepanza mostrata). La scansione newsletter gira comunque sempre durante l'audit
// tecnico, indipendentemente da questa risposta (per spec).
app.get('/newsletter/:id/importanza', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.attivitaEditoriale && !sessione.contenutiSaltato) return res.redirect(`/contenuti/${sessione.id}`);

  res.render('newsletter-importanza', { sessione });
});

app.post('/newsletter/:id/importanza', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');

  const newsletterImportante = req.body.newsletterImportante;
  sessione.newsletterImportante = newsletterImportante === 'si' ? true : newsletterImportante === 'no' ? false : null;
  sessione.newsletterRichiesta = true;

  res.redirect(`/newsletter/${sessione.id}`);
});

app.get('/newsletter/:id', (req, res) => {
  const sessione = getSessione(req.params.id);
  if (!sessione) return res.redirect('/');
  if (!sessione.attivitaEditoriale && !sessione.contenutiSaltato) return res.redirect(`/contenuti/${sessione.id}`);
  if (!sessione.newsletterRichiesta) return res.redirect(`/newsletter/${sessione.id}/importanza`);

  const newsletter = (sessione.audit && sessione.audit.newsletter) || null;
  // Discrepanza dichiarato/verificato (menzionata dalla spec: "così i dati sono pronti... per
  // segnalare eventuali discrepanze tra quanto dichiarato e quanto verificato"): la scuola ha
  // dichiarato la newsletter importante (step 3) ma la scansione non trova alcuna integrazione ESP.
  const discrepanzaNewsletter = sessione.newsletterImportante === true && !!newsletter && newsletter.stato === 'assente';

  res.render('newsletter', { sessione, newsletter, newsletterImportante: sessione.newsletterImportante, discrepanzaNewsletter });
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
