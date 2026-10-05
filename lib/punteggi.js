// Punteggio interno dell'autoanalisi (richiesta di Andrea, 2026-10-05).
// Ogni analisi già fatta dal wizard viene trasformata in un voto 0-100 per indicatore; gli indicatori sono
// raggruppati in 3 blocchi (SEO tecnica, SEO contenuti, Comunicazione). I voti NON vengono mostrati: servono al
// giudizio sull'efficacia della comunicazione rispetto agli obiettivi dichiarati dal dirigente.
// Funzioni pure: leggono la sessione, non fanno rete e non la modificano.

const BLOCCHI = ['tecnica', 'contenuti', 'comunicazione'];
const ETICHETTE_BLOCCHI = { tecnica: 'SEO tecnica', contenuti: 'SEO contenuti', comunicazione: 'Comunicazione' };

// Pesi dei blocchi per obiettivo scelto (decisi da Andrea, 2026-10-05). Somma 100 per riga.
const PESI_OBIETTIVO = {
  iscrizioni: { tecnica: 25, contenuti: 45, comunicazione: 30 },
  numeri: { tecnica: 25, contenuti: 30, comunicazione: 45 },
  reputazione: { tecnica: 20, contenuti: 30, comunicazione: 50 },
};
// Se il dirigente non sceglie nessun obiettivo predefinito (nessuno, o solo obiettivi liberi): ipotesi da confermare.
const PESI_BASE = { tecnica: 25, contenuti: 40, comunicazione: 35 };

// Fasce comuni a blocchi e giudizio complessivo.
const SOGLIA_ALTA = 70;
const SOGLIA_MEDIA = 40;

const arrotonda = (n) => Math.round(n);
const fascia = (voto) => (voto == null ? null : voto >= SOGLIA_ALTA ? 'alta' : voto >= SOGLIA_MEDIA ? 'media' : 'bassa');
const media = (nums) => {
  const v = nums.filter((n) => typeof n === 'number' && !isNaN(n));
  return v.length ? v.reduce((s, n) => s + n, 0) / v.length : null;
};

// Livelli a tre valori usati dall'app (Insufficiente/Sufficiente/Buono) -> 0/50/100.
const LIVELLO_3 = { Insufficiente: 0, Sufficiente: 50, Buono: 100 };

function ind(key, label, voto, peso) {
  return { key, label, voto: voto == null ? null : arrotonda(voto), peso };
}

// Voto del blocco: media pesata degli indicatori disponibili (voto non nullo); null se non ce n'è nessuno.
function votoBlocco(indicatori) {
  const disponibili = indicatori.filter((i) => i.voto != null);
  if (!disponibili.length) return null;
  const pesoTot = disponibili.reduce((s, i) => s + i.peso, 0);
  return arrotonda(disponibili.reduce((s, i) => s + i.voto * i.peso, 0) / pesoTot);
}

function bloccoTecnica(sessione) {
  const audit = sessione.audit;
  const voto = audit && typeof audit.score === 'number' ? audit.score : null;
  return [ind('audit_tecnico', 'Audit tecnico del sito', voto, 100)];
}

// Quota di competenze dichiarate ritrovate nel sito (passaggio 4): vocabolario via temiTrovati, testo libero via liberiTrovati.
function votoCompetenzeSulSito(sessione) {
  const dichiarate = sessione.dichiarati || [];
  if (!dichiarate.length || !sessione.temi) return null;
  const trovate = new Set(((sessione.temi.estrazione && sessione.temi.estrazione.temiTrovati) || []).map((t) => t.key));
  const liberi = sessione.temi.liberiTrovati || {};
  const esiti = dichiarate.map((t) => (t.key ? trovate.has(t.key) : !!liberi[t.label]));
  return (esiti.filter(Boolean).length / esiti.length) * 100;
}

// Posizione migliore su Google per ogni competenza (passaggio 5): 1-3 = 100, 4-7 = 70, 8-10 = 50, assente = 0.
function votoPosizionamento(sessione) {
  const risultati = sessione.posizionamento;
  if (!Array.isArray(risultati) || !risultati.length) return null;
  const voti = risultati
    .filter((r) => r.disponibile)
    .map((r) => {
      if (!r.migliore) return 0;
      const p = r.migliore.posizione;
      return p <= 3 ? 100 : p <= 7 ? 70 : 50;
    });
  return media(voti);
}

function bloccoContenuti(sessione) {
  const ae = sessione.attivitaEditoriale;
  const stato = ae && ae.contenuti && ae.contenuti.stato;
  const votoStato = { attivo: 100, rallentato: 50, fermo: 15, assente: 0 }[stato];
  const haBlog = !!(ae && ae.sezioneTrovata);
  const competenze = sessione.confermati || [];
  return [
    ind('competenze_sito', 'Competenze dichiarate ritrovate nel sito', votoCompetenzeSulSito(sessione), 25),
    ind('posizionamento', 'Posizionamento su Google', votoPosizionamento(sessione), 30),
    ind('blog_stato', 'Attività del blog', votoStato == null ? null : votoStato, 20),
    ind('blog_frequenza', 'Frequenza di pubblicazione', haBlog && ae.frequenza ? { ottimo: 100, sufficiente: 60, insufficiente: 0 }[ae.frequenza.livello] : null, 10),
    ind('blog_ottimizzazione', 'Ottimizzazione degli articoli', haBlog && ae.ottimizzazione ? { buona: 100, parziale: 50, scarsa: 0 }[ae.ottimizzazione.livello] : null, 10),
    ind(
      'blog_competenze',
      'Competenze trattate nel blog',
      haBlog && competenze.length && ae.relazioneCompetenze ? (ae.relazioneCompetenze.presente ? 100 : 0) : null,
      5
    ),
  ];
}

// Social: media dei livelli disponibili di ogni canale, poi media dei canali. Passaggio saltato = non valutato;
// analisi fatta senza alcun canale = nessuna presenza social = 0.
function votoSocial(sessione) {
  if (sessione.analisiSocialSaltata || !Array.isArray(sessione.socialAnalisi)) return null;
  if (!sessione.socialAnalisi.length) return 0;
  const voti = sessione.socialAnalisi.map((c) =>
    media([c.livelloFrequenza, c.livelloInterazioni, c.livelloFollower].map((l) => (l in LIVELLO_3 ? LIVELLO_3[l] : null)))
  );
  return media(voti);
}

// Scheda Google Business Profile: assente = 0; trovata = livello complessivo; errore/non disponibile = non valutata.
function votoGBP(sessione) {
  const g = sessione.gbp;
  if (!g) return null;
  if (g.stato === 'assente') return 0;
  if (g.stato === 'errore' || g.stato === 'non_disponibile') return null;
  return g.punteggio in LIVELLO_3 ? LIVELLO_3[g.punteggio] : null;
}

function votoNewsletter(sessione) {
  const n = sessione.audit && sessione.audit.newsletter;
  if (!n) return null;
  if (n.stato === 'presente') return 100;
  return n.sottocaso === 'meccanismo_senza_esp' ? 25 : 0;
}

function bloccoComunicazione(sessione) {
  return [
    ind('social', 'Canali social', votoSocial(sessione), 40),
    ind('gbp', 'Scheda Google Business Profile', votoGBP(sessione), 30),
    ind('newsletter', 'Newsletter', votoNewsletter(sessione), 30),
  ];
}

// Pesi dei blocchi: media dei pesi degli obiettivi predefiniti scelti; altrimenti pesi di base.
function pesiPerObiettivi(obiettivi) {
  const scelti = ((obiettivi && obiettivi.scelti) || []).filter((k) => PESI_OBIETTIVO[k]);
  if (!scelti.length) return { ...PESI_BASE };
  const pesi = {};
  BLOCCHI.forEach((b) => {
    pesi[b] = scelti.reduce((s, k) => s + PESI_OBIETTIVO[k][b], 0) / scelti.length;
  });
  return pesi;
}

// Importanza dei blocchi per l'obiettivo: il più pesante è Fondamentale, il secondo Importante, il terzo Accessorio.
// A pari peso vale l'ordine tecnica < contenuti < comunicazione (il blocco più a monte va prima).
function importanzaBlocchi(pesi) {
  const ordinati = BLOCCHI.slice().sort((a, b) => pesi[b] - pesi[a] || BLOCCHI.indexOf(a) - BLOCCHI.indexOf(b));
  const nomi = ['fondamentale', 'importante', 'accessorio'];
  const out = {};
  ordinati.forEach((b, i) => (out[b] = nomi[i]));
  return out;
}

function calcolaPunteggi(sessione) {
  const indicatori = {
    tecnica: bloccoTecnica(sessione),
    contenuti: bloccoContenuti(sessione),
    comunicazione: bloccoComunicazione(sessione),
  };
  const pesi = pesiPerObiettivi(sessione.obiettivi);

  const blocchi = {};
  BLOCCHI.forEach((b) => {
    const voto = votoBlocco(indicatori[b]);
    blocchi[b] = { etichetta: ETICHETTE_BLOCCHI[b], voto, fascia: fascia(voto), peso: pesi[b], indicatori: indicatori[b] };
  });

  // Voto finale: media pesata dei soli blocchi valutabili (i pesi si ridistribuiscono sugli altri).
  const valutabili = BLOCCHI.filter((b) => blocchi[b].voto != null);
  const pesoTot = valutabili.reduce((s, b) => s + pesi[b], 0);
  const votoFinale = valutabili.length ? arrotonda(valutabili.reduce((s, b) => s + blocchi[b].voto * pesi[b], 0) / pesoTot) : null;

  return {
    blocchi,
    pesi,
    importanza: importanzaBlocchi(pesi),
    finale: { voto: votoFinale, fascia: fascia(votoFinale) },
  };
}

module.exports = {
  calcolaPunteggi,
  pesiPerObiettivi,
  importanzaBlocchi,
  PESI_OBIETTIVO,
  PESI_BASE,
  SOGLIA_ALTA,
  SOGLIA_MEDIA,
};
