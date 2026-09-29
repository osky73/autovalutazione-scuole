const GIORNI_STORICO_MINIMO = 90;

function aMs(data) {
  if (!data) return null;
  const t = new Date(data).getTime();
  return isNaN(t) ? null : t;
}

// computeMetrics({followers, posts, historyTruncated, aperturaReale}) -> metriche derivate
// da uno storico di post già raccolto (via AI o estrazione), mai stimate. `posts` è un
// array di { timestamp, likes, comments }. Oltre alle medie "solo like" (mediaLike, per
// compatibilità con i consumatori esistenti) calcola anche mediaInterazioni, che somma
// like + commenti per contenuto: è la metrica che il prodotto mostra come
// "Interazioni (media per contenuto)" per tutti i canali, YouTube incluso.
function computeMetrics({ followers = null, posts = [], historyTruncated = false, aperturaReale = null } = {}) {
  const avvisi = [];
  const postValidi = (posts || []).filter((p) => p && aMs(p.timestamp) != null);

  if (!posts || posts.length === 0) {
    avvisi.push('Nessun post disponibile: non è possibile calcolare le medie di pubblicazione.');
  }

  const timestamps = postValidi.map((p) => aMs(p.timestamp));
  const piuVecchio = timestamps.length ? Math.min(...timestamps) : null;
  const now = Date.now();

  const giorniStorico = piuVecchio != null ? Math.max(1, Math.round((now - piuVecchio) / 86400000)) : null;
  const storicoInsufficiente = giorniStorico != null && giorniStorico < GIORNI_STORICO_MINIMO;
  if (storicoInsufficiente) {
    avvisi.push(
      `Storico disponibile di soli ${giorniStorico} giorni (meno di ${GIORNI_STORICO_MINIMO}): le medie potrebbero non essere rappresentative.`
    );
  }
  if (historyTruncated) {
    avvisi.push('La piattaforma ha restituito solo gli ultimi contenuti: lo storico potrebbe essere troncato.');
  }

  const postSettimana = giorniStorico ? Math.round((postValidi.length / (giorniStorico / 7)) * 10) / 10 : null;

  const conLike = postValidi.filter((p) => typeof p.likes === 'number');
  const mediaLike = conLike.length ? Math.round(conLike.reduce((s, p) => s + p.likes, 0) / conLike.length) : null;

  // Interazioni = like + commenti per contenuto. Un post entra nel calcolo se ha
  // almeno il dato dei like (i commenti, se assenti, valgono 0): così non scartiamo
  // interi post solo perché la piattaforma non espone il conteggio commenti.
  const conInterazioni = postValidi.filter((p) => typeof p.likes === 'number' || typeof p.comments === 'number');
  const mediaInterazioni = conInterazioni.length
    ? Math.round(
        conInterazioni.reduce((s, p) => s + (typeof p.likes === 'number' ? p.likes : 0) + (typeof p.comments === 'number' ? p.comments : 0), 0) /
          conInterazioni.length
      )
    : null;

  const engagementRate = followers && mediaInterazioni != null ? Math.round((mediaInterazioni / followers) * 10000) / 100 : null;

  return {
    followers,
    postSettimana,
    mediaLike,
    mediaInterazioni,
    engagementRate,
    dataApertura: aperturaReale || (piuVecchio != null ? new Date(piuVecchio).toISOString() : null),
    aperturaStimata: !aperturaReale && piuVecchio != null,
    avvisi,
  };
}

module.exports = { computeMetrics, GIORNI_STORICO_MINIMO };
