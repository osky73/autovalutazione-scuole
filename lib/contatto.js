// Passaggio 13 (ultimo, richiesta di Andrea, 2026-10-05) — "Punti deboli e contatto": lista dei punti deboli per
// blocco, da mostrare sopra il modulo di contatto verso Andrea. Nessun criterio nuovo: riusa esattamente gli
// stessi voti interni di lib/punteggi.js (calcolaPunteggi, mai mostrati) e le stesse frasi concrete di
// dettaglioIndicatore (lib/giudizio.js), nello stesso ordine di importanza già usato dal giudizio (passaggio 12).
const { calcolaPunteggi } = require('./punteggi');
const { dettaglioIndicatore, blocchiOrdinati } = require('./giudizio');

// Un indicatore è un "punto debole" se il suo voto interno è sotto questa soglia. Non è la stessa soglia delle
// fasce alta/media/bassa dei blocchi (SOGLIA_MEDIA = 40 in lib/punteggi.js): qui si vuole un elenco più ampio,
// come richiesto da Andrea ("voto basso < 50").
const SOGLIA_PUNTO_DEBOLE = 50;

// Per ogni blocco (nell'ordine di importanza del giudizio): elenco di frasi sui punti deboli (indicatori con
// voto < 50, usando le stesse frasi concrete del giudizio), se il blocco è stato valutato, e se non ha punti
// deboli. I voti numerici non vengono mai esposti in questo output.
function puntiDeboliPerBlocco(sessione) {
  const p = calcolaPunteggi(sessione);
  return blocchiOrdinati(p).map((b) => {
    const indicatori = p.blocchi[b.key].indicatori;
    const punti = indicatori
      .filter((i) => i.voto != null && i.voto < SOGLIA_PUNTO_DEBOLE)
      .map((i) => dettaglioIndicatore(i.key, i.voto, sessione))
      .filter(Boolean);
    return {
      key: b.key,
      etichetta: b.etichetta,
      importanza: b.importanza,
      importanzaEtichetta: b.importanzaEtichetta,
      valutato: b.fascia != null,
      punti,
    };
  });
}

// Nessun punto debole in nessun blocco: la schermata resta utile solo per il contatto (richiesta di Andrea).
function nessunPuntoDebole(blocchi) {
  return blocchi.every((b) => !b.punti.length);
}

module.exports = { puntiDeboliPerBlocco, nessunPuntoDebole, SOGLIA_PUNTO_DEBOLE };
