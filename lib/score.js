const LIVELLI = ['Assente', 'Parziale', 'Presente', 'Ottimizzato'];

function median(nums) {
  const arr = nums.filter((n) => typeof n === 'number' && !isNaN(n)).sort((a, b) => a - b);
  if (!arr.length) return 0;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function scoreHttps(page) {
  return page.https ? 3 : 0;
}

function scoreTitle(page) {
  if (!page.title) return 0;
  if (page.titleLength < 10) return 1;
  if (page.titleLength > 60) return 2;
  return 3;
}

function scoreMetaDescription(page) {
  if (!page.metaDescription) return 0;
  if (page.metaDescriptionLength < 50) return 1;
  if (page.metaDescriptionLength > 160) return 2;
  return 3;
}

function scoreSchema(page) {
  return page.hasSchemaOrg ? 3 : 0;
}

function scoreSpeed(psiScore) {
  if (psiScore >= 90) return 3;
  if (psiScore >= 70) return 2;
  if (psiScore >= 40) return 1;
  return 0;
}

function computeSiteScore({ pages, sitemapPresent, mobileSpeedScore, googleBusinessLink }) {
  const reachable = pages.filter((p) => p.reachable);

  const indicators = [
    {
      key: 'https',
      label: 'HTTPS',
      peso: 10,
      punteggio: median(reachable.map(scoreHttps)),
      dettaglio: reachable.every((p) => p.https) ? 'Tutte le pagine testate sono in HTTPS' : 'Alcune pagine non sono in HTTPS',
    },
    {
      key: 'title',
      label: 'Title (tag)',
      peso: 10,
      punteggio: median(reachable.map(scoreTitle)),
      dettaglio: 'Presenza e lunghezza del tag <title> sulle pagine testate',
    },
    {
      key: 'meta_description',
      label: 'Meta description',
      peso: 10,
      punteggio: median(reachable.map(scoreMetaDescription)),
      dettaglio: 'Presenza e lunghezza della meta description',
    },
    {
      key: 'velocita_mobile',
      label: 'Velocità mobile',
      peso: 20,
      punteggio: scoreSpeed(mobileSpeedScore),
      dettaglio: `Punteggio prestazioni mobile: ${mobileSpeedScore}/100`,
    },
    {
      key: 'sitemap',
      label: 'Sitemap XML',
      peso: 10,
      punteggio: sitemapPresent ? 3 : 0,
      dettaglio: sitemapPresent ? 'sitemap.xml trovata' : 'Nessuna sitemap.xml trovata',
    },
    {
      key: 'schema_org',
      label: 'Dati strutturati (schema.org)',
      peso: 15,
      punteggio: median(reachable.map(scoreSchema)),
      dettaglio: 'Markup schema.org (JSON-LD o microdata) sulle pagine testate',
    },
    {
      key: 'scheda_google',
      label: 'Scheda Google (Business Profile)',
      peso: 15,
      punteggio: googleBusinessLink ? 3 : 0,
      dettaglio: googleBusinessLink
        ? 'Trovato un link alla scheda / a Google Maps'
        : 'Nessun link alla scheda Google trovato sul sito',
    },
    // L'indicatore "Ultimo contenuto pubblicato" (basato sulla data più recente trovata nelle
    // pagine analizzate qui) è stato rimosso il 2026-10-02 su richiesta di Andrea: si sovrapponeva
    // col criterio "Nurturing" dedicato "Attività editoriale" (passaggio 9, lib/contenuti.js), che
    // fa la stessa verifica in modo più completo (frequenza, ottimizzazione, relazione con le
    // competenze) — qui restava solo una versione ridondante e meno accurata.
  ];

  const pesoTotale = indicators.reduce((s, i) => s + i.peso, 0);
  const puntiTotali = indicators.reduce((s, i) => s + (i.punteggio / 3) * i.peso, 0);
  const score = Math.round((puntiTotali / pesoTotale) * 100);

  const worst = indicators
    .slice()
    .sort((a, b) => a.punteggio / a.peso - b.punteggio / b.peso || b.peso - a.peso)[0];

  return {
    score,
    worst,
    indicators: indicators.map((i) => ({ ...i, livello: LIVELLI[Math.round(i.punteggio)] })),
    pagineTestate: reachable.length,
    pagineTotali: pages.length,
  };
}

module.exports = { computeSiteScore, median };
