# Autoanalisi web per scuole

App Node/Express/EJS per l'autoanalisi della presenza web di una scuola: audit tecnico, competenze, posizionamento Google e canali social, con l'aiuto opzionale dell'AI per recuperare i dati social.

## Avvio

```bash
npm install
npm start
```

## Test

```bash
npm test
npm run fixture   # sito-scuola finto su http://localhost:4321, per test end-to-end senza rete esterna
```

## Passaggio 6 — Canali social: l'aiuto dell'AI a recuperare i dati

Un unico bottone "Chiedo l'aiuto dell'AI" interroga in un colpo solo TUTTI i canali indicati (trovati sul sito + aggiunti a mano): la piattaforma "pensa", poi mostra i dati recuperati, editabili, prima che la scuola prema "Continua".

### Variabili d'ambiente

| Variabile | Serve per | Obbligatoria? |
|---|---|---|
| `META_ACCESS_TOKEN` | Instagram / Facebook | No |
| `META_IG_USER_ID` | Instagram Business Discovery | No |
| `YOUTUBE_API_KEY` | YouTube Data API v3 | No |
| `ENABLE_FACEBOOK_ADAPTER` | Attiva l'adapter Facebook | No (default false) |
| `ANTHROPIC_API_KEY` oppure `AI_GATEWAY_API_KEY` | Estrazione livello C e valutazione finale | Sì, una delle due, altrimenti quelle funzioni restano disattivate senza rompere l'app |
