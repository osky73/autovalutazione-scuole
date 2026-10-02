// Modulo per il criterio di autovalutazione "Newsletter" (blocco Nurturing, TASKS.md punto 2).
//
// La spec del cliente chiede che la scansione giri in background durante l'audit tecnico iniziale,
// indipendentemente dalla risposta dichiarata dall'utente al questionario ("Considerate la
// newsletter uno strumento importante?") — così i dati sono pronti sia in caso di risposta sì che
// no, e si possono segnalare eventuali discrepanze tra dichiarato e verificato.
//
// Analizza le pagine principali già raccolte dall'audit tecnico (home, contatti, iscrizioni - vedi
// lib/pages.js), non scarica pagine aggiuntive.

const cheerio = require('cheerio');

// STEP 3 (Verifica C) — domini di ESP (Email Service Provider) noti. Lista volutamente estensibile:
// capiterà di incontrarne altri (anche locali/italiani) usati dalle scuole, da aggiungere qui man
// mano, sul modello di PIATTAFORME in lib/social.js.
const ESP_NOTI = [
  { chiave: 'mailchimp', etichetta: 'Mailchimp', pattern: /list-manage\.com|mailchimp\.com/i },
  { chiave: 'brevo', etichetta: 'Brevo (ex Sendinblue)', pattern: /sibforms\.com|brevo\.com|sendinblue\.com/i },
  { chiave: 'activecampaign', etichetta: 'ActiveCampaign', pattern: /activehosted\.com/i },
  { chiave: 'getresponse', etichetta: 'GetResponse', pattern: /getresponse\.com/i },
  { chiave: 'mailerlite', etichetta: 'MailerLite', pattern: /mailerlite\.com/i },
  { chiave: 'hubspot', etichetta: 'HubSpot', pattern: /hsforms\.com|hs-forms\.com/i },
  { chiave: 'convertkit', etichetta: 'ConvertKit', pattern: /convertkit\.com/i },
  { chiave: 'klaviyo', etichetta: 'Klaviyo', pattern: /klaviyo\.com/i },
];

const PATTERN_TESTO_NEWSLETTER = /newsletter|aggiornament[oi]\s+via\s*e?-?mail|resta\s+informat[oa]|iscriviti\s+alla\s+newsletter/i;

// STEP 3 (Verifica C) — cerca domini di ESP noti nel sorgente: src di script esterni, attributo
// action di un form, src di un iframe, o variabili/riferimenti in script inline.
function rilevaESP(html) {
  const $ = cheerio.load(html);
  const candidati = [];

  $('script[src]').each((_, el) => candidati.push($(el).attr('src')));
  $('form[action]').each((_, el) => candidati.push($(el).attr('action')));
  $('iframe[src]').each((_, el) => candidati.push($(el).attr('src')));

  for (const url of candidati) {
    if (!url) continue;
    for (const esp of ESP_NOTI) {
      if (esp.pattern.test(url)) return { chiave: esp.chiave, etichetta: esp.etichetta };
    }
  }

  // alcuni ESP vengono integrati solo via script inline (popup/embed) che referenziano comunque
  // il proprio dominio (es. endpoint fetch/ajax) senza comparire come src di uno script esterno.
  const scriptInline = $('script:not([src])')
    .map((_, el) => $(el).html())
    .get()
    .join('\n');
  for (const esp of ESP_NOTI) {
    if (esp.pattern.test(scriptInline)) return { chiave: esp.chiave, etichetta: esp.etichetta };
  }

  return null;
}

// Raccoglie il testo "vicino" a un elemento: label collegata (via for=, o wrapping), placeholder,
// aria-label, name/id, e il testo dell'intero contenitore (euristica semplice, come in lib/contenuti.js).
function testoVicino($, el) {
  const parti = [];
  const id = $(el).attr('id');
  if (id) parti.push($(`label[for="${id}"]`).text());
  parti.push($(el).closest('label').text());
  parti.push($(el).attr('placeholder') || '');
  parti.push($(el).attr('aria-label') || '');
  parti.push($(el).attr('name') || '');
  const contenitore = $(el).closest('form, div, li, p, section');
  if (contenitore.length) parti.push(contenitore.text());
  return parti.join(' ');
}

// STEP 1 (Verifica A) — checkbox o campo vicino a un testo tipo "newsletter", "aggiornamenti via
// email", "resta informato".
function rilevaCampoDichiarato(html) {
  const $ = cheerio.load(html);
  let trovato = false;

  $('input[type="checkbox"], input[type="email"], input[type="text"]').each((_, el) => {
    if (trovato) return;
    if (PATTERN_TESTO_NEWSLETTER.test(testoVicino($, el))) trovato = true;
  });

  return trovato;
}

// STEP 0 (richiesto da Andrea il 2026-10-01, falso negativo su lazolla.it/contattaci) — più
// permissiva delle verifiche A/B sopra: non assume una pagina dedicata (B) né si ferma al solo
// "testo vicino al singolo campo" (A, che con closest('form, div, li, p, section') su un input
// trova quasi sempre il <form> come ancestor più vicino, perdendo un titolo tipo "Iscriviti alla
// newsletter" messo FUORI dal form). Cerca invece un form con un campo email + pulsante di invio,
// qualunque sia il numero di altri campi (una newsletter vera può avere nome, preferenze tematiche,
// consenso privacy, come nel caso segnalato: form con nome, cognome, email, un menu "Chi sei?",
// checkbox sui temi e consenso privacy), e verifica che la parola "newsletter" (o sinonimi) compaia
// nel form stesso o in un paio di contenitori che lo racchiudono (non nell'intera pagina, per non
// confondere un form di contatto generico con una newsletter solo perché la parola compare altrove,
// es. nel menu).
function rilevaDinamicaFormNewsletter(html) {
  const $ = cheerio.load(html);
  let trovato = false;

  $('form').each((_, el) => {
    if (trovato) return;
    const $form = $(el);

    const campoEmail = $form.find('input').filter((_, i) => {
      const tipo = ($(i).attr('type') || '').toLowerCase();
      const name = ($(i).attr('name') || '').toLowerCase();
      const id = ($(i).attr('id') || '').toLowerCase();
      return tipo === 'email' || /email|mail/.test(name) || /email|mail/.test(id);
    });
    const haBottoneInvio = $form.find('button, input[type="submit"]').length > 0;
    if (!campoEmail.length || !haBottoneInvio) return;

    let contesto = $form.text();
    let corrente = $form;
    for (let livello = 0; livello < 3; livello++) {
      const genitore = corrente.parent();
      if (!genitore.length || genitore.is('body')) break;
      contesto += ' ' + genitore.text();
      corrente = genitore;
    }

    if (PATTERN_TESTO_NEWSLETTER.test(contesto)) trovato = true;
  });

  return trovato;
}

// STEP 2 (Verifica B) — pagina o sezione dedicata, riconoscibile come un singolo campo email +
// pulsante di invio (tollerato un secondo campo, es. nome, per non essere troppo rigidi).
function rilevaFormStandalone(html) {
  const $ = cheerio.load(html);
  let trovato = false;

  $('form').each((_, el) => {
    if (trovato) return;
    const $form = $(el);

    const campiVisibili = $form.find('input').filter((_, i) => {
      const tipo = ($(i).attr('type') || 'text').toLowerCase();
      return !['hidden', 'submit', 'button'].includes(tipo);
    });

    const campoEmail = campiVisibili.filter((_, i) => {
      const tipo = ($(i).attr('type') || '').toLowerCase();
      const name = ($(i).attr('name') || '').toLowerCase();
      const id = ($(i).attr('id') || '').toLowerCase();
      return tipo === 'email' || /email|mail/.test(name) || /email|mail/.test(id);
    });

    const haBottoneInvio = $form.find('button, input[type="submit"]').length > 0;

    if (campiVisibili.length >= 1 && campiVisibili.length <= 2 && campoEmail.length >= 1 && haBottoneInvio) {
      trovato = true;
    }
  });

  return trovato;
}

function costruisciMessaggio(stato, sottocaso, verificaDeterminante, esp) {
  if (stato === 'presente') {
    const fonte =
      verificaDeterminante === 'A' ? 'un campo/checkbox dedicato' : verificaDeterminante === 'B' ? 'un form standalone' : 'un campo dedicato e un form standalone';
    return `Raccolta email per newsletter trovata (${fonte}), integrata con ${esp.etichetta}.`;
  }
  if (sottocaso === 'meccanismo_senza_esp') {
    return 'Raccolta email per newsletter trovata, ma senza integrazione con un Email Service Provider riconosciuto: le email vengono raccolte ma probabilmente non utilizzate con uno strumento vero.';
  }
  return 'Nessun meccanismo di raccolta email per newsletter individuato sul sito.';
}

// STEP 1-5 — funzione principale: analizza le pagine già raccolte e produce il verdetto.
// pagineHtml: le pagine principali già scaricate dall'audit tecnico (home + pagine interne
// individuate, tipicamente chi-siamo/iscrizioni/contatti/notizie — vedi lib/pages.js).
function analizzaNewsletter(pagineHtml) {
  let verificaA = false;
  let verificaB = false;
  let esp = null;

  for (const html of pagineHtml || []) {
    if (!html) continue;
    // STEP 0 confluisce in verificaA: stesso significato ("campo/checkbox vicino a un testo
    // pertinente"), solo più permissivo su dove si trova il testo e su quanti altri campi ha il form.
    if (!verificaA && rilevaCampoDichiarato(html)) verificaA = true;
    if (!verificaA && rilevaDinamicaFormNewsletter(html)) verificaA = true;
    if (!verificaB && rilevaFormStandalone(html)) verificaB = true;
    if (!esp) esp = rilevaESP(html);
  }

  const raccoltaEmail = verificaA || verificaB;
  const presente = raccoltaEmail && !!esp;

  const stato = presente ? 'presente' : 'assente';
  // STEP 4: quando "assente", distingue (a) nessun meccanismo di raccolta trovato per niente da
  // (b) meccanismo trovato ma senza integrazione ESP ("quick win" commercialmente più interessante).
  const sottocaso = presente ? null : raccoltaEmail ? 'meccanismo_senza_esp' : 'nessun_meccanismo';

  const verificaDeterminante = presente ? (verificaA && verificaB ? 'A+B' : verificaA ? 'A' : 'B') : null;

  return {
    stato,
    sottocaso,
    verificaA,
    verificaB,
    verificaDeterminante,
    piattaforma: esp ? esp.etichetta : null,
    piattaformaChiave: esp ? esp.chiave : null,
    messaggio: costruisciMessaggio(stato, sottocaso, verificaDeterminante, esp),
  };
}

module.exports = {
  analizzaNewsletter,
  rilevaESP,
  rilevaCampoDichiarato,
  rilevaFormStandalone,
  rilevaDinamicaFormNewsletter,
  ESP_NOTI,
};
