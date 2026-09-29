const { z } = require('zod');
const { ottieniModello } = require('./ai');

const SchemaEstrazione = z.object({
  followers: z.number().nullable().describe('Numero di follower/iscritti, solo se esplicitamente presente nel testo o nello screenshot'),
  dataAperturaVisibile: z
    .string()
    .nullable()
    .describe('Data di apertura/creazione del profilo in formato ISO (YYYY-MM-DD), SOLO se scritta esplicitamente'),
  post: z
    .array(
      z.object({
        dataApprox: z.string().nullable().describe('Data approssimativa del contenuto, se leggibile (anche solo "3 settimane fa")'),
        like: z.number().nullable(),
        commenti: z.number().nullable(),
      })
    )
    .nullable()
    .describe('Elenco dei singoli contenuti con like/commenti effettivamente leggibili nel testo o nello screenshot'),
});

const ISTRUZIONI_SISTEMA = [
  "Estrai SOLO i numeri esplicitamente presenti nel testo o nell'immagine forniti dal prospect.",
  "Se un valore non è presente o non è leggibile con certezza, restituisci null: non stimare, non dedurre, non inventare nulla.",
  'Non calcolare medie, percentuali o totali: restituisci solo i dati grezzi trovati, uno per uno, così come appaiono.',
].join(' ');

async function estraiDati({ platform, testo, immagineBase64 } = {}) {
  const modello = ottieniModello();

  const content = [];
  if (testo && testo.trim()) content.push({ type: 'text', text: testo.trim() });
  if (immagineBase64) content.push({ type: 'image', image: immagineBase64 });

  if (!content.length) {
    const err = new Error('Nessun testo o immagine fornito da estrarre');
    err.code = 'EMPTY_INPUT';
    throw err;
  }

  const { generateObject } = require('ai');
  const { object } = await generateObject({
    model: modello,
    schema: SchemaEstrazione,
    system: `${ISTRUZIONI_SISTEMA} Piattaforma dichiarata dal prospect: ${platform || 'non indicata'}.`,
    messages: [{ role: 'user', content }],
  });

  return object;
}

module.exports = { estraiDati, SchemaEstrazione };
