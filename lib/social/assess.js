const { z } = require('zod');
const { generateObject } = require('ai');
const { ottieniModello } = require('./ai');

const SchemaValutazione = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  puntiForza: z.array(z.string()).max(3),
  puntiDeboli: z.array(z.string()).max(3),
  raccomandazioni: z.array(z.string()).max(4),
});

const ISTRUZIONI_SISTEMA = [
  'Valuta la presenza social del prospect usando SOLO i numeri forniti nel messaggio.',
  'Per ogni metrica assente (null) scrivi esplicitamente "dato non disponibile" invece di stimarla, ignorarla o inventarla.',
  'Non citare benchmark di settore non verificabili: basati solo sui numeri forniti e sul confronto tra i canali indicati.',
  'Non usare mai nomi di colori (verde, giallo, arancione, rosso) per descrivere un livello: quei colori servono solo internamente a costruire le etichette (es. "Ottimizzato", "Parziale", "Assente"), non vanno mai nominati nel testo.',
  'Rispondi sempre in italiano, con un tono professionale e concreto.',
  'Chiama "interazioni" la somma di like e commenti per contenuto: non parlare solo di "like".',
].join(' ');

function descriviCanale(c) {
  const righe = [`- ${c.label} (${c.url})`];

  if (c.platform === 'youtube' && c.youtube) {
    const y = c.youtube;
    righe.push(
      `  Video totali: ${y.videoTotali != null ? y.videoTotali : 'dato non disponibile'}.`,
      `  Ultimo video: ${y.giorniUltimoVideo != null ? y.giorniUltimoVideo + ' giorni fa' : 'dato non disponibile'}.`,
      `  Iscritti: ${y.iscritti != null ? y.iscritti : 'dato non disponibile'}.`,
      `  Media visualizzazioni per video: ${y.mediaVisualizzazioni != null ? y.mediaVisualizzazioni : 'dato non disponibile'}.`,
      `  Interazioni medie per contenuto (like+commenti): ${y.mediaInterazioni != null ? y.mediaInterazioni : 'dato non disponibile'}.`,
      `  Temi chiave trovati: ${y.temiTrovati && y.temiTrovati.length ? y.temiTrovati.join(', ') : 'nessuno'}.`
    );
    return righe.join('\n');
  }

  if (!c.disponibile) {
    righe.push(`  Dati non disponibili (${c.motivo || 'canale non raggiungibile pubblicamente'}).`);
    return righe.join('\n');
  }

  righe.push(
    `  Frequenza dei contenuti: ${c.frequenzaEtichetta || 'dato non disponibile'}.`,
    `  Interazioni medie per contenuto (like+commenti): ${c.interazioniEtichetta || 'dato non disponibile'}.`,
    `  Follower: ${c.followerEtichetta || 'dato non disponibile'}.`
  );
  if (c.engagementRate != null) righe.push(`  Engagement rate: ${c.engagementRate}%.`);
  return righe.join('\n');
}

async function valutaPresenza(canali, settore) {
  if (!Array.isArray(canali) || !canali.length) {
    throw new Error('Nessun canale confermato da valutare');
  }

  const descrizione = canali.map(descriviCanale).join('\n\n');
  const contesto = settore ? `Settore/competenze della scuola: ${settore}.\n\n` : '';

  const messaggioUtente =
    `${contesto}Canali social confermati dalla scuola:\n\n${descrizione}\n\n` +
    'Restituisci una valutazione complessiva della presenza social secondo lo schema richiesto.';

  const { object } = await generateObject({
    model: ottieniModello(),
    schema: SchemaValutazione,
    system: ISTRUZIONI_SISTEMA,
    prompt: messaggioUtente,
  });

  return object;
}

module.exports = { valutaPresenza };
