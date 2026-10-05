## ✅ Scheda GBP cercata con l'indirizzo scritto sul sito (2026-10-04)
- Caso segnalato: scuolamariaconsolatrice.org mostrava la scheda "Scuola di Badia a Firenze" (omonimo).
- `lib/localita.js`: indirizzo (via + civico + CAP/città) letto anche dal testo del sito (footer/contatti) quando mancano i dati schema.org; nome scuola preso dalla prima parte non generica del `<title>`.
- `lib/social/gbp.js`: query Places = nome + indirizzo; tra i primi risultati si sceglie quello con stesso sito web, altrimenti stessa via/città; se nessuno corrisponde → "nessuna scheda trovata" (mai un omonimo).

## ⚠️ SITO BLOCCATO AI MOTORI DI RICERCA (dal 2026-10-04, richiesta di Andrea) — RICORDARE ALL'UTENTE

Finché questa nota c'è, `autoanalisi-scuole.vercel.app` NON deve comparire su Google: header `X-Robots-Tag: noindex...` su
ogni risposta (`server.js`), `<meta name="robots" content="noindex...">` in `views/partials/layout-top.ejs`,
`GET /robots.txt` con `Disallow: /`. **Ricordare ad Andrea, a ogni sessione e prima di qualsiasi lancio/promozione,
che il sito è bloccato**. Per sbloccarlo (solo se Andrea lo chiede): togliere i tre punti sopra e rimettere robots.txt permissivo.

## Stato al 2026-10-05 (sessione schedulata, seconda) — nessun codice nuovo, 8 correzioni di spunta nella voce 5

Sessione schedulata: letto TASKS.md per intero prima di iniziare, come richiesto. Repo già presente
in questa sandbox (nessun `add_repo`/clone necessario), `git pull` senza novità rispetto all'ultimo
commit (`121a905`, della sessione precedente di oggi).

- [x] **Criteri blog/contenuti e newsletter (voci 1 e 2 della sezione "Da fare")**: ri-confermati
      completi, agganciati e deployati (nessuna novità rispetto alle sessioni precedenti) — nessuna
      azione necessaria.
- **Ricontrollata per intero la voce 5 (revisione testi/UX)**, bullet per bullet, contro il codice
  attuale (non solo contro le note delle sessioni precedenti), per cercare altri casi come i 2 trovati
  dalla sessione precedente di oggi (lavoro già fatto ma mai spuntato in questa lista specifica). Ne
  sono emersi **8 altri**: punto 1 (Landing), punto 6 (checkbox YouTube, "(stimato)", testo "Aggiungi
  un altro canale...", card GBP sintetica) e punto 8 (messaggio "codice 400" sostituito, voce
  "Community" rimossa) — tutti implementati in sessioni precedenti (perlopiù "2026-10-03, notte, 11"
  e "2026-10-02, sessione Andrea") ma non ancora spuntati in questa lista. Spuntati ora con nota e
  verifica puntuale contro il file attuale (vedi dettaglio nella sezione "5) Revisione testi e UX" più
  sotto in questo file) — **nessuna riga di codice modificata**, solo documentazione.
- **Confermati ancora apertI, nessuna novità rispetto alle sessioni precedenti** (richiedono conferma
  di Andrea o sono feature più ampie, non "la scelta più semplice"): punto 2 (box "dato peggiore",
  ambiguo da quando l'indicatore "ultimo contenuto pubblicato" è stato rimosso); punto 4 parte
  "accorpare passaggio 4+5" (ristrutturazione di schermate); checkbox di fianco al canale TROVATO in
  `views/social-conferma.ejs` (funzione di esclusione omonimi, serve un meccanismo sostitutivo prima
  di toglierlo); caso multi-plessi GBP (serve decidere l'aggregazione del punteggio su più schede);
  numerazione mancante del punto 7. Voce n. 0 (bug sessione in-memory): Andrea ha deciso di lasciare
  com'è, non riaperta. Voce n. 3 (andamento social 3 mesi): richiede ancora conferma di Andrea sul
  livello di automazione. Le 5 nuove voci in cima al file (domande dirette, punteggi, report finale,
  firme, ingaggio commerciale): richiedono tutte esplicitamente un confronto con Andrea.
- [x] **Verificato lo stato di salute del codice** (nessuna modifica): `npm install` (node_modules
      mancanti in questa sessione), `npm test` → **78/78 test unitari verdi** (nessuna variazione,
      coerente col fatto che non è stato toccato codice), `node -e "require('./server.js')"` pulito.
- [x] **Commit e push**: solo questo aggiornamento di `TASKS.md` (commit `ee7fa79`), nessun codice
      applicativo modificato. **Come già notato dalla sessione precedente**, con la Git integration
      anche un push di solo `TASKS.md` genera comunque un nuovo deployment di produzione (codice
      applicativo identico, `TASKS.md` non è servito dall'app): `dpl_HekAURQH5C71tRv9ZecVM9Y86Kt6`,
      `READY`. **Alias**: `list_aliases` prima del cambio confermava ancora il deployment precedente
      (`dpl_GrmMC7Rkqy4GU3teS6HfdaTY6wKm`, commit `84a98d0` — nessuna sessione concorrente), poi
      `assign_alias` su `autoanalisi-scuole.vercel.app` (`oldDeploymentId` di ritorno uguale a quanto
      atteso), verificato stabile con un secondo `list_aliases` (anche l'alias
      `autoanalisi-scuole-git-main-osky2.vercel.app` risultava già aggiornato automaticamente). Alias
      di fallback `-osky2` non toccato (resta il redirect permanente verso l'alias primario). Nessun
      controllo HTTP diretto dal vivo (stesso limite di rete delle sessioni schedulate precedenti) —
      verifica basata su `readyState: READY` e sul fatto che il codice applicativo è bit-per-bit
      identico alla produzione precedente (solo `TASKS.md` è cambiato). La prossima sessione può
      ripartire da qui: la voce 5 del backlog è ora quasi tutta spuntata, i pochi punti restanti sono
      tutti esplicitamente in attesa di una decisione di Andrea (non codificabili "nel modo più
      semplice" senza rischiare di andare contro il suo intento).

## Stato al 2026-10-05 (sessione schedulata) — verifica testo libero sul sito (voce 5, punto 4) + 2 correzioni di spunta

Sessione schedulata: letto TASKS.md per intero prima di iniziare, come richiesto.

- [x] **Criteri blog/contenuti e newsletter (voci 1 e 2 della sezione "Da fare")**: ri-confermati
      completi, agganciati e deployati (nessuna novità rispetto alle sessioni precedenti) — nessuna
      azione necessaria.
- [x] **Voce 5, punto 4 ("verificare se le competenze indicate nel TESTO LIBERO sono state trovate
      sul sito")**: implementato — vedi il dettaglio nella sezione "5) Revisione testi e UX" più
      sotto in questo file. In breve: nuova `verificaTemaLibero()` in `lib/temi.js`, che riusa la
      stessa identica logica di corrispondenza già usata per i temi del vocabolario (non un nuovo
      criterio arbitrario, risolvendo così il dubbio lasciato aperto dalla sessione del 2026-10-04).
      4 nuovi test (78 totali verdi), rendering EJS verificato su 6 combinazioni,
      `require('./server.js')` pulito.
- [x] **2 correzioni di sola documentazione** (nessun codice toccato): nella voce 5 punto 5, due
      spunte mancanti per lavoro già fatto in sessioni precedenti ma mai segnato come completo —
      "stesso stile delle select" (fatto il 2026-10-02, commit `2398f9f`) e "simboli matematici al
      posto delle etichette qualitative" (fatto il 2026-10-03). Rilette e verificate entrambe contro
      il codice attuale prima di spuntarle.
- **Controllato se esisteva un'altra voce azionabile senza il contributo di Andrea — nessuna
  trovata oltre a quella sopra**: voce 0 (bug sessione in-memory, Andrea ha deciso di lasciare
  com'è); voce 3 (andamento social 3 mesi, richiede conferma del livello di automazione); voce 4
  (obsoleta); voce 5 restante (checkbox canale trovato — toglierlo romperebbe la funzione di
  esclusione omonimi senza un meccanismo sostitutivo, serve conferma; accorpamento passaggi 4+5,
  ristrutturazione di schermate; multi-plessi GBP, feature più ampia con scelte di aggregazione
  punteggio non specificate — valutata ma non iniziata per lo stesso motivo delle sessioni
  precedenti: serve decidere come il punteggio GBP si aggrega su più schede selezionate, non è "la
  scelta più semplice" quando tocca la logica di valutazione); le 5 nuove voci in cima al file
  (domande dirette, punteggi, report finale, firme, ingaggio commerciale) richiedono tutte
  esplicitamente un confronto con Andrea.
- [x] **Verificato prima del deploy**: 78 test unitari verdi (74 esistenti + 4 nuovi), `npm install`
      (node_modules mancanti in questa sessione), `require('./server.js')` pulito, rendering con
      `ejs.renderFile` di `verifica.ejs` su 6 combinazioni (nessuna competenza, vocabolario
      trovato/non trovato, testo libero trovato/non trovato, mix), e una pipeline end-to-end contro
      un sito fittizio servito in locale (`http.createServer`) per `verificaTemaLibero`.
- [x] **Commit, push e deploy**: commit `c577231`, push su `main` senza conflitti (`git fetch
      origin main` prima del commit, nessuna sessione concorrente). Deploy automatico via Git
      integration: `dpl_CM8hji2VHaouzzHaUFTxaVMBJiW7`, `READY` in ~14s. **Promosso in produzione**:
      l'alias automatico NON ha aggiornato l'alias primario (restava su `dpl_9uoJfgJ9e2CAnzAk69ovxNP4nHgm`,
      il deployment del commit precedente `c3574cc` — stesso comportamento inaffidabile già
      documentato nelle sessioni precedenti), quindi `assign_alias` manuale su
      `autoanalisi-scuole.vercel.app` (`oldDeploymentId` di ritorno uguale a quanto atteso),
      verificato stabile con un secondo `list_aliases`. Alias di fallback `-osky2` non toccato
      (resta il redirect permanente verso l'alias primario). **Nota**: con la Git integration ogni
      push su `main` genera un nuovo deployment, incluso questo stesso commit di solo `TASKS.md` (che
      ha prodotto `dpl_GrmMC7Rkqy4GU3teS6HfdaTY6wKm`, codice applicativo identico a
      `dpl_CM8hji2VHaouzzHaUFTxaVMBJiW7` — `TASKS.md` non viene servito dall'app) — anche questo
      secondo deployment non è stato aliasato automaticamente, quindi riassegnato a mano allo stesso
      modo. **L'alias primario in produzione punta quindi, a fine sessione, a
      `dpl_GrmMC7Rkqy4GU3teS6HfdaTY6wKm`** (non a `dpl_CM8hji2VHaouzzHaUFTxaVMBJiW7` come scritto
      sopra prima di questa scoperta), verificato con un terzo `list_aliases`. Deploy via Git
      integration (non il vecchio meccanismo "by file list"), quindi nessun rischio del troncamento di
      `list_deployment_files` che aveva causato l'incidente del 2026-10-01. Non è stato possibile un
      controllo HTTP diretto dal vivo (stesso limite di rete delle sessioni schedulate precedenti
      verso `vercel.app`) — verifica basata su `readyState: READY`, sui 78 test locali e sul
      rendering EJS descritti sopra.

## Stato al 2026-10-04 (sessione schedulata, seconda) — 4 ritocchi testo non ambigui del punto 5 (voce "Da fare")

Sessione schedulata: letto TASKS.md per intero prima di iniziare, come richiesto.

- [x] **Criteri blog/contenuti e newsletter (voci 1 e 2 della sezione "Da fare")**: ri-confermati
      completi, agganciati e deployati (nessuna novità rispetto alle sessioni precedenti) — nessuna
      azione necessaria.
- [x] **Voce 4 ("Verifica E2E aiuto AI Gemini") — ora OBSOLETA**: il bottone "🤖 Chiedo l'aiuto
      dell'AI" e tutto il flusso collegato sono stati rimossi del tutto nella sessione precedente
      (vedi "RISOLTO il 2026-10-04" più sotto) — non c'è più nulla da verificare end-to-end. Voce da
      considerare chiusa, non riaprire.
- **5 nuove voci in cima al file (domande al dirigente, punteggi, report finale, firme, ingaggio
  commerciale)**: tutte richiedono esplicitamente un confronto con Andrea prima di qualunque
  implementazione (lo dice il file stesso) — nessuna scelta implementativa semplice possibile,
  non toccate.
- **Voce 3 (andamento social 3 mesi)**: richiede ancora conferma di Andrea sul livello di
  automazione — non toccata.
- [x] **Voce 5 (revisione testi/UX), altro sottoinsieme non ambiguo implementato** (incremento
      piccolo e autoconclusivo, scelto per budget di sessione conservativo): nel punto 4 ("Passaggio
      conferma competenze + risultati ricerche, da accorpare") solo i pezzi di puro testo/stile,
      indipendenti dalla fusione delle schermate 4+5 (quella resta non toccata, è una
      ristrutturazione, non un testo):
  - **Punto 3**: titolo del passaggio dichiarazione competenze cambiato in "Quali competenze o
        specificità comunichi sul sito della tua scuola?" (`views/dichiarazione.ejs`).
  - **Punto 4**: titolo "Competenze aggiuntive individuate nel sito" → "Competenze individuate nel
        sito" (parola "aggiuntive" tolta, come richiesto); aggiunta la spiegazione richiesta da
        Andrea quando non si trova nessuna competenza aggiuntiva ("Abbiamo controllato i contenuti
        del sito e non abbiamo trovato una quantità omogenea di contenuti che identificasse una
        competenza tra quelle standard.") al posto del testo precedente, in `views/verifica.ejs`.
  - **Punto 4**: nel blocco risultati di posizionamento, "Non presente nei risultati analizzati" →
        "Non presente nei primi 10 risultati su Google." (`views/posizionamento.ejs`, ramo quando
        nessuna query del cluster ha risultati analizzabili).
  - **Nuova classe CSS `.text-bad`** (`views/partials/layout-top.ejs`, usa la variabile colore
        `--bad` già esistente) applicata al tag "(non trovato sul sito)" già presente in
        `views/verifica.ejs` per le competenze dichiarate dal vocabolario e non trovate sul sito —
        ora mostrato in rosso come richiesto ("mostrare... in rosso").
  - **Non toccato, stesso punto 4** (richiede nuova logica, non solo testo — lasciato per sicurezza,
        servirebbe una decisione sull'algoritmo di matching): la prima parte del punto, "verificare
        se le competenze indicate nel TESTO LIBERO dall'utente sono state trovate sul sito". Oggi
        `estraiTemi()` (`lib/temi.js`) confronta solo il VOCABOLARIO fisso con le pagine scaricate —
        non esiste alcun controllo che cerchi la label scritta a mano dall'utente (key `null`) nel
        contenuto del sito; andrebbe deciso come definire "trovato" per un testo libero arbitrario
        (corrispondenza esatta? parole significative? case-insensitive? quante occorrenze minime?)
        prima di scrivere il codice, per non introdurre falsi positivi/negativi arbitrari. La fusione
        dei passaggi 4+5 e il resto dei punti 1/2/5/6/8 restano come già segnalato dalle sessioni
        precedenti (richiedono conferma di Andrea su numerazione/ambiguità, vedi sezione completa più
        sotto).
- [x] **Verificato prima del deploy**: 70 test unitari esistenti ancora verdi (nessuna logica
      toccata, solo testo/markup/CSS), `require('./server.js')` pulito, rendering con
      `ejs.renderFile` delle 3 view toccate (`dichiarazione`, `verifica`, `posizionamento`) su più
      casi (competenza dichiarata trovata/non trovata, nessuna competenza dichiarata, con/senza
      competenze aggiuntive, risultato posizionamento senza query analizzabili) per confermare
      l'assenza di errori EJS e la presenza dei nuovi testi/classe CSS.
- [x] **Commit, push e deploy**: commit `737b93e`, deploy automatico via Git
      (`dpl_FHdouHFs3vQ99BYK6U9a12k7suef`, `READY` in ~16s). **Promosso in produzione**:
      `list_aliases` prima del cambio confermava ancora il deployment precedente
      (`dpl_Dn8rjv8o1FrFG231iXwiZ75htgaG`, commit `be70f28` — nessuna sessione concorrente), poi
      `assign_alias` su `autoanalisi-scuole.vercel.app` (`oldDeploymentId` di ritorno uguale a
      quanto atteso), verificato stabile con un secondo `list_aliases`. Alias di fallback `-osky2`
      non toccato (resta il redirect permanente verso l'alias primario). Non è stato possibile un
      controllo HTTP diretto dal vivo (stesso limite di rete delle sessioni schedulate precedenti
      verso `vercel.app`) — verifica basata su `readyState: READY`, sui 70 test locali e sul
      rendering EJS descritti sopra. Nessun'altra voce azionabile senza il contributo di Andrea
      trovata in questa sessione (vedi i punti elencati sopra) — sessione conclusa con questo solo
      incremento.

## Stato al 2026-10-04 — Test Firecrawl sui social eseguito: FALLISCE (blocco di dominio) → rimosso il bottone AI

Sessione schedulata. Letto TASKS.md per intero prima di iniziare, come richiesto. Eseguito oggi il test
pianificato nella sezione "PROSSIMO TASK" più sotto (rinominata "RISOLTO" in questa sessione), nel giorno
indicato da Andrea per il ripristino dei crediti gratuiti Firecrawl.

- [x] **Test Firecrawl su profili reali** (`mcp__Firecrawl__firecrawl_scrape`, proxy `stealth` e `auto`,
      `maxAge: 0` per una lettura live): provati 5 profili reali di scuole italiane trovati via ricerca web
      (non siti di test): `facebook.com/scuolalazolla`, `instagram.com/scuolalazolla`,
      `instagram.com/istitutoleonexiii`, `facebook.com/i.c.barlassina`, `instagram.com/scuolamediamontanari`.
      **Risultato identico e immediato per tutti e 5, su entrambe le piattaforme e con entrambi i proxy
      provati**: l'API Firecrawl rifiuta la richiesta ancora prima di provare a scaricare la pagina, con
      l'errore esplicito `"We apologize for the inconvenience but we do not support this site."` — non un
      timeout, non un muro di login, non un errore di crediti: un blocco di POLITICA a livello di intero
      dominio (`instagram.com` e `facebook.com` esclusi dal servizio), uguale per ogni profilo e ogni
      impostazione di proxy provata. **Nessun credito Firecrawl consumato** (la richiesta viene rifiutata
      prima di qualunque fetch/screenshot).
- [x] **Esito del test = decisione presa da Andrea in anticipo** (vedi sezione sotto, ora "RISOLTO"): dato
      che Firecrawl non è utilizzabile per Instagram/Facebook (le due piattaforme che contano per le scuole),
      si applica la regola già scritta: **"niente bottone AI"**. Non serve un nuovo confronto con Andrea:
      l'esito del test era esplicitamente la decisione stessa.
- [x] **Implementato**: rimosso del tutto il bottone "🤖 Chiedo l'aiuto dell'AI" e il flusso di upload
      screenshot, sia nel passaggio 6 (`views/social-conferma.ejs`) sia nel passaggio 7 — canali aggiunti a
      mano (`views/social-altri.ejs`). Restano solo i menù a tendina per l'autodichiarazione delle fasce
      (post/settimana, interazioni, follower), sempre attivi (non più "grigi e disabilitati" in attesa
      di un dato automatico che non arriverà mai).
  - **Rotte rimosse da `server.js`**: `POST /social/:id/ai-aiuto`, `POST /social/:id/ai-estrai`, e le due
        rotte pubbliche gemelle non collegate a nessuna view (`POST /api/social/fetch`, `POST /api/social/extract`)
        — stesso meccanismo abbandonato, mai usate dal wizard, nessun test le referenziava.
  - **File lib diventati inutilizzati, eliminati**: `lib/social/fetchService.js`, `lib/social/platforms.js`,
        `lib/social/extract.js`, `lib/social/adapters/index.js` (lo stub `infoPiattaforma()` che ritornava
        sempre `null`, causa originaria del problema).
  - **Non toccati, per scelta**: `lib/social/ai.js` (`providerDisponibile`/`ottieniModello`) e
        `lib/social/assess.js` (`valutaPresenza`) — restano in uso per la valutazione AI complessiva dei
        canali già confermati dall'utente (passaggio `/social/:id/esegui`, mostrata in `social-analisi.ejs`),
        un criterio indipendente che non dipende da scraping di Instagram/Facebook e quindi non è toccato
        dall'esito di questo test. Anche `POST /api/social/assess` (stessa logica, rotta pubblica non
        collegata a nessuna view) lasciato intatto per lo stesso motivo. `lib/social/cache.js` lasciato
        intatto: usato anche da `lib/social/youtube-analysis.js` e `lib/social/gbp.js`, non solo dal
        meccanismo rimosso. Il campo `datiAI`/`parseDatiAI` in `server.js` e la gestione di `canale.datiAI`
        in `lib/social.js` (`analizzaCanaleGenerico`) sono stati lasciati come sono (ora semplicemente
        sempre `null`, gestito correttamente da codice già esistente) per non toccare logica di punteggio
        non necessaria a questo intervento — nessun impatto, nessun input potrà più popolarli.
- [x] **Verificato prima del deploy**: 70 test unitari esistenti ancora verdi, `require('./server.js')`
      pulito, rendering EJS di `social-conferma`/`social-altri` su più combinazioni (nessun canale/alcuni
      canali trovati, YouTube presente/assente, GBP nei vari stati) senza errori. Test end-to-end con il
      server Express reale: le 4 rotte rimosse rispondono `404`, `/api/social/assess` resta raggiungibile
      (`501` senza provider AI, come da comportamento esistente), e l'intero percorso
      `GET/POST /social/:id` → `GET/POST /social/:id/altri` con una sessione simulata e fasce scelte a mano
      salva correttamente `socialConfermati` (con `datiAI: null`) e prosegue il wizard.
- [x] **Commit, push e deploy**: commit `be70f28`, deploy automatico via Git `dpl_Dn8rjv8o1FrFG231iXwiZ75htgaG`
      (`READY` in ~14s). **Promosso in produzione**: `list_aliases` prima del cambio confermava ancora il
      deployment precedente (`dpl_H1xQn173pVk5HEgmuvwBdsVMrKPp`, commit `a2a1a28` — nessuna sessione
      concorrente), poi `assign_alias` su `autoanalisi-scuole.vercel.app` (`oldDeploymentId` di ritorno
      uguale a quanto atteso), verificato stabile con un secondo `list_aliases`. Alias di fallback `-osky2`
      non toccato (resta il redirect permanente verso l'alias primario, come da regola). Non è stato
      possibile un controllo HTTP diretto dal vivo (stesso limite di rete delle sessioni schedulate
      precedenti verso `vercel.app`) — verifica basata su `readyState: READY`, sui 70 test locali, sul
      rendering EJS e sul test end-to-end descritti sopra.
- **Nota per Andrea**: se in futuro si vuole riprovare l'automazione per Instagram, l'unica via concreta
  già discussa (non Firecrawl) è la Graph API di Meta/Business Discovery, limitata ai profili
  business/creator e che richiede un'app Meta approvata — un lavoro di integrazione a parte, non un
  piccolo ritocco. Nessuna azione presa in questa direzione, solo annotata come riferimento.

## Stato al 2026-10-03 (sera, 3) — riga unica centrata sotto il box: "Prossimo passaggio: … - Salta il prox passaggio"

Richiesta di Andrea: il link di salto va sulla stessa riga della descrizione, centrato e più vicino al box bianco (prima il
link era sotto "Continua"). Ora un solo partial `views/partials/prossimo-passo.ejs` (parametri `testo`, `salta`, `href`);
rimosso `prossimo-salta.ejs`. Nei moduli (3, 6, 7) il salto resta un pulsante di invio con `salta=1`; per evitare che
Invio da tastiera lo attivi al posto di "Continua", il partial inserisce prima un pulsante di invio invisibile.

## Stato al 2026-10-03 (sera, 2) — testi più brevi per descrizione e salto del passaggio successivo

Richiesta di Andrea: descrizione "Prossimo passaggio: <nome>" (es. "Prossimo passaggio: indicazione competenze della
scuola") e link "Salta il prox passaggio". Modificati i testi nei passaggi 2-9 (partial `prossimo-passo` / `prossimo-salta`).

## Stato al 2026-10-03 (sera) — in ogni passaggio: descrizione del successivo + possibilità di saltarlo

Richiesta di Andrea. Nuovi blocchi condivisi `views/partials/prossimo-passo.ejs` (testo piccolo sotto il box bianco,
sopra i bottoni: cosa si vede nel passaggio successivo) e `views/partials/prossimo-salta.ejs` (link/pulsante piccolo
sotto "Continua →"). Applicati ai passaggi 2-9. Nei passaggi con modulo (3, 6, 7) il salto è un pulsante di invio che
salva comunque ciò che l'utente ha compilato (`salta=1`); negli altri è un link `GET .../salta`.
- Salta 3 (da 2): `GET /dichiarazione/:id/salta` -> nessuna competenza, si va al 4.
- Salta 4 (da 3): `POST /dichiarazione/:id` con `salta` -> `preparaTemi()` (calcolo sincrono, senza mostrarlo) e vai al 5.
- Salta 5 (da 4): già fatto nel commit precedente (`GET /posizionamento/:id/salta`, nessun credito Serper).
- Salta 6 (da 5): `GET /social/:id/salta` -> nessun canale confermato, vai al 7.
- Salta 7 (da 6): `POST /social/:id` con `salta` -> salva i canali e vai direttamente all'analisi (8).
- Salta 8 (da 7): `POST /social/:id/altri` con `salta` -> `socialAnalisi=[]`, `analisiSocialSaltata=true`, vai alla
      domanda sulla cadenza (9). Se l'utente torna alla pagina di analisi, questa viene eseguita davvero.
- Salta 9 (da 8): `GET /contenuti/:id/salta` -> `contenutiSaltato=true`, vai alla domanda sulla newsletter (10); le rotte
      newsletter accettano `contenutiSaltato`.
- Passaggio 9 -> 10: solo la descrizione, senza link per saltare (dopo il 10 non c'è nessun altro passaggio; da decidere
      quando ci sarà il report finale).
- Non toccate: le schermate-domanda (cadenza, importanza newsletter) fanno parte rispettivamente dei passaggi 9 e 10.
- Verifica: percorso completo con tutti i salti provato in locale (17 controlli); 70 test unitari verdi.
- Nota: con il passaggio 6 o 8 saltati, i passaggi successivi non mostrano dati social (nessun testo "saltato" dedicato).

## Stato al 2026-10-03 (pomeriggio) — passaggio 3 senza competenze + possibilità di saltare il passaggio 5

Richiesta di Andrea.
- [x] **Passaggio 3**: si può continuare senza indicare nessuna competenza (prima si tornava alla stessa pagina).
      Il passaggio 4 mostra "Non è stata indicata nessuna competenza" e le sole competenze individuate nel sito
      (osservazione: "Il tema più citato nel sito è X"). Se non ne trova nessuna, il passaggio 5 viene saltato da solo.
- [x] **Passaggio 4**: sotto il box bianco, sopra i bottoni, testo piccolo che descrive il passaggio 5; sotto "Continua"
      link piccolo "Salta il passaggio successivo (posizionamento su Google)" -> `GET /posizionamento/:id/salta`
      (imposta `sessione.posizionamentoSaltato`, nessuna ricerca, nessun credito Serper). Il passaggio 6 accetta
      `posizionamentoSaltato`; il suo "← Indietro" porta al passaggio 4 invece che rieseguire il 5.
- Nota: senza competenze confermate, nel passaggio 9 "relazione con le competenze" risulta "Assente" (lista vuota).
      Da rivedere se si vuole un testo diverso.

## DA FARE — nuovi pezzi di sviluppo (elenco di Andrea, 2026-10-03)

Da affrontare dopo il test Firecrawl sui social (2026-10-04, fatto — vedi "Stato al 2026-10-04" in cima
al file). Per ognuno serve comunque prima un confronto con Andrea: nessuna di queste 5 voci è stata
affrontata in questa sessione, il test completato tocca solo il bottone AI dei canali social.
- [ ] **Passaggio "Obiettivi della comunicazione" (richiesta di Andrea, 2026-10-05)** — fa parte delle domande dirette al dirigente.
      - **Schermata 1**: domanda "Quali sono gli obiettivi di una efficace attività di comunicazione che ti possono
        interessare per la tua scuola?". Il dirigente marca quelli che gli interessano (scelta multipla) e c'è anche un
        **campo libero** per indicarne altri (anche più di uno).
      - Obiettivi proposti (concordati con Andrea, 2026-10-05):
        1. Aumentare le iscrizioni.
        2. Raggiungere più velocemente i numeri necessari per attivare classi e corsi.
        3. Migliorare la reputazione della scuola e il gradimento degli iscritti.
        (Scartati perché concettualmente uguali al punto 2: riempire gli ultimi posti, far partire un corso nuovo.)
      - **Schermata successiva**: creare i collegamenti tra le attività di marketing e comunicazione indagate finora
        (posizionamento su Google, competenze sul sito, canali social, scheda Google Business Profile, newsletter,
        blog/contenuti, aspetti tecnici del sito) e gli obiettivi indicati. **Esclusi gli obiettivi scritti nel campo
        libero**, per cui non ci sono collegamenti predefiniti.
      - Da decidere con Andrea: posizione nel percorso (prima del report?), come legare gli obiettivi ai pesi dei
        punteggi, mappa esatta attività → obiettivi.
- [ ] **Domande dirette al dirigente**: da definire quali domande e in quale punto del percorso.
- [ ] **Schermata "Giudizio sull'efficacia della comunicazione" (richiesta di Andrea, 2026-10-05)**: viene dopo il passaggio
      sugli obiettivi e dopo tutte le analisi. Valuta l'efficacia della comunicazione della scuola **in base all'analisi fatta
      e agli obiettivi dichiarati** dal dirigente.
      **Decisioni di Andrea (2026-10-05)**
      - **Il giudizio dipende dall'efficacia trovata nei blocchi**: durante l'analisi si calcola per ogni blocco un voto
        interno (0-100, **mai mostrato all'utente**); il giudizio finale rispetto all'obiettivo è la media pesata
        `voto = peso_tecnica*v_tecnica + peso_contenuti*v_contenuti + peso_comunicazione*v_comunicazione`, con i pesi della
        tabella per obiettivo (più obiettivi = media dei pesi). Più un blocco è efficace, più alza il giudizio — e più lo
        alza quanto più è importante per l'obiettivo.
      - **Nessuna AI**: testi scritti a mano per ogni combinazione, scelti da regole.
      **Struttura della schermata**
      1. **Lista dei 3 blocchi con importanza**: ordinati per peso dell'obiettivo — il più pesante = **Fondamentale**, il
         secondo = **Importante**, il terzo = **Accessorio** (con più obiettivi si usano i pesi medi; a pari peso, ordine
         tecnica < contenuti < comunicazione).
      2. **Giudizio complessivo**: Efficace (voto >= 70) / Efficace solo in parte (40-69) / Non ancora sufficiente (< 40).
      3. **Commento di 5-6 righe**, composto da frasi pre-scritte in quest'ordine: apertura (giudizio + obiettivo) → frase
         sul blocco fondamentale → frase sul blocco importante → frase sul blocco accessorio (breve) → un dato concreto trovato
         nell'analisi (es. "newsletter assente", "blog fermo da X mesi", posizione trovata/non trovata) → chiusura.
      **Bozza dei testi (da rivedere con Andrea)** — fascia di blocco: Solido (>=70) / Migliorabile (40-69) / Debole (<40)
      - Apertura: "Rispetto all'obiettivo di {obiettivo}, la comunicazione della tua scuola risulta {efficace | efficace solo
        in parte | non ancora sufficiente}." — {obiettivo}: "aumentare le iscrizioni" / "raggiungere prima i numeri per classi e
        corsi" / "migliorare la reputazione e il gradimento degli iscritti" (più obiettivi: elencati con "e").
      - SEO tecnica — Solido: "Il sito è tecnicamente solido: si carica bene, funziona da mobile ed è leggibile dai motori di
        ricerca, quindi non ostacola chi arriva dalla ricerca." / Migliorabile: "Il sito funziona, ma ha alcune carenze
        tecniche che rallentano chi arriva e riducono la resa dei contenuti." / Debole: "Il sito ha problemi tecnici rilevanti
        che penalizzano visibilità ed esperienza di chi lo visita: conviene risolverli prima di investire in altro."
      - SEO contenuti — Solido: "I contenuti lavorano bene: le competenze della scuola emergono sul sito, compaiono nelle
        ricerche delle famiglie e il blog è aggiornato con regolarità." / Migliorabile: "I contenuti ci sono ma raccontano
        solo in parte ciò che distingue la scuola: alcune competenze non emergono o non compaiono nelle ricerche, e il blog è
        poco regolare." / Debole: "Le famiglie che cercano online faticano a trovare la scuola e a capire che cosa la
        distingue: poche competenze comunicate, scarsa presenza nelle ricerche, blog fermo o assente."
      - Comunicazione — Solido: "La scuola comunica con continuità: social attivi, scheda Google curata e newsletter regolare
        mantengono vivo il rapporto con le famiglie." / Migliorabile: "La comunicazione c'è ma è discontinua: alcuni canali
        sono attivi, altri trascurati (social, scheda Google o newsletter)." / Debole: "La comunicazione è quasi assente:
        canali social fermi o mancanti, scheda Google poco curata e nessuna newsletter, quindi poco contatto con le famiglie."
      - Per il blocco **accessorio** si usa solo la prima metà della frase (una riga).
      - Chiusura — giudizio Efficace: "L'impostazione è buona: conviene consolidarla e misurarne i risultati." / solo in
        parte: "Intervenendo sui punti indicati, l'efficacia può crescere in modo sensibile." / Non ancora sufficiente: "Serve
        un intervento mirato, partendo dal blocco più importante per il tuo obiettivo."
      - Il dato concreto va preso dall'analisi reale (non inventato) e inserito nella frase del blocco corrispondente.
      Da decidere: dove sta nel percorso rispetto al report finale; calcolo del voto interno 0-100 dei singoli indicatori
      di ogni blocco (parte della voce "Definire i punteggi").
- [ ] **Definire i punteggi**: criteri e pesi per ogni area/passaggio e punteggio complessivo.
      **Impostazione concordata con Andrea (2026-10-05)** — l'autoanalisi si divide in 3 blocchi:
      - **SEO tecnica** (1 schermata): audit tecnico del sito.
      - **SEO contenuti**: blog/aggiornamento contenuti, competenze comunicate sul sito e loro verifica, posizionamento su Google.
      - **Comunicazione**: newsletter, social e scheda Google Business Profile (recensioni, foto, risposte).
      **Pesi del punteggio finale, per obiettivo scelto dal dirigente** (decisi da Andrea):
      | Obiettivo | SEO tecnica | SEO contenuti | Comunicazione |
      |---|---|---|---|
      | Aumentare le iscrizioni | 25% | 45% | 30% |
      | Raggiungere prima i numeri per classi e corsi | 25% | 30% | 45% |
      | Reputazione e gradimento degli iscritti | 20% | 30% | 50% |
      Più obiettivi scelti → media dei pesi; solo obiettivo libero → pesi di base (da fissare, ipotesi 25/40/35).
      Dentro ogni blocco: pesi uguali tra gli indicatori salvo i più importanti (es. posizionamento e competenze nel blocco contenuti).
      **Ancora da decidere**: mostrare i 3 punteggi per blocco + uno complessivo (proposta) o solo uno; scala 0-100 o
      livelli Insufficiente/Sufficiente/Buono già usati; collocazione definitiva della scheda GBP (Comunicazione o blocco "Visibilità locale").
- [ ] **Report finale scaricabile**: documento (probabilmente PDF) con i risultati di tutti i passaggi e i punteggi.
- [ ] **Aggiungere le firme**: da chiarire di chi (consulente? dirigente?) e dove compaiono nel report.
- [ ] **Dinamiche di ingaggio commerciale**: come si passa dall'autoanalisi al contatto/proposta (invito a un
      colloquio, richiesta di contatto, ecc.), funnel verso i progetti di web marketing.

## Stato al 2026-10-03 (sessione schedulata, 12) — nessuna voce azionabile oggi, tutto in attesa di Andrea o del test Firecrawl di domani

Letto TASKS.md per intero (come richiesto) prima di qualunque modifica. Riepilogo per la prossima
sessione, per non dover ripetere la stessa analisi:

- [x] **Criteri blog/contenuti e newsletter (sezione "Da fare" nn. 1 e 2)**: ri-confermati completi,
      agganciati al wizard e già in produzione (vedi sessione "notte, 11" subito sotto, che aveva
      fatto la stessa verifica poche ore prima). Nessuna modifica di codice necessaria.
- **Controllato se esisteva un'altra voce azionabile senza il contributo di Andrea — nessuna
  trovata**:
  - Voce 0 (bug sessione in-memory): Andrea ha già deciso di lasciare com'è, non riaprire.
  - Voce 3 (andamento social 3 mesi): la voce stessa chiede di confermare con Andrea il livello di
    automazione prima di implementare — non deciso.
  - Voce 4 (verifica E2E aiuto AI Gemini): è un test manuale sul wizard live, non una modifica di
    codice; richiede comunque di navigare `autoanalisi-scuole.vercel.app`, storicamente bloccato dai
    limiti di rete di questa sandbox (vedi note nelle sessioni precedenti) — non ritentato per non
    consumare budget su un tentativo già visto fallire più volte.
  - Voce 5 (resto, dopo i ritocchi già fatti nella sessione "notte, 11"): tutti i punti rimasti
    (box "dato peggiore", accorpamento passaggi 4+5, checkbox canale trovato, numerazione punto 7,
    multi-plessi GBP, riferimenti screenshot) sono esplicitamente segnati come da chiarire con
    Andrea o legati al lavoro Firecrawl non ancora fatto — nessuno è una scelta implementativa
    semplice che si possa prendere da soli senza rischiare di andare contro l'intento di Andrea.
  - **PROSSIMO TASK (Firecrawl sui social)**: la spec del comportamento è precisa e non ambigua, ma
    Andrea ha esplicitamente strutturato il lavoro come "test prima, poi si decide se implementare"
    (il test è programmato per domani 2026-10-04, quando si ripristinano i crediti gratuiti —
    oggi è ancora il 2026-10-03). Scrivere già il codice Firecrawl oggi vorrebbe dire anticipare una
    decisione che Andrea ha chiesto di prendere solo dopo aver visto l'esito del test — non fatto,
    di proposito, per non rischiare lavoro da buttare se il test di domani dovesse concludere
    "niente bottone AI".
  - **5 nuove voci in cima al file** ("Domande al dirigente", punteggi, report finale, firme,
    ingaggio commerciale): il file stesso dice che vanno affrontate "dopo il test Firecrawl sui
    social (2026-10-04)" e che per ognuna serve prima un confronto con Andrea — non affrontate.
- [x] **Verificato comunque lo stato di salute del codice** (nessuna modifica, solo controllo):
      `npm install` (mancavano le `node_modules` in questa sessione) poi `npm test` → 70/70 test
      unitari verdi, `node -e "require('./server.js')"` pulito, `git fetch origin main` confrontato
      con l'HEAD locale → nessuna sessione concorrente, nessun deploy necessario.
- **Nessun codice modificato, nessun deploy fatto in questa sessione** — solo questo aggiornamento di
  TASKS.md, commit e push. La prossima sessione (schedulata o con Andrea) può ripartire da qui senza
  dover rileggere tutto da capo: il vero blocco oggi non è la mancanza di idee ma la mancanza di un
  confronto con Andrea su più punti contemporaneamente (voce 3, resto voce 5, le 5 nuove voci) e
  l'attesa del test Firecrawl di domani.

## Stato al 2026-10-03 (sessione schedulata, notte, 11) — verifica criteri blog/newsletter + ritocchi punto 5

Sessione schedulata: letto TASKS.md per intero prima di iniziare, come richiesto.

- [x] **Criteri "Aggiornamento contenuti/Blog" e "Newsletter" (sezione "Da fare" nn. 1 e 2)**:
      ri-letti per intero — risultano GIÀ completamente implementati, agganciati al wizard e
      deployati (vedi le rispettive sezioni più sotto in questo file, tutte le voci spuntate).
      Nessuna modifica di codice necessaria qui. Restano solo le note non bloccanti già segnate
      ("arricchire `ESP_NOTI`", verifica su sito reale lazolla.it) — non azionabili senza un caso
      reale nuovo da incontrare.
- [ ] **Voce n. 0 (BUG PRIORITARIO, sessione in-memory)**: valutata, non affrontata. Controllato
      via MCP Vercel (`filter_project_envs`) che il progetto NON ha oggi nessuno storage persistente
      collegato (nessuna env var KV/Redis/Blob) — attivare Vercel KV (o equivalente) richiede
      provisioning di una nuova risorsa, potenzialmente a pagamento: **da confermare con Andrea
      prima di procedere**, come la nota originale del backlog chiede esplicitamente. L'alternativa
      "cookie/URL firmato" indicata come workaround non è praticabile: la sessione contiene l'HTML
      grezzo delle pagine scaricate (`pagineHtml`), ben oltre il limite di ~4KB per cookie. Nessuna
      azione di codice fatta: in attesa della decisione di Andrea su quale storage attivare.
- [x] **Voce n. 5 (revisione testi/UX), sottoinsieme non ambiguo implementato** (il resto della voce
      resta aperto, vedi sotto): per restare in un incremento piccolo e sicuro, scelti solo i punti
      con testo/richiesta inequivocabile, verificabili senza dover rileggere la numerazione con
      Andrea (la voce stessa segnala "manca il punto 7, verificare con Andrea" — non toccata la
      parte ambigua):
  - **1) Landing**: titolo cambiato in "La tua scuola c'è?" + "(sul web)" a capo (`<br>`); bottone
        "Avvia l'analisi →" → "Iniziamo" (`views/landing.ejs`).
  - **6) Altri canali**: checkbox di fianco a YouTube rimosso (ora un campo nascosto, YouTube è
        sempre incluso quando trovato — nessuna modifica lato server, stesso `name="includiYoutube"`
        con lo stesso valore); titolo "Aggiungi un altro canale" → "Aggiungi un altro canale social
        non trovato sul sito" (`views/social-altri.ejs`).
  - **6) Scheda GBP**: rimosso "(stimato)" di fianco allo stato "probabilmente gestita/non gestita"
        (`views/social-analisi.ejs`). **Non toccata** l'estensione multi-plessi (più schede GBP
        selezionabili): è una feature più ampia (`lib/social/gbp.js` oggi ritorna un solo candidato),
        da pianificare separatamente.
  - **5) Select fasce (like/follower/frequenza)**: rimosse le etichette qualitative "(buono)",
        "(sufficiente)", "(insufficiente)" e sostituite con i simboli matematici richiesti (≥, ≤, >,
        <, intervallo "–"), in ENTRAMBE le schermate che usano queste select — "Canali social
        indicati sul sito" (`views/social-conferma.ejs`, la richiesta esplicita della voce 5) e
        "Altri canali" (`views/social-altri.ejs`, stessa select duplicata via JS per i canali
        aggiunti a mano) — per non lasciare le due schermate con stile incoerente. Nessuna modifica ai
        `value` delle `<option>` (`alta`/`media`/`bassa`), quindi nessun impatto sulla logica
        server/JS esistente (soglie, precompilazione AI).
  - **8) Analisi social finale**: rimossa la voce "Post della scheda Community: non verificabile..."
        (`y.notaCommunity`, tolto sia il campo da `lib/social/youtube-analysis.js` che il paragrafo in
        `views/social-analisi.ejs`, nessun test la referenziava). Messaggio tecnico "Il canale ha
        risposto con codice ..." (per un social generico senza alcun valore indicato/rilevato)
        sostituito con "Non sono state fornite o trovate indicazioni." — rimossa la costruzione del
        messaggio tecnico in `lib/social.js` (`analizzaCanaleGenerico`, variabile `motivoErrore`
        eliminata) e aggiornato il testo di fallback in `views/social-analisi.ejs`.
  - **Non toccato, voce 5 (serve conferma/chiarimento con Andrea)**: punto 2 (box "dato peggiore" —
        ambiguo ora che l'indicatore "ultimo contenuto pubblicato" è già stato rimosso il 2026-10-02,
        quindi non è chiaro se la richiesta valga ancora per lo stato attuale della card); punto 3
        parte "accorpare passaggio 4+5" (ristrutturazione di schermate, non una modifica di testo);
        checkbox di fianco al canale TROVATO sul sito in `views/social-conferma.ejs` (a differenza del
        checkbox YouTube, qui il testo introduttivo della schermata invita esplicitamente l'utente a
        "escludere quelli sbagliati" tramite quel checkbox — rimuoverlo senza un meccanismo
        sostitutivo toglierebbe una funzione, non solo un dettaglio estetico); ~~riferimenti allo
        screenshot nel testo di `social-conferma.ejs`/`social-altri.ejs` (intrecciati con il flusso
        AI/upload che il "PROSSIMO TASK" Firecrawl prevede di riscrivere comunque, test previsto per
        il 2026-10-04 — modificarli ora rischia di essere lavoro buttato)~~ **RISOLTO il 2026-10-04**:
        il flusso AI/upload (bottone e relativi riferimenti a screenshot) è stato rimosso del tutto,
        vedi "Stato al 2026-10-04" in cima al file; numerazione mancante
        (punto 7) e caso multi-plessi GBP (feature più ampia) restano aperti.
      **Nota**: il punto 4 "quando l'utente aggiunge una competenza personalizzata... il sistema deve
      costruire delle varianti di query" risultava GIÀ implementato (vedi "Stato al 2026-10-03
      (notte, 3)" più sotto in questo file) — nessuna azione necessaria lì.
- [x] **Verificato prima di ogni modifica/dopo**: 70 test unitari esistenti verdi (nessuno nuovo,
      nessuna logica toccata, solo testo/markup), `require('./server.js')` pulito, e rendering EJS
      con `ejs.renderFile` di tutte le view toccate (`landing`, `social-conferma`, `social-altri`,
      `social-analisi`) su più combinazioni di dati (con/senza canali trovati, YouTube presente/
      assente, GBP nei vari stati, canale generico non disponibile) per confermare l'assenza di
      errori EJS e la presenza dei nuovi testi/assenza dei vecchi.
- Non toccate in questa sessione: voce n. 3 (andamento social 3 mesi — richiede conferma di Andrea
  sul livello di automazione, come già segnalato) e voce n. 4 (verifica end-to-end aiuto AI Gemini in
  produzione — richiede navigare il wizard live, storicamente bloccato per limiti di rete della
  sandbox verso `vercel.app`).
- [x] **Commit, push e deploy**: commit `25b7e04`, push su `main` senza conflitti (confrontato con
      `git fetch origin main` prima del commit, nessuna sessione concorrente). Deploy automatico via
      Git integration: `dpl_FniGB5ANEV4RebDEv29nn1GhE7nB`, `READY` in ~15s. **Promosso in
      produzione**: `list_aliases` subito prima del cambio confermava ancora il deployment noto
      (`dpl_FyKkubWkF6jd7eyP4AcsosVEDBW7`, commit `29e0dab` — nessuna modifica concorrente nel
      frattempo, inclusa la promozione del commit `2cfab46` solo-TASKS.md, già incluso come
      antenato del nuovo deploy), poi `assign_alias` su `autoanalisi-scuole.vercel.app`
      (`oldDeploymentId` di ritorno uguale a quanto atteso) e verificato stabile con un secondo
      `list_aliases`. Alias di fallback `-osky2` lasciato intatto (ancora redirect permanente verso
      l'alias primario). **Non è stato possibile un controllo HTTP diretto dal vivo** (stesso limite
      di rete delle sessioni precedenti: `WebFetch` su `autoanalisi-scuole.vercel.app` ha restituito
      `PROVENANCE_REQUIRED` — richiede l'approvazione di un utente presente, assente in questa
      sessione schedulata) — verifica basata su `readyState: READY`, sui 70 test locali, sul
      rendering EJS di tutte le view toccate con `ejs.renderFile`, e su `require('./server.js')`
      pulito prima del push.

## Stato al 2026-10-03 (notte, 10) — nota in fondo al passaggio 5

`views/posizionamento.ejs`: la nota "il controllo interroga direttamente Google, senza una API ufficiale..." (superata,
ora si usa Serper) è sostituita da "Posizioni rilevate nella prima pagina di Google (primi 10 risultati). Trattale come
un'indicazione: i risultati possono variare da una ricerca all'altra e da una zona all'altra." Scelta di Andrea: NON
accennare alla località, per non spingere l'utente a chiedere nuove ricerche (ogni ricerca costa un credito Serper).
Decisione: si resta su Serper (migliore rapporto costo/semplicità). Discrepanza su suoremantellate.org ancora aperta:
da verificare con altre scuole (3-4 indirizzi di cui Andrea conosce la posizione reale).

## Stato al 2026-10-03 (notte, 9) — lettura di fino a 10 pagine in più + riquadro AI social

Richiesta di Andrea: scaricare le pagine dedicate per verificare le competenze (max 10), partendo dalla sitemap.
- [x] **`lib/pages.js` (`raccogliPagineExtra`, `scegliPagineExtra`)**: dopo home + max 4 pagine generiche si leggono
      fino a **10 pagine in più** (home esclusa). Ordine: (1) sitemap (`/sitemap.xml`, poi `robots.txt`, poi
      `wp-sitemap.xml`/`sitemap_index.xml`; le sotto-sitemap "page" vengono lette per prime) — se manca, i link della home;
      (2) se ci sono pagine **specifiche** (indirizzo con una parola chiave di una competenza, es.
      `/certificazioni-linguistiche/`, esclusi articoli datati/di news) si leggono quelle; (3) altrimenti le **pagine
      statiche** (max 2 livelli di profondità) e gli **ultimi 5 articoli** per data della sitemap. Scartati file, feed,
      tag, categorie, privacy/cookie/login. Pagine non raggiungibili ignorate; un errore non blocca l'audit.
- [x] `lib/temi.js`: nuova `temiDaIndirizzo(url)` (quali temi compaiono nell'indirizzo). `lib/sitemap.js`: ricerca
      della sitemap anche da robots.txt (prima solo /sitemap.xml).
- [x] `lib/runAudit.js`: le pagine extra finiscono solo in `pagineHtml`/`pagineUrl` (rilevamento temi, newsletter, social,
      località); il **punteggio tecnico resta su home + generiche**. `audit.pagineExtra = {lette, tipo, daSitemap}`.
- [x] Passaggio 6: il riquadro "Chiedo l'aiuto dell'AI" non compare se non ci sono canali trovati.
      Passaggio 7: lo stesso riquadro compare (nascosto all'inizio) solo dopo aver aggiunto almeno un canale
      e agisce sui canali aggiunti (rotta esistente `/social/:id/ai-aiuto`). Da rivedere con il test Firecrawl del 2026-10-04.
- Costo: nessun credito API; fino a 10 richieste HTTP in parallelo al sito della scuola (timeout 7s) + sitemap/robots.
      70 test verdi (nuovo `lib/pages.test.js`).

## Stato al 2026-10-03 (notte, 8) — testo passaggio 6 quando non ci sono canali social

`views/social-conferma.ejs`: la frase "Non abbiamo trovato link a canali social (esclusi YouTube e Google Business
Profile...) nelle pagine analizzate." è ora "Non abbiamo trovato link a canali social, nel prossimo passaggio potrai
segnalarli manualmente." (richiesta di Andrea).

## Stato al 2026-10-03 (notte, 7) — link "vedi pagina" delle competenze: ora porta alla pagina dedicata

Caso segnalato da Andrea su suoremantellate.org: "lingue" e "tecnologia/coding" risultavano trovate ma il link portava
a home/news, mentre esistono pagine dedicate (`/certificazioni-linguistiche/` ecc.).
**Causa**: `estraiTemi()` usava come link la PRIMA pagina scaricata in cui compariva una parola chiave (home o notizie,
dove il testo del menu/delle news contiene i termini). Inoltre l'audit scarica solo home + max 4 pagine "tipo"
(chi-siamo/iscrizioni/contatti/notizie, `lib/pages.js`), per cui le pagine dedicate non vengono mai lette; qui
"News" punta a `/about/`, riconosciuto come "chi-siamo".
- [x] **`lib/temi.js`**: il link ora è (1) il link interno (testo o indirizzo) che contiene una parola chiave del tema
      — es. la voce di menu "Certificazioni linguistiche" -> `/certificazioni-linguistiche/` — scelto per punteggio
      (testo=2, indirizzo=1), ignorando link esterni e le sigle corte come "pet" (solo parola intera); (2) altrimenti la
      pagina scaricata più specifica (non home/notizie/contatti, poi più occorrenze). 6 nuovi test, 64 verdi.
- [ ] **Limite noto, non risolto**: il rilevamento si basa solo su home + max 4 pagine; non si seguono i link dedicati
      per verificarne il contenuto. Se serve, scaricare anche la pagina dedicata trovata dal link (costo: richieste in più).

## Stato al 2026-10-03 (notte, 6) — "media" tolto da tutte le ricerche su Google

Richiesta di Andrea: le ricerche non devono più contenere "media". Prima `scuola media <tema> <località>`, ora
`scuola <tema> <località>` (es. "scuola coding Milano", "scuola potenziamento cucina Pavia") per TUTTE le ricerche:
generiche, parole chiave del vocabolario e varianti potenziamento/curvatura/indirizzo delle competenze personalizzate.
`queryPerTema()` in `lib/temi.js`, testo introduttivo di `views/posizionamento.ejs` e test aggiornati. 58 test verdi.
Nota: le ricerche senza "media" restituiscono risultati più ampi (anche licei, primarie, ecc.); la posizione si
valuta comunque sul dominio della scuola analizzata.

## Stato al 2026-10-03 (notte, 5) — posizione su Google limitata alla PRIMA PAGINA (num:10)

Richiesta di Andrea: servono solo le posizioni sulla prima pagina di Google (1-10), non 11-30. `lib/serp.js`:
Serper e ripiego su google.com ora chiedono `num: 10` (prima 30). Costo certo di 1 credito Serper per ricerca.
"Presente" = scuola tra i primi 10 risultati; "Assente" = non tra i primi 10. Test aggiornato. (Sostituisce la
nota "Resta `num:30`" della sezione precedente.)

## Stato al 2026-10-03 (notte, 4) — ripristinate le ricerche generiche di musica e ambiente

Correzione richiesta da Andrea: le voci 32 ("scuola media musica canto") e 72 ("scuola media ambiente natura") NON
andavano tolte. Ora `senzaQueryGenerica: true` resta solo su **umanistica** (voce 79 tolta). Ricerche totali: **57**
(lingue 18, musica 8, teatro 6, sport 5, tecnologia 4, ambiente 5, umanistica 5, arte 6). 58 test verdi.

## Stato al 2026-10-03 (notte, 3) — competenze scritte a mano dall'utente: 3 ricerche in più su Google

Richiesta di Andrea: quando l'utente aggiunge competenze sue (testo libero, `key: null`, passaggio 3), oltre alla
ricerca generica si aggiungono `scuola media potenziamento [competenza] [località]`,
`scuola media curvatura [competenza] [località]`, `scuola media indirizzo [competenza] [località]` (con lo spazio
dopo "indirizzo"). Quindi 4 ricerche per ogni competenza personalizzata.

- [x] `queryPerTema()` in `lib/temi.js` (ramo senza chiave) + 2 test aggiornati/aggiunti. 58 test verdi. Non si
      applica ai temi del vocabolario (restano le loro ricerche, vedi sezione precedente).

## Stato al 2026-10-03 (notte, 2) — ricerche su Google ridotte da 99 a 55 (scelta di Andrea)

Andrea ha esaminato l'elenco numerato delle 99 ricerche del passaggio 5 e ne ha tolte 44 per contenere i crediti
Serper (2.500 gratuiti). Restano 55 ricerche sui 8 cluster: lingue 18, musica 7, teatro 6, sport 5, tecnologia 4,
ambiente 4, umanistica 5, arte 6. Con 5 temi confermati si fanno ~25 ricerche invece di ~60.

- [x] **`lib/temi.js`**: per ogni tema `escludiDaSerp: [...]` (parole chiave NON usate nelle ricerche Google) e, per
      musica/ambiente/umanistica, `senzaQueryGenerica: true` (saltata la ricerca generica "scuola media <tema>
      <località>"). Nuova `queryPerTema(tema, localita)`, usata da `server.js` (`/posizionamento/:id/esegui`).
- **ATTENZIONE**: `keywords` NON va ridotto per tagliare le ricerche — serve anche a `estraiTemi()` per riconoscere
      i temi nelle pagine del sito (alcune varianti, es. "certificazione linguistica", sono state aggiunte apposta
      per evitare falsi negativi). Per togliere/rimettere una ricerca modificare solo `escludiDaSerp`.
- [x] `lib/temi.test.js` (5 test: conteggi per cluster, elenchi esatti, keywords di rilevamento intatte). 57 test verdi.
- Non applicati (proposti, non confermati): `num:10` e tetto di 4 ricerche per tema / 6 temi. Resta `num:30`.

## Stato al 2026-10-03 (notte) — posizione su Google via API Serper (con ripiego sulla lettura diretta)

Richiesta di Andrea: usare Serper per le posizioni su Google, perché la lettura diretta di google.com dai server
Vercel viene bloccata ("Non disponibile"). Chiave `SERPER_API_KEY` impostata su Vercel (sensitive, production +
preview) — il valore NON va scritto nel repo (è stata incollata in chiaro in chat: valutare di rigenerarla).

- [x] **`lib/serp.js`**: nuova `cercaConSerper()` (POST `https://google.serper.dev/search`, header `X-API-KEY`,
      body `{q, gl:'it', hl:'it', num:30, autocorrect:false}`, timeout 9s, ordina per `position`, scarta link non
      http e duplicati) e `cercaRisultati()` che prova Serper e, se non configurato/in errore, ripiega sulla
      vecchia `cercaSuGoogle()` (può essere bloccata: in quel caso resta "Non disponibile"). `risultatiQuery[].fonte`
      indica `serper` o `google`.
- [x] **Test**: `lib/serp.test.js` (6 test con risposte finte, nessuna chiamata reale). 52 test verdi.
- [ ] **Da verificare**: crediti consumati da una richiesta con `num` > 10 (non documentato nelle fonti lette: il
      piano gratuito ha 2.500 query). Se consuma 2 crediti, valutare `num:10` + `page` oppure limitare a 20.
- [x] **Verificato dal server Vercel con la chiave reale** (deploy di prova su ramo temporaneo, rotta di debug poi
      rimossa): "La Zolla Milano" -> `fonte: serper`, 7 risultati, lazolla.it in posizione 1. **In produzione** dal
      2026-10-03 (commit `db0dbe5`, `dpl_GfPsjFnSZ8hQQmx1zN7obEbcAotw`, alias promosso).
- [ ] **Da verificare**: confronto posizione Serper vs ricerca manuale su Google per altre scuole (1 solo caso provato).
- [ ] **Pulizia manuale**: il ramo `debug-serper-temp` su GitHub non è cancellabile da questo ambiente (proxy blocca
      la cancellazione di rami); è stato riallineato a `main` (nessuna rotta di debug). Andrea può eliminarlo da GitHub.
- NB: lo strumento di fetch usato nelle sessioni NON mantiene la query string degli URL (una rotta con `?t=...`
      dava 404); passare i parametri nel percorso. Inoltre i percorsi che iniziano con `__` danno 404 su Vercel.

## RISOLTO il 2026-10-04 — passaggio "Canali social": test Firecrawl fatto, esito negativo, bottone AI rimosso

Vedi la sezione "Stato al 2026-10-04" in cima al file per il dettaglio completo (risultato del test,
cosa è stato rimosso/lasciato, verifica, deploy). Riepilogo: Firecrawl rifiuta l'intero dominio sia di
Instagram sia di Facebook (`"we do not support this site"`, non un problema di singolo profilo/crediti/
proxy) — per la regola già scritta qui sotto ("se Firecrawl fallisce → niente bottone AI"), il bottone
"🤖 Chiedo l'aiuto dell'AI" e tutto il flusso di upload screenshot sono stati rimossi; restano solo i menù
a tendina per l'autodichiarazione. Non riaprire questa voce salvo che Andrea non chieda esplicitamente di
valutare un'alternativa (es. Graph API di Meta, solo profili business/creator — non Firecrawl).

**Decisione di Andrea (2026-10-03, per riferimento storico)**: il caricamento di uno screenshot da parte del
dirigente scolastico NON è accettabile (troppo attrito per un'autoanalisi rapida). Nessun riquadro di upload,
in nessun caso. Il bottone "🤖 Chiedo l'aiuto dell'AI" andava ripensato così, provando prima Firecrawl.

<details>
<summary>Comportamento richiesto e piano di test originali (2026-10-03), per riferimento storico — superati dall'esito negativo del test</summary>

### Comportamento richiesto (se il test Firecrawl fosse riuscito — NON è il caso, vedi sopra)
- [x] ~~Il bottone attiva Firecrawl (server-side, in background) sui canali social...~~ non implementato:
      test negativo, vedi sopra.
- [x] ~~Se Firecrawl funziona per un canale: i valori trovati vengono stampati di fianco ai menù...~~ non
      applicabile.
- [x] **Se Firecrawl fallisce per qualsiasi motivo**: compare un messaggio che invita a inserire a mano i
      valori usando i menù a tendina, che restano attivi. NESSUN box di caricamento immagine. — **Questo è
      esattamente il ramo implementato** (Firecrawl fallisce sempre per Instagram/Facebook), semplificato:
      dato che l'esito è sempre lo stesso, non serve più nemmeno il bottone/il tentativo — i menù a tendina
      sono semplicemente sempre attivi fin da subito, senza messaggio di errore intermedio.
- [x] **Rimosso il flusso di upload**: riquadri screenshot, `/social/:id/ai-estrai` e il relativo codice
      client (`mostraLivelloC`, `fileToBase64`, ecc.). `lib/social/extract.js` eliminato (non serviva più);
      `lib/social/ai.js` mantenuto (serve ancora alla valutazione AI complessiva dei canali, indipendente).
- [x] **Dipendenza (chiave Firecrawl)**: rimasta impostata su Vercel (`FIRECRAWL_API_KEY`) ma non più usata
      da nessun codice — non è stata rimossa la env var in sé (non necessario, nessun costo a restare
      impostata e non lo si può comunque fare dal repo). Andrea può rigenerarla/rimuoverla quando vuole,
      visto che non viene più letta da nessuna chiamata.
- [x] ~~Gestire in modo sicuro il fallimento: timeout, un tentativo per canale, ecc.~~ non applicabile,
      non c'è più nessuna chiamata a Firecrawl nel codice.

### Test da fare prima di implementare (fatto il 2026-10-04, crediti Firecrawl gratuiti ripristinati)
- [x] Provati i **social** (NON le posizioni su Google): 5 profili reali di scuole, mix Instagram/Facebook.
- [x] Per ognuno: richiesta con proxy `stealth`/`auto`; annotato che l'intero dominio è bloccato dal
      servizio stesso (non un muro di login sul singolo profilo) — zero crediti consumati, errore
      immediato e identico per tutti.
- [x] **Esito del test = decisione**: Firecrawl fallisce → **niente bottone AI**, implementato (vedi sopra).

</details>

## Stato al 2026-10-03 (ritocco 2) — passaggio 5: 6 query visibili prima di "… altro"

Richiesta di Andrea: mostrare 3-4 query in più prima del troncamento. Scelto 6 (prima 3). Costante
`QUERY_VISIBILI` in `views/posizionamento.ejs` (cambiare solo quella per regolare). Verificato su
mock con 5/6/9 query: toggle solo oltre le 6. 46 test verdi.

## Stato al 2026-10-03 (ritocco) — toggle "… altro" del passaggio 5 sulla stessa riga dell'ultima query

Richiesta di Andrea: il toggle "… altro (N)" deve stare sulla stessa riga dell'ultima query
mostrata, stessa dimensione del testo delle query, "altro" in grassetto e sottolineato (colore
brand invariato).

- [x] **Causa**: `<details>` è un elemento a blocco nei browser, quindi `display:inline` non basta e il
      `<summary>` andava a capo. Inoltre `label { display:block; margin-bottom:6px }` è una regola
      GLOBALE in `layout-top.ejs`: ogni nuova `<label>` in linea va esplicitamente riportata a
      `display:inline; margin:0`.
- [x] **Soluzione** (`views/posizionamento.ejs`, `views/partials/layout-top.ejs`): toggle CSS-only
      con checkbox nascosta + `<label class="altro-toggle">` in linea (id `altro-<idx>` per card),
      nessun JavaScript. Al click la label sparisce e compare l'elenco completo.
- [x] **Verificato** con Chromium headless su mock (6 query) a 390px e 900px: toggle sulla stessa
      riga, 13.12px come le query, peso 700, sottolineato; espansione corretta. 46 test verdi.

## Stato al 2026-10-03 (continuazione) — lista ricerche del passaggio 5 compattata (prime 3 + "… altro")

Andrea ha segnalato che il contatore "di 8" in calce era ancora visibile in produzione (il commit
precedente non era ancora stato promosso in produzione — vedi nota sotto) e ha chiesto che, nel
blocco "Ricerche: ..." del passaggio 5 (Posizionamento Google), si vedano solo le prime 3 query,
con un "… altro (N)" cliccabile che espande l'elenco completo.

- [x] **`views/posizionamento.ejs`**: le prime 3 query restano sempre visibili; se ce ne sono altre,
      vengono racchiuse in un `<details class="query-altro"><summary>… altro (N)</summary>...`,
      espandibile al click — nessun JavaScript necessario, solo HTML/CSS nativi.
- [x] **Stile aggiunto** in `views/partials/layout-top.ejs` (`.query-altro`): il trigger è in linea
      col testo, colore brand, senza il triangolino di default del browser.
- [x] **Verificato**: 46 test unitari verdi, `require('./server.js')` pulito, rendering testato con
      mock su 2/3/5 query per confermare che compaiono sempre e solo le prime 3 fuori dal blocco
      "altro" e che il blocco appare solo quando ce ne sono di più.
- [x] **Deploy PROMOSSO (2026-10-03, sessione successiva con credenziali Vercel aggiornate)**:
      `origin/main` = `dca1cb9` = `dpl_GxqbMF2RZQkumTyfn75KDxfzxz9p` (`READY`, nessuna sessione
      concorrente). `list_aliases` poi `assign_alias` su `autoanalisi-scuole.vercel.app`
      (`oldDeploymentId` = `dpl_3X5kYBAqbdQFphmByoVpFWcwNuYS`, come atteso); alias `-osky2`
      (redirect) non toccato. Verificato: l'URL diretto del deployment mostra "Passaggio 1 di 10"
      (WebFetch sull'alias ha mostrato ancora "di 8" per la cache di 15 min, falso negativo).
      Nota storica qui sotto, descrive il blocco ormai risolto:
- [ ] ~~**Deploy in sospeso**~~ (RISOLTO, vedi sopra): in questa sessione l'accesso al progetto Vercel via MCP risultava
      bloccato (403/404 su `list_projects`/`get_deployment`/`get_project`, nonostante il team "OSKY"
      fosse visibile) — probabile scope insufficiente della connessione. Andrea ha riautorizzato la
      connessione da Vercel, ma questa sessione continuava a usare le credenziali precedenti (stesso
      comportamento anche dopo `RefreshMcpTools`): serve una **nuova conversazione** perché la
      sessione prenda le credenziali aggiornate. **Commit `a5c8b96` risultava pushato su GitHub ma
      NON ancora promosso in produzione** (verificato via `WebFetch`: il footer live mostrava ancora
      "Passaggio 1 di 8"). Il commit di questa sessione (contatore "di 10" + ottimizzazione 3
      articoli + lista query compattata) va quindi promosso in produzione appena l'accesso Vercel è
      ripristinato — fino ad allora resta solo su GitHub, non live.

## Stato al 2026-10-03 — contatore passaggi fisso a "di 8" corretto a "di 10" + ottimizzazione articoli estesa agli ultimi 3

Andrea ha segnalato che il footer del wizard mostrava "Passaggio N di 8" anche quando N arrivava a
9 o 10 (es. "Passaggio 9 di 8"), e che il criterio di ottimizzazione nel passaggio 9 (Attività
editoriale) va verificato sugli ultimi 3 articoli pubblicati, non solo sull'ultimo.

- [x] **Bug "di 8" risolto**: `views/partials/layout-bottom.ejs` aveva il totale hardcoded a 8
      invece di 10 (lo stepper visuale in `layout-top.ejs` era già corretto a 10 span). Il wizard
      ha sempre avuto 10 passaggi: non era un bug di navigazione, solo un numero sbagliato nel testo.
- [x] **Ottimizzazione estesa agli ultimi 3 articoli** (`lib/contenuti.js`):
  - Nuova `trovaUrlUltimiArticoli(articoli, n=3)` (accanto alla precedente
    `trovaUrlArticoloPiuRecente`, mantenuta per compatibilità/test ma non più usata da `server.js`).
  - Nuova `aggregaOttimizzazione(risultatiArticoli)`: giudizio complessivo cautelativo basato sul
    caso peggiore — "scarsa" se almeno un articolo tra gli ultimi è scarso, "buona" solo se tutti
    sono buoni, altrimenti "parziale". Evita che un articolo scritto male venga "annacquato" nella
    media.
  - `server.js` (`GET /contenuti/:id/esegui`): recupera e analizza fino a 3 articoli (non più solo
    il più recente), aggrega il giudizio, e passa anche l'elenco dettagliato per articolo alla vista.
  - `views/contenuti.ejs`: la card "Ottimizzazione" mostra ora il giudizio aggregato (con conteggio
    articoli analizzati) seguito dal dettaglio per singolo articolo (link, metadescription, link
    interni/esterni, immagini senza alt, pill individuale).
- [x] **Verificato**: 46 test unitari verdi (5 nuovi: `trovaUrlUltimiArticoli` ×2,
      `aggregaOttimizzazione` ×3), `require('./server.js')` pulito, rendering di `contenuti.ejs`
      testato su 4 casi (nessuna sezione, ottimizzazione non disponibile, 1 articolo, 3 articoli di
      qualità mista) senza errori EJS.
- [x] **Commit, push e deploy** su `https://autoanalisi-scuole.vercel.app` con il consueto flusso
      git-push → attesa `READY` → `list_aliases` → `assign_alias`.

## Stato al 2026-10-02 (sessione Andrea, tardo) — passaggio 5 "Posizionamento Google": bullet semplificato a Presente/Assente

Richiesta di Andrea: nel passaggio 5, la valutazione nel bullet deve essere binaria — "Assente"
(rosso) se negativa, "Presente" (verde) se positiva — con il testo esplicativo ("Non ci sono
risultati...", "Trovato in posizione...", ecc.) spostato sotto al bullet, seguito dal blocco delle
ricerche testate su Google.

- [x] **`views/posizionamento.ejs`**: il bullet ora mostra solo il pill Presente/Assente; la
      spiegazione testuale e il blocco "Ricerche: ..." sono stati spostati sotto, in quell'ordine.
- [x] **Verificato**: 41 test unitari verdi, rendering testato su mock data per tutti i rami
      logici (trovato, non trovato con risultati analizzati, non disponibile/bloccato da Google).
- [x] **Commit `18ace3e`, deploy `dpl_3X5kYBAqbdQFphmByoVpFWcwNuYS`**, promosso in produzione e
      verificato dal vivo su `https://autoanalisi-scuole.vercel.app`.

## Stato al 2026-10-02 (continuazione) — domande Nurturing spostate dal passaggio 3 a schermate dedicate prima degli step 9/10

Andrea ha segnalato che le due domande dichiarative Nurturing (piano editoriale/cadenza e
importanza della newsletter) non dovevano stare nel passaggio 3 (dichiarazione competenze), dove
erano scollegate dal contesto a cui si riferiscono. Scelto (tra le opzioni proposte): dividerle,
ciascuna in una schermata dedicata subito prima del passaggio che la confronta col dato verificato.

- [x] **Rimossa la card "Blog e newsletter" da `views/dichiarazione.ejs`** (passaggio 3) e la
      relativa lettura in `POST /dichiarazione/:id` (`server.js`).
- [x] **Nuova schermata "Avete un piano editoriale...?"** subito prima del passaggio 9 (Attività
      editoriale): `GET`/`POST /contenuti/:id/cadenza` (nuova vista `views/contenuti-cadenza.ejs`).
      Sotto-schermata del passaggio 9 (stesso pattern già usato per `/posizionamento/:id/localita`,
      sotto-schermata del passaggio 5) — lo stepper resta a 10 passaggi, nessuna rinumerazione.
- [x] **Nuova schermata "Considerate la newsletter uno strumento importante?"** subito prima del
      passaggio 10 (Newsletter): `GET`/`POST /newsletter/:id/importanza` (nuova vista
      `views/newsletter-importanza.ejs`), stesso pattern.
- [x] **Nuovi flag di sessione** `cadenzaRichiesta`/`newsletterRichiesta` per distinguere "domanda
      non ancora fatta" (redirect alla nuova schermata) da "fatta ma senza risposta" (valore resta
      `null`, nessun confronto mostrato — comportamento identico a prima, solo il momento in cui
      viene chiesto è cambiato).
- [x] **Verificato**: 41 test unitari verdi, `require('./server.js')` pulito, test end-to-end con
      il vero server Express su una sessione simulata (tutti i nuovi redirect, salvataggio delle
      risposte, prosecuzione corretta del wizard dopo ciascuna domanda).
- [x] **Commit, push e deploy**: commit `b89c065`, deploy automatico via Git
      (`dpl_4mKc3hyYserNKowzGG4VuHBYRZa5`, `READY`), promosso in produzione con il consueto
      controllo `list_aliases` prima di `assign_alias`. **Verificato dal vivo** su
      `https://autoanalisi-scuole.vercel.app/`: landing page funzionante.

## Stato al 2026-10-02 (sessione più recente) — rimozione indicatore "Ultimo contenuto pubblicato" dall'audit tecnico + RISOLTO il blocco deploy collegando Git

Andrea ha chiesto di rimuovere l'indicatore "Ultimo contenuto pubblicato" dallo step 2 (audit
tecnico) perché si sovrappone col criterio Nurturing dedicato "Attività editoriale" (step 9,
`lib/contenuti.js`), che fa la stessa verifica in modo più completo (frequenza, ottimizzazione,
relazione con le competenze).

- [x] **Codice modificato e verificato in locale**: rimossi `scoreRecency()` e l'indicatore
      `ultimo_contenuto` da `lib/score.js`, il calcolo `lastDateFound` da `lib/runAudit.js`,
      `extractDates()`/`MONTHS_IT` e il campo `lastDateFound` da `lib/analyzePage.js` (dead code,
      nessun altro riferimento residuo — verificato con grep), e la menzione nel testo introduttivo
      di `views/audit.ejs`. 41/41 test unitari verdi, `require('./server.js')` pulito, test diretto
      di `computeSiteScore` con dati finti: ora restituisce solo i 7 indicatori rimanenti, logica di
      punteggio/peggiore-indicatore ancora corretta.
- [x] **Commit e push**: `8ae4296`.
- [x] **Blocco deploy RISOLTO collegando il repo GitHub al progetto Vercel** (fatto da Andrea stesso
      dalla dashboard, `Settings → Git`). Dopo 4 tentativi falliti nella giornata (vedi dettaglio
      sotto) tutti con `mcp__Vercel__create_deployment` (deploy "by file list", senza integrazione
      Git) — inclusi un redeploy fatto da Andrea stesso dalla dashboard con lo stesso identico
      errore — collegare Git e far partire un deploy con un push (`git push origin main`, commit
      `fe0a1a0`) ha funzionato subito (`dpl_HAwzMjXZLq2TRetaeQaexsBnwqc4`, `READY` in pochi secondi,
      `source: "git"`). Il deploy via Git usa evidentemente una pipeline di build diversa da quella
      "by file list" che falliva — non è stato possibile capire la causa esatta del bug originale
      (niente log di build recuperabili, vedi sotto), ma collegando Git il problema non si è più
      presentato. **Promosso in produzione**: `list_aliases` prima del cambio confermava ancora
      `dpl_GCZGHfWoVA9sXQpPeY3mbRYrTnjs` (nessuna modifica concorrente), poi `assign_alias` sul nuovo
      deployment (`oldDeploymentId` di ritorno confermato uguale a quanto atteso). **Verificato dal
      vivo** su `https://autoanalisi-scuole.vercel.app/`: pagina di landing funzionante, form
      presente, nessun errore.
- **IMPORTANTE per le prossime sessioni**: questo progetto ORA È collegato a GitHub
      (`osky73/autovalutazione-scuole`, branch `main`). Da qui in avanti un deploy si fa
      semplicemente con `git push origin main` (dopo il consueto `git fetch`/confronto per sessioni
      concorrenti) — Vercel builda in automatico al push. **NON è più necessario** (anzi, è da
      evitare, visto che il meccanismo "by file list" ha mostrato questo bug) usare
      `mcp__Vercel__create_deployment` con l'elenco manuale di `{file, sha}` — la sezione "Come
      deployare" sotto è OBSOLETA e sarà da riscrivere, lasciata per ora come riferimento storico/di
      debug.
      **ATTENZIONE — l'alias primario `autoanalisi-scuole.vercel.app` NON si aggiorna da solo dopo
      un push** (verificato con un secondo push di prova subito dopo il primo: il nuovo deployment è
      arrivato `READY` ma l'alias primario è rimasto sul deployment precedente, bisogna ancora
      promuoverlo manualmente). **Resta quindi necessario, dopo ogni push**: 1) aspettare `READY` con
      `mcp__Vercel__get_deployment` (o `list_deployments` per trovare l'id del deployment appena
      creato dal push — compare con `meta.githubCommitSha` uguale al commit appena pushato), 2) il
      consueto controllo `list_aliases` prima di promuovere (per le sessioni concorrenti), 3)
      `mcp__Vercel__assign_alias` sul nuovo deployment per `autoanalisi-scuole.vercel.app`. Il secondo
      alias di fallback (`-osky2`, redirect permanente) NON viene toccato dal deploy via Git,
      verificato — resta quindi valida la regola di non toccarlo mai.

### Dettaglio del blocco deploy (per la prossima sessione)

Ogni tentativo di `mcp__Vercel__create_deployment` su questo progetto falliva con lo stesso errore:
```
{"errorCode": "type_error", "errorMessage": "Cannot read properties of undefined (reading 'fsPath')", "errorStep": "buildStep"}
```
**Prova decisiva che NON è un problema di codice**: un deployment con i file passati per SHA1
ESATTAMENTE IDENTICI (stesso hash, stessa dimensione) all'attuale deployment di produzione
funzionante (`dpl_GCZGHfWoVA9sXQpPeY3mbRYrTnjs`, nessuna modifica, nessun file nuovo o cambiato) ha
fallito con lo stesso identico errore. Se persino un "re-deploy" byte-per-byte di ciò che è già
`READY` in produzione fallisce, la causa è nell'infrastruttura di build di Vercel per questo
progetto in questo momento, non nei file. Provato anche: con/senza `skipAutoDetectionConfirmation`,
con/senza `forceNew`, con `target: "production"` e senza — stesso errore in tutti i casi (5
tentativi consecutivi, tutti falliti identicamente, nessuno mai arrivato a `READY` né promosso).
`mcp__Vercel__list_deployment_events` (per i log di build dettagliati) ha risposto sempre `404
Deployment not found` per ogni deployment fallito, con varie combinazioni di `teamId`/`slug`/
`builds` — non è stato possibile ottenere il log di build reale per capire la causa esatta lato
Vercel.

**Nessun rischio per la produzione**: nessuno dei deployment falliti è mai arrivato a uno stato
diverso da `ERROR`, quindi `assign_alias` non è mai stato chiamato e l'alias primario
`autoanalisi-scuole.vercel.app` è rimasto, verificato via `list_aliases`, puntato su
`dpl_GCZGHfWoVA9sXQpPeY3mbRYrTnjs` per tutta la sessione.

# Backlog — autoanalisi-scuole

Questo file è la fonte di verità per il lavoro pianificato su questa app. Ogni sessione (anche quelle
schedulate automaticamente al mattino/pomeriggio) deve leggerlo per intero prima di iniziare, e
aggiornarlo (spuntando le voci fatte, annotando decisioni prese) prima di terminare.

Repo: https://github.com/osky73/autovalutazione-scuole (branch `main`)
Produzione (URL unico, usare solo questo): https://autoanalisi-scuole.vercel.app

C'è UN SOLO progetto Vercel (`autoanalisi-scuole`, id `prj_KT0BW5NzV1EeV8MPLdbhxOcIxDaJ`). Vercel
assegna automaticamente a ogni progetto team anche un secondo alias di fallback nel formato
`<progetto>-<team>.vercel.app` (qui: `autoanalisi-scuole-osky2.vercel.app`) che non è cancellabile
via API — non è un secondo ambiente di deploy, è solo un alias tecnico. Il 2026-09-29 questo alias
è stato impostato in redirect 307 permanente verso `autoanalisi-scuole.vercel.app`
(`mcp__Vercel__assign_alias` con `redirect` invece di puntarlo a un deployment), così esiste
un'unica area utilizzabile. **Non richiamare `assign_alias` su `autoanalisi-scuole-osky2.vercel.app`
puntandolo a un deployment nei prossimi deploy**: il redirect è permanente e non va toccato/rifatto
a ogni deploy, va lasciato così com'è.

## Stato al 2026-10-02 (sessione Andrea) — 3 ritocchi schermata 7/posizionamento + terzo incidente alias (stavolta causato da questa sessione, risolto da una sessione concorrente)

Andrea ha chiesto tre ritocchi puntuali:
- [x] **Box Google Business Profile minimizzato nello step 7** (`views/social-altri.ejs`): ora
      mostra solo nome scuola, pill di stato (senza dettaglio righe/finding, che restano nello step
      8 "Analisi dei canali social", dove erano già duplicati — coerente con un punto già aperto nel
      backlog), indirizzo e link Maps, più la nota "Il dettaglio completo è nella schermata
      successiva."
- [x] **Stile uniforme dei `<select>` fasce (like/follower/frequenza) ripristinato**: il fix
      precedente impostava `font-size` solo sul contenitore `.fascia-row`, che NON si propaga agli
      elementi di form (`<select>`/`<input>` usano il font di default del browser a meno di una
      regola propria) — per questo "si era perso". Aggiunta la regola `.fascia-select { font-size:
      0.82rem; ... }` direttamente sul select in `views/social-conferma.ejs` e `views/social-altri.ejs`.
- [x] **Testo risultato "Non disponibile" nella card Posizionamento** (`views/posizionamento.ejs`):
      da "Google non raggiungibile per nessuna ricerca del cluster" a "Non ci sono risultati nella
      prima pagina per queste ricerche." (più comprensibile per chi legge il report).

Verificato con rendering EJS locale su più stati e dal vivo su un deployment preview (screenshot
GBP minimizzato, zoom sul font dei select, testo nuovo nei risultati di posizionamento) prima della
promozione in produzione.

### Terzo incidente alias della stessa giornata (stavolta causato da questa sessione)

Mentre questa sessione verificava dal vivo i 3 ritocchi sopra (richiesto più tempo del solito per
intoppi di automazione browser), una sessione concorrente (`session_01DokqS5HHH8zwqbMqpW9hxx`,
lavoro "Nurturing" documentato nella sezione sotto) ha completato e promosso il proprio deployment
in produzione. La chiamata `assign_alias` di questa sessione, fatta subito dopo senza un secondo
controllo, ha sovrascritto quell'alias puntandolo al deployment con solo i 3 ritocchi di questa
sessione — **perdendo temporaneamente in produzione le domande dichiarative Nurturing** per i
~15-20 minuti successivi. La sessione concorrente ha rilevato la cosa (via il controllo
`list_aliases` di prassi) e ha ripristinato l'alias sul proprio deployment più recente
(`dpl_GCZGHfWoVA9sXQpPeY3mbRYrTnjs`), che — essendo stato costruito sul commit `2398f9f` di questa
sessione — conteneva GIÀ tutti e 3 i ritocchi richiesti da Andrea insieme al lavoro Nurturing.
**Verificato in questa sessione** (confronto SHA1 di tutti i file locali vs `list_deployment_files`
di `dpl_GCZGHfWoVA9sXQpPeY3mbRYrTnjs`): hash identici su tutti i file, incluse le 3 view toccate da
Andrea — nessun nuovo deploy necessario, produzione già corretta e completa. Confermato anche con
un controllo dal vivo della home page.

**Causa di fondo (terza volta nella stessa giornata) e correzione di processo per le prossime
sessioni**: il rischio non è solo tra "calcolo SHA" e "creo il deployment" (prima lezione) ma
anche tra "finisco la verifica dal vivo" e "chiamo `assign_alias`" — una verifica live che richiede
tempo (minuti) lascia una finestra ampia per un deploy concorrente. **Da questa sessione in avanti:
richiamare sempre `list_aliases` immediatamente prima di ogni `assign_alias`** e, se il
`deploymentId` puntato dall'alias primario è cambiato rispetto a quello noto all'inizio della
sessione, fermarsi e confrontare gli SHA1 prima di sovrascrivere — esattamente come fatto qui.
Vale la pena, come già notato dalla sessione concorrente, indagare se più esecuzioni dello stesso
trigger schedulato partono in parallelo senza coordinamento.

## Stato al 2026-10-02 (sessione successiva) — domande dichiarative "Nurturing" + secondo incidente alias risolto

Lavoro su questa sessione (schedulata), seguendo l'ordine del backlog (blog/contenuti poi
newsletter): entrambi i criteri erano già implementati/agganciati/deployati (vedi sezioni sotto),
restava solo la parte dichiarativa esplicitamente segnata come "ancora da fare" in entrambi i
punti 1 e 2. Implementata in questa sessione:

- [x] **Due nuove domande nel passaggio di dichiarazione competenze (step 3)**, aggiunte come
      card aggiuntiva in `views/dichiarazione.ejs` (nessun nuovo step nello stepper, per non
      rinumerare tutto il wizard — scelta più semplice, coerente con la nota del backlog che
      suggeriva "prima o dopo lo step dichiarazione competenze"):
      - "Avete un piano editoriale per il sito? Con quale cadenza pensate di pubblicare?" (select:
        nessun piano/settimanale/quindicinale/mensile/trimestrale).
      - "Considerate la newsletter uno strumento importante?" (Sì/No, non obbligatoria).
      Risposte salvate in sessione (`sessione.cadenzaDichiarata`, `sessione.newsletterImportante`)
      nella route `POST /dichiarazione/:id` di `server.js`.
- [x] **Criterio blog/contenuti — STEP 5 della spec (confronto cadenza) finalmente popolato**: il
      giudizio (`giudicaContenuti`) veniva calcolato in `runAudit.js` allo step 2, PRIMA che la
      cadenza dichiarata fosse disponibile (arriva solo al passaggio 3) — per questo
      `divergenzaCadenza` era sempre `null`, nonostante la vista (`views/contenuti.ejs`) avesse
      già il box pronto. **Fix minimo**: invece di toccare `runAudit.js` (che gira troppo presto
      nel wizard), la route `GET /contenuti/:id/esegui` (passaggio 9, che gira DOPO la
      dichiarazione) ora RICALCOLA il giudizio chiamando `giudicaContenuti(raccolta, {
      cadenzaDichiarata: sessione.cadenzaDichiarata })` invece di riusare il valore stantio di
      `sessione.audit.contenuti` — operazione sincrona ed economica, nessun nuovo fetch. Il box di
      divergenza in `views/contenuti.ejs` ora compare correttamente quando pertinente.
- [x] **Criterio newsletter — segnalazione discrepanza dichiarato/verificato** (menzionata dalla
      spec ma non ancora implementata): nuova card "finding" in `views/newsletter.ejs`, mostrata
      quando `sessione.newsletterImportante === true` ma il criterio risulta "assente"
      (calcolato in `GET /newsletter/:id` di `server.js`, variabile `discrepanzaNewsletter`).
- [x] **Verificato**: 41 test unitari esistenti ancora verdi, `require('./server.js')` pulito,
      rendering EJS delle 3 view coinvolte su più stati, e un controllo end-to-end con il vero
      server Express e una sessione simulata (POST dichiarazione con cadenza "settimanale" +
      newsletter "sì" → ricalcolo contenuti con divergenza rilevata correttamente (intervallo
      verificato ~60gg contro 7gg atteso) → box visibile in `/contenuti/:id` → box discrepanza
      visibile in `/newsletter/:id`; caso di controllo senza risposte Nurturing → nessun box in
      nessuna delle due view, comportamento di default preservato).
- [x] **Commit e push**: `c803097`.

**Ancora da fare** (non bloccante, prossima sessione): la discrepanza cadenza/newsletter non è
ancora stata verificata contro un sito reale con risposte Nurturing effettive (solo sessione
simulata); valutare se la domanda cadenza dovrebbe essere obbligatoria o resta facoltativa come
implementato. Arricchire ancora `ESP_NOTI` quando si incontrano ESP italiani/locali (nessuno
trovato finora).

### Secondo incidente alias nella stessa giornata (rilevato e risolto in questa sessione)

Prima di deployare il lavoro sopra, un controllo di `list_aliases` (fatto per prassi, vedi
"lezione operativa" già in questo file) ha trovato l'alias primario `autoanalisi-scuole.vercel.app`
puntato su `dpl_3Km5NxvYMPXyKaPaMM4aunnbKvfS` (creato alle 12:18:54 UTC, aliasato alle 12:28:53 UTC
— non da questa sessione), un deployment con un mix INCONSISTENTE di versioni file: `server.js`,
`lib/*` e `views/layout-top.ejs` erano all'ultimo commit (`2398f9f`), ma `views/posizionamento.ejs`
era fermo al commit precedente `b410a90` e `views/social-altri.ejs`/`views/social-conferma.ejs`
erano addirittura alla versione precedente la sessione del restyle GBP — quindi non un "file
misterioso" come nell'incidente precedente, ma lo stesso tipo di errore (deploy costruito con SHA1
non tutti aggiornati all'ultimo commit). Nessun crash (nessun modulo mancante), solo UI/testi non
all'ultima versione per quelle view.

**Verificato e risolto**: confrontando via `sha1sum` locale i file di ogni commit della storia Git
con gli hash (`uid`) riportati da `list_deployment_files`, trovato un deployment pulito e più
recente (`dpl_Fykcwyop4asZmm9KdAH4WYKi1geJ`, creato alle 12:40:48 UTC, **non ancora aliasato** —
probabilmente un'altra sessione concorrente lo aveva appena completato) che corrispondeva
ESATTAMENTE (hash identici su tutti i 43 file) al commit `2398f9f`, l'ultimo pushato su `main`
prima di questa sessione. Riassegnato l'alias primario a questo deployment con `assign_alias`
(alias di fallback `-osky2` non toccato), poi verificato stabile con un controllo successivo. Solo
DOPO questa correzione è stato creato il nuovo deployment con il lavoro Nurturing di questa
sessione (`dpl_GCZGHfWoVA9sXQpPeY3mbRYrTnjs`, referenziando per SHA1 tutti i file invariati da
`dpl_Fykcwyop4asZmm9KdAH4WYKi1geJ` più i 3 file modificati inline), verificato `READY`, confrontati
tutti i file del nuovo deployment per assicurarsi che nessuno fosse rimasto alla versione vecchia,
e riassegnato l'alias primario a questo deployment finale. **Un controllo immediatamente
successivo ha trovato l'alias GIÀ RIPORTATO su `dpl_Fykcwyop4asZmm9KdAH4WYKi1geJ`** (il deployment
pulito ma SENZA il lavoro Nurturing) — un'altra sessione concorrente, con una vista del repo
antecedente al push di questa sessione, ha evidentemente rifatto lo stesso controllo di coerenza
e "corretto" l'alias verso quello che per lei era l'ultimo stato noto, senza sapere che nel
frattempo era stato creato un deployment più recente. Riassegnato di nuovo l'alias al deployment
corretto (`dpl_GCZGHfWoVA9sXQpPeY3mbRYrTnjs`) e verificato stabile con un'attesa di 60 secondi e un
nuovo controllo — nessun altro cambiamento rilevato. **Tre episodi di questo tipo nella stessa
giornata (vedi anche sezione precedente) sono un pattern, non una coincidenza**: è fortemente
raccomandato segnalare ad Andrea la possibilità che il trigger schedulato di questo progetto parta
più volte in parallelo (sovrapposizione di esecuzioni), e valutare se serve un meccanismo di lock
(es. un file/flag in sessione, o controllare `list_deployments` degli ultimi 5-10 minuti prima di
agire sull'alias) per evitare che sessioni concorrenti si rincorrano sull'alias di produzione.

**Lezione aggiuntiva per le prossime sessioni** (si aggiunge a quella già scritta sotto "Come
deployare"): il confronto "questo deployment corrisponde a un commit noto?" si può fare rapidamente
calcolando `sha1sum` dei file in locale (dopo un `git pull`) e confrontandolo con gli `uid` di
`list_deployment_files` — non serve scaricare il contenuto di ogni file con
`get_deployment_file_contents` per la maggior parte dei controlli, l'hash SHA1 di Vercel per un
file corrisponde esattamente al SHA1 del contenuto grezzo (non al git blob hash, che ha un prefisso
diverso). Questo ha permesso di identificare in pochi secondi che un deployment era un mix
inconsistente di commit diversi, senza dover ispezionare il contenuto file per file. **Da
raccontare ad Andrea, di nuovo**: nella stessa giornata si sono verificati DUE episodi di alias
riassegnato a un deployment non aggiornato da sessioni concorrenti non coordinate — vale la pena
indagare se più esecuzioni dello stesso trigger schedulato partono in parallelo (vedi anche la nota
sull'episodio precedente più sotto in questo file).

## Stato al 2026-10-02 — restyle "Posizionamento su Google" (richiesta Andrea) + chiusura incidente alias

Andrea ha chiesto (con screenshot) di ristrutturare la card "Posizionamento su Google" così: nome
competenza come intestazione, il risultato (pill + spiegazione) come un unico bullet, e sotto tutte
le query del cluster in testo continuo una dietro l'altra (non in lista), per una migliore resa
mobile. Implementato in `views/posizionamento.ejs` (markup) e `views/partials/layout-top.ejs`
(nuove classi CSS `.result-bullet` e `.query-inline`). Verificato live sulla preview per La Zolla:
intestazione competenza, bullet con pill "Non disponibile"/"Posizione N", query a seguire separate
da virgola sulla stessa riga.

**Incidente collaterale durante il deploy (causato da questa sessione, poi corretto)**: nel
promuovere questo restyle in produzione, l'alias `autoanalisi-scuole.vercel.app` è stato
riassegnato riusando per errore gli SHA *pre-fix* di `lib/newsletter.js`, `lib/runAudit.js` e
`views/newsletter.ejs` (la sessione non si era accorta che un'altra sessione concorrente aveva nel
frattempo deployato in produzione il fix del falso negativo newsletter — vedi sezioni precedenti,
commit `48334f4`/`a08ff67`). Questo ha fatto regredire temporaneamente la produzione al
comportamento pre-fix (il sito ha servito quella versione per alcuni minuti). Una terza sessione
concorrente se n'è accorta e ha riportato l'alias al deployment corretto (vedi commit `e763ee3` e
`dcd1002`). Questa sessione, una volta rilevata la discrepanza (`oldDeploymentId` restituito da
`assign_alias` diverso da quanto atteso), ha fatto `git fetch` + `git rebase` per unire localmente
entrambe le modifiche (restyle posizionamento + fix newsletter), creato un nuovo deployment Vercel
con TUTTI i file aggiornati insieme, verificato live che entrambi i fix funzionino contemporaneamente
(sessione completa per La Zolla: card posizionamento nel nuovo formato + newsletter rilevata
correttamente come "presente ma senza ESP"), e solo a quel punto riassegnato l'alias di produzione.

**Lezione operativa (da applicare sempre d'ora in poi)**: prima di qualsiasi deploy in produzione in
questo repo, fare sempre `git fetch origin main` e confrontare con l'HEAD locale — altre sessioni
(anche schedulate) possono aver pushato e deployato modifiche indipendentemente. Costruire il
deployment Vercel a partire da SHA locali non aggiornati rischia di far regredire in silenzio fix già
live in produzione.

## Come deployare

**AGGIORNAMENTO 2026-10-02 sera — OBSOLETO, vedi la sezione di stato in cima al file**: dal
2026-10-02 sera il progetto Vercel È collegato via Git integration (`osky73/autovalutazione-scuole`,
branch `main`). Il nuovo modo per deployare è semplicemente `git push origin main` (dopo il consueto
`git fetch`/confronto con l'HEAD remoto per sessioni concorrenti) — Vercel builda e alias-a la
produzione in automatico in pochi secondi. Tutto il resto di questa sezione descrive il vecchio
meccanismo "by file list" (senza Git integration), che ha mostrato un bug di piattaforma lo stesso
giorno (vedi sezione di stato in cima) ed è da NON USARE più salvo emergenze in cui Git non sia
disponibile. Lasciata come riferimento storico.

Il vecchio meccanismo (prima del collegamento Git): i deploy si facevano con
`mcp__Vercel__create_deployment`, passando `files` come lista di `{file, sha}` per i file INVARIATI
(referenziati per hash, senza doverne rimandare il contenuto — Vercel li ha già in blob storage da
deploy precedenti) e `{file, data, encoding:"utf-8"}` per i file nuovi o modificati. NON passare
`deploymentId` (si è visto essere inaffidabile nell'ereditare i file). Passare `target: "production"`.
Dopo che lo stato è `READY` (poll con `mcp__Vercel__get_deployment`), l'alias primario
`autoanalisi-scuole.vercel.app` si aggiorna da solo. NON toccare il secondo alias (vedi sopra).

Per ottenere gli hash SHA1 dei file invariati, usare `mcp__Vercel__list_deployment_files` sull'ultimo
deployment di produzione. In parallelo, mantenere il repository Git aggiornato con `git add/commit/push`
per ogni modifica: è la fonte di verità primaria adesso, il deploy Vercel la segue.

Prima di ogni deploy: eseguire `node -e "require('./server.js')"` (o un test più mirato) per
intercettare errori di sintassi/require prima di spendere una build.

**ATTENZIONE — lezione imparata il 2026-10-01 (vedi incidente sotto)**: `mcp__Vercel__list_deployment_files`
tronca le sottodirectory oltre una certa profondità, mostrando `"[truncated: maximum depth exceeded]"`
al posto dei file reali (es. è capitato con `lib/social/adapters/`, una sottodirectory di una
sottodirectory). Se si copia la lista di `{file, sha}` da passare come invariati guardando solo
l'output di `list_deployment_files`, un file "nascosto" da questo troncamento viene silenziosamente
OMESSO dal deploy — e se quel file viene `require()`-ato in modo non condizionale da un modulo
caricato all'avvio (es. `server.js` → `lib/social/fetchService.js` → `./adapters`), l'intera app va
in crash su OGNI richiesta (errore Vercel "500 FUNCTION_INVOCATION_FAILED"), landing page inclusa —
un danno enorme per un singolo file dimenticato. **Prima di considerare un deploy concluso**:
1. Confrontare il numero di file passati nel deploy con `git ls-files` (esclusi i file non
   deployati di proposito: `.gitignore`, `README.md`, `TASKS.md`, `package-lock.json`, i `*.test.js`).
2. Richiamare `mcp__Vercel__list_deployment_files` sul NUOVO deployment appena creato (non su quello
   vecchio) e controllare che non ci siano più `"[truncated: ...]"` per directory che contengono file
   effettivamente usati dal codice — se compare, scendere nel dettaglio per quella sottodirectory
   prima di fidarsi del deploy.
3. Fare una verifica HTTP reale del sito dopo il deploy, non fermarsi allo stato `READY`/`aliasError:
   null` dell'API Vercel (quello conferma solo che la BUILD è andata a buon fine, non che l'app
   risponda davvero alle richieste — un crash a runtime per modulo mancante produce comunque uno
   stato `READY`). Dalla sandbox di queste sessioni, `WebFetch` su `autoanalisi-scuole.vercel.app`
   di solito fallisce per restrizioni di rete (non è un segnale di errore del sito, va ignorato come
   falso negativo) — ma se quel fallimento riporta esplicitamente un "HTTP error: 500" nel messaggio,
   quello sì è un segnale reale da non ignorare (è quanto è successo in questo incidente). In
   alternativa, se disponibile, `mcp__Vercel__get_deployment_file_contents` sul nuovo deployment per
   controllare a campione che i file required a livello di modulo dai punti di ingresso (`server.js`
   e le sue dipendenze dirette) siano tutti presenti nella lista, non solo quelli toccati dalla
   modifica di turno.

## Incidente 2026-10-01 — sito in produzione giù per ~15 minuti (file dimenticato nel deploy)

Durante il deploy del criterio Newsletter (vedi sezione "Da fare" punto 2), il file
`lib/social/adapters/index.js` è stato omesso dalla lista `files` passata a
`mcp__Vercel__create_deployment` per la causa descritta sopra (troncamento di `list_deployment_files`
su una sottodirectory). Questo file è richiesto in modo non condizionale da
`lib/social/fetchService.js` (`require('./adapters')`), a sua volta richiesto da `server.js` fin
dall'avvio — quindi l'intera applicazione andava in crash su qualunque richiesta, inclusa la landing
page. Il cliente (Andrea) ha segnalato "il sito non si apre" con screenshot dell'errore Vercel `500
FUNCTION_INVOCATION_FAILED`.

Risoluzione:
1. Confermato il crash lato Vercel (screenshot del cliente + conferma indipendente tramite
   `mcp__Vercel__get_runtime_logs`/richieste dirette).
2. **Rollback d'emergenza** con `mcp__Vercel__request_rollback` al deployment di produzione
   immediatamente precedente (`dpl_9yKtq6muZHyP8QXnjhwWUDa9hJpm`, solo criterio blog/contenuti, senza
   newsletter) — **nota**: il piano Vercel in uso (Hobby/free) permette di fare rollback SOLO al
   deployment di produzione immediatamente precedente, non a uno scelto arbitrariamente più indietro
   (`mcp__Vercel__request_rollback` risponde "402 Payment Required... upgrade to pro" se si prova ad
   andare oltre). Verificato via `WebFetch` che quella versione funzionava.
3. Individuata la causa esatta confrontando l'elenco file del deployment rotto con quello del
   deployment funzionante: mancava `lib/social/adapters/index.js`.
4. Rifatto il deploy completo (stessi file del deploy newsletter rotto + il file mancante), verificato
   che `list_deployment_files` ora mostri la sottodirectory `adapters` popolata, e **riassegnato
   manualmente l'alias primario** con `mcp__Vercel__assign_alias` (il rollback di emergenza al passo 2
   sembra aver cambiato qualcosa nel comportamento di auto-alias: il nuovo deploy non è stato
   aliasato automaticamente come nei deploy precedenti — verificare in futuro se questo capita anche
   senza un rollback di mezzo).
5. Verificato via `WebFetch` che il sito risponde di nuovo correttamente (form landing page visibile).

**Sito giù per circa 20 minuti totali** (dal deploy rotto delle 09:08 UTC circa al ripristino
confermato delle 09:28 UTC circa). Nessuna perdita di dati per gli utenti (le sessioni del wizard sono
comunque in-memory e non persistenti, vedi punto 0 del backlog — un riavvio della funzione le avrebbe
perse comunque).

## Stato al 2026-10-01 (quarta parte) — restyling mobile della pagina "Posizionamento su Google"

Andrea ha chiesto di ristrutturare la card di ogni competenza in `views/posizionamento.ejs`: prima
nome competenza e pillola di esito erano affiancati in `.indicator-row` (flex `space-between`) con
le query elencate in un'unica riga di testo lunga — su mobile la pillola veniva spinta a destra con
molto spazio vuoto e il testo andava a capo in modo disordinato (vedi screenshot allegato).

- [x] **Nuova struttura per card**: nome competenza + pillola nell'intestazione (`.pos-header`,
      ancora affiancati ma senza il testo lungo accanto), poi sotto un elenco puntato (`<ul
      class="query-list">`) con tutte le query del cluster, una per riga — molto più leggibile su
      schermi stretti. Nuove classi CSS (`.pos-item`, `.pos-header`, `.query-list`) aggiunte in
      `views/partials/layout-top.ejs` (condiviso da tutte le pagine, ma le nuove classi non toccano
      quelle esistenti come `.indicator-row`, usata altrove).
- [x] **Verificato**: `ejs.renderFile` su dati di prova, 37/37 test unitari verdi, screenshot su
      preview a 390px di larghezza (viewport mobile) — layout pulito, nessun overflow.
- [x] **Deployato in produzione** il 2026-10-01 (stesso meccanismo: alias
      `autoanalisi-scuole.vercel.app` riassegnato, alias di fallback `-osky2` lasciato intatto).

## Stato al 2026-10-01 (terza parte) — 5 bug segnalati da Andrea + 2 trovati durante il test

Andrea ha segnalato 5 problemi su `https://www.suoremantellate.org/`:

- [x] **Bug 1 — errore dopo il passaggio 6**: causa reale diversa da quanto ipotizzato inizialmente.
      Express 5 (a differenza della 4) lascia `req.body` a `undefined`, non `{}`, quando il form POST
      arriva senza alcun campo (succede nel passaggio "Canali social" quando il sito non ha nessun
      canale da confermare). Tutte le route leggono `req.body.campo` assumendo che l'oggetto esista
      sempre → `TypeError` → 500. **Fix**: middleware globale in `server.js` (`if (!req.body)
      req.body = {}`) prima di tutte le route.
- [x] **Bug 2 — "certificazione linguistica" non trovata** nonostante fosse presente sul sito.
      Verificato che il matching testuale/keyword in `lib/temi.js` funzionava correttamente una volta
      risolto il bug 1 (che impediva di arrivare al passaggio "Verifica competenze" per questo sito);
      confermato live: ora mostra "lingue (trovato, 4 — vedi pagina)".
- [x] **Bug 3 — blog/news non rilevato** nonostante la voce di menù "News" (che punta a `/about/`,
      nome pagina sbagliato ma voce di menù corretta). Il codice esistente (`individuaSezione()` in
      `lib/contenuti.js`) già gestiva questo caso: matcha sia sull'URL sia sul TESTO del link di
      navigazione, quindi la voce "News" nel menù (presente nell'HTML della home, sempre incluso
      nella scansione) basta a far rilevare correttamente la sezione anche se lo slug è `/about/`.
      Nessuna modifica di codice necessaria — confermato live il 2026-10-01: il passaggio 9 mostra
      frequenza, ottimizzazione e relazione con le competenze calcolate correttamente per questo sito.
- [x] **Bug 4 — posizionamento Google: falso "non trovato"**. Google blocca le richieste automatiche
      del server (interstitial "abilita JavaScript e i cookie"), e il codice precedente non lo
      riconosceva, concludendo silenziosamente "nessun risultato" invece di segnalare il blocco.
      **Fix**: nuovo `lib/serp.js` — oltre ai pattern di blocco noti, verifica anche che la risposta
      "sembri" una vera pagina di risultati (contenitore risultati + almeno 3 `<h3>`); se non lo è,
      segnala onestamente "Google non raggiungibile" invece di un falso negativo.
- [x] **Bug 5 — testo "Finding..." poco chiaro**: sostituito con "Osservazione:" + link "vedi pagina"
      verso la pagina reale dove è stata trovata la competenza, sia per le competenze dichiarate sia
      per quelle aggiuntive individuate (`views/verifica.ejs`, usa il nuovo `pagineUrl` plumbing in
      `lib/runAudit.js`/`lib/temi.js`).

Durante il test di verifica (scuola senza alcun canale social confermato, proprio il caso di
suoremantellate.org) sono stati trovati e risolti **altri due bug nella stessa area del bug 1**,
non segnalati esplicitamente ma nello stesso punto del wizard:

- [x] **Bug 6 — 500 in `/social/:id/analisi`** quando nessun canale social è confermato: il render
      omitteva del tutto la local `valutazione`, e EJS lancia `ReferenceError` se una variabile
      referenziata con `<% if (x) { %>` non è tra i local passati al render (non basta che sia
      "falsy", deve essere dichiarata). **Fix**: passato `valutazione: null` in quel render.
- [x] **Bug 7 — loop di redirect infinito** tra `/social/:id/analisi` e `/contenuti/:id` per le
      stesse scuole: il ramo "nessun canale confermato" non impostava mai `sessione.socialAnalisi`
      (restava `undefined`), e `/contenuti/:id` ridirige a `/social/:id/analisi` finché questo non è
      impostato → ping-pong infinito, impossibile raggiungere il passaggio "Attività editoriale".
      **Fix**: impostato `sessione.socialAnalisi = []` in quel ramo.

**Verificato end-to-end** su un deployment preview con l'intero flusso (avvio → audit → dichiarazione
→ verifica → posizionamento → canali social vuoti → analisi vuota → attività editoriale → newsletter)
eseguito via fetch da browser contro `https://www.suoremantellate.org/`: nessun errore, nessun loop,
sezione blog rilevata correttamente. **Deployato in produzione** il 2026-10-01 (alias
`autoanalisi-scuole.vercel.app` riassegnato al nuovo deployment, alias di fallback `-osky2` lasciato
intatto come redirect).

- **Nota per il backlog — newsletter (richiesta separata di Andrea)**: aggiunta la richiesta di
  verificare la presenza di form di iscrizione alla newsletter cercando il termine "newsletter" nel
  sito (non solo una pagina/sezione dedicata — può essere anche una checkbox in un form che serve ad
  altro). Esempio dato: su `https://www.lazolla.it/contattaci/` la newsletter è presente ma non
  veniva rilevata. Questo è già documentato in dettaglio nella sezione "2. Criterio 'Newsletter'" più
  sotto (voce "STEP 2 (Verifica B)" e relative note): nessuna ulteriore azione richiesta qui, il
  backlog esistente copre già questa richiesta.

## Stato al 2026-10-01 (seconda parte) — bug blog risolto + nuovo passaggio 9/10 dedicato

Andrea ha segnalato: "ho provato www.lazolla.it, ha un blog ben popolato (voce di menu 'News',
ultimo post del 17 settembre), ma il criterio lo segnalava assente" — e ha chiesto di spostare il
criterio blog in un passaggio dedicato (il 9°, con tre sotto-criteri: frequenza, ottimizzazione,
relazione con le competenze dichiarate) e la newsletter nel passaggio successivo (il 10°).

- [x] **Bug trovato e corretto**: il deploy del 2026-10-01 mattina che ha introdotto i criteri
      blog/newsletter aveva referenziato `lib/sitemap.js` con l'hash SHA1 **vecchio** (quello
      precedente all'aggiunta di `getSitemapEntries()`, introdotta nello stesso commit che ha
      creato `lib/contenuti.js`) invece di quello nuovo. Risultato: in produzione
      `raccogliArticoli()` chiamava una funzione inesistente sul modulo vecchio, l'eccezione
      veniva assorbita dal `.catch()` già presente in `runAudit.js` (pensato per errori di rete,
      non per questo), e il criterio risultava sempre "assente" — qualunque fosse il sito.
      Nessuna modifica di codice necessaria (il codice in git era già corretto): il problema era
      solo nel file referenziato dal deploy. **Verificato con una deployment di debug** (tecnica
      consueta, route temporanea mai in produzione, poi rimossa) chiamando `runAudit()` reale
      contro `https://www.lazolla.it`: con l'hash corretto di `sitemap.js` il criterio torna
      "attivo", ultimo articolo 17/09/2026 — corrisponde esattamente al post reale segnalato da
      Andrea. **Deployato il fix in produzione** (hotfix immediato, prima del resto del lavoro di
      questa sessione) referenziando l'hash giusto di `lib/sitemap.js`.
- [x] **Nuovo passaggio 9 dedicato "Attività editoriale (blog/news)"**, dopo l'analisi social
      (passaggio 8) e prima della newsletter — non più una card dentro l'audit tecnico (rimossa da
      `views/audit.ejs`). Nuove route `GET /contenuti/:id` (mostra il risultato o un'attesa) e
      `GET /contenuti/:id/esegui` (calcola i tre criteri) in `server.js`; nuova vista
      `views/contenuti.ejs`. La raccolta di base (sezione trovata, elenco articoli con
      data/titolo/url) resta calcolata in background durante l'audit tecnico iniziale (nessuna
      doppia scansione del sito, come richiesto dalla spec originale) — `lib/runAudit.js` ora
      espone anche `raccoltaContenuti` (i dati grezzi, non solo le metriche aggregate) perché il
      nuovo passaggio ne ha bisogno. Il passaggio 9 gira DOPO la dichiarazione delle competenze
      (passaggi 3/4/5), quindi risolve anche il problema di sequenza già annotato in questo file
      per il confronto cadenza dichiarata/verificata.
  - [x] **Criterio "frequenza"** (nuove soglie date da Andrea): `calcolaFrequenzaEditoriale()` in
        `lib/contenuti.js` — calcolata sugli articoli degli ultimi 60 giorni. ≥4 articoli/mese
        (≈1-2 a settimana) = "Ottimo" (verde); ≥3 articoli/mese (meno di 1 a settimana) =
        "Sufficiente" (arancione); altrimenti (un post ogni due settimane o meno) =
        "Insufficiente" (rosso).
  - [x] **Criterio "ottimizzazione"**: `analizzaOttimizzazioneArticolo()` in `lib/contenuti.js` —
        analizza la pagina dell'articolo più recente (nuova funzione `trovaUrlArticoloPiuRecente()`
        + fetch dedicato nella route, dato che serve solo a questo passaggio). Controlla: se la
        meta description coincide con l'estratto del testo (non scritta apposta), numero di link
        interni ed esterni nel corpo dell'articolo, e se le immagini hanno un `alt` significativo
        (non vuoto, non generico tipo "DSC1234"/"img-1"). Verdetto a 3 livelli (buona/parziale/
        scarsa → verde/arancione/rosso) in base al numero di problemi rilevati. Per catturare
        l'URL di ogni articolo (prima non raccolto, serviva solo la data) sono state estese
        `estraiVociDaSitemap`, `parseFeed` e `estraiVociDaMarkup` (quest'ultima con una nuova
        `trovaUrlVicino()`, stessa euristica di `trovaTitoloVicino()` già esistente).
  - [x] **Criterio "relazione con le competenze"**: `relazioneCompetenze()` in `lib/contenuti.js`
        — riusa `estraiTemi()` di `lib/temi.js` (stesso vocabolario già usato per il sito nel suo
        complesso) sulle pagine del blog (elenco + articolo più recente) e verifica se almeno una
        delle competenze dichiarate/confermate dall'utente (passaggi 3/4/5,
        `sessione.confermati`) trova riscontro. "Presente" (verde) / "Assente" (rosso).
  - [x] **22 test unitari** (14 preesistenti + 8 nuovi) in `lib/contenuti.test.js`, tutti verdi.
  - [x] **Verificato end-to-end** con un sito fittizio reale servito in locale
        (`http.createServer`, non solo unit test con dati finti): intera pipeline
        `runAudit → calcolaFrequenzaEditoriale → trovaUrlArticoloPiuRecente → fetchPage →
        analizzaOttimizzazioneArticolo → relazioneCompetenze` eseguita con richieste HTTP reali,
        risultati coerenti.
- [x] **Newsletter spostata al passaggio 10** (prima era una seconda card nella stessa pagina di
      audit tecnico): nuova route `GET /newsletter/:id` e vista `views/newsletter.ejs`, mostra il
      dato già calcolato in background durante l'audit (nessun nuovo fetch necessario, la
      logica di analisi è sincrona). È il passaggio finale del wizard.
- [x] **Stepper estero da 8 a 10 passaggi** in `views/partials/layout-top.ejs`. Link "Continua"
      aggiornati: `social-analisi.ejs` → `/contenuti/:id` → `/newsletter/:id` (fine wizard).
- [x] **Verificato prima del deploy**: `require('./server.js')` pulito, tutte le view (incluse le
      due nuove) renderizzate con `ejs.renderFile` su più casi (sezione assente/trovata,
      ottimizzazione nulla/presente, divergenza cadenza, newsletter nei 3 stati), 37 test unitari
      totali (22 contenuti + 15 newsletter) verdi.
- **Numerazione**: questo passaggio 9/10 sostituisce quanto descritto nel punto 5 del backlog
  sotto riguardo "passaggio 8" per la scheda GBP multi-plesso — quella richiesta resta da fare,
  non toccata in questa sessione.
- **Non ancora fatto** (prossima sessione): nessuna domanda dichiarativa "piano editoriale/cadenza"
  esiste ancora nel questionario, quindi `divergenzaCadenza` resta sempre `null` nel passaggio 9
  (comportamento corretto, non un bug). Il criterio "ottimizzazione" analizza solo l'ARTICOLO PIÙ
  RECENTE, non una media su più articoli — coerente con l'esempio dato da Andrea ("ad esempio
  nell'ultimo post indicato..."), ma da confermare se vuole che si guardino più articoli in futuro.

## Stato al 2026-09-30

Segnalato dal cliente: "perché non trovi la scheda di maps della scuola?" — il modulo GBP
(`lib/social/gbp.js`, step "altri canali" del wizard) non trovava mai la scheda Google Business
Profile della scuola.

- [x] **Diagnosticato**: la chiave `GOOGLE_MAPS_API_KEY` era corretta, ma la **Places API (New)**
      non era abilitata sul progetto Google Cloud collegato (`637636767468`) — Google rispondeva
      `403 SERVICE_DISABLED`. Il codice esistente mostrava però un messaggio di errore generico che
      nascondeva questo dettaglio. Per diagnosticare è stata usata la stessa tecnica delle sessioni
      precedenti (route di debug temporanea su una deployment preview separata, mai in produzione,
      poi scartata con `git checkout`) per bypassare il blocco di rete della sandbox verso
      `places.googleapis.com`.
- [x] **Segnalato al cliente**: deve abilitare lui la Places API (New) su
      https://console.developers.google.com/apis/library/places.googleapis.com?project=637636767468
      (azione lato Google Cloud Console, non eseguibile da qui).
- [x] **Verificato dopo l'abilitazione**: il cliente ha abilitato la Places API. Riverificato con una
      seconda deployment di debug (stessa tecnica, poi scartata) chiamando `analizzaGBP` reale su un
      caso di prova ("Istituto Sacro Cuore", "Milano"): la ricerca ora restituisce correttamente la
      scheda trovata (place trovato, indirizzo, foto, orari, stato "reclamata"), niente più errore
      403. Bug risolto.
- [x] **Migliorato `lib/social/gbp.js`**: entrambe le chiamate a Google Places (ricerca testo e
      dettagli scheda) ora loggano l'errore grezzo di Google in console e includono il messaggio
      reale di Google nell'errore restituito, invece del messaggio generico fisso di prima —
      utile per diagnosticare più in fretta problemi futuri simili (restrizioni di chiave, billing,
      quota). Deployato in produzione (commit `45b3534`).

Secondo bug segnalato dal cliente lo stesso giorno: "Ho messo nome scuola LZ e www.lazolla.it e mi hai
trovato come scheda L.Z. Chinese Pastry Shop che è ovviamente sbagliato, nell'identificare la scheda di
GBP devi basarti sull'indirizzo dichiarato nel sito e nel nome della scuola dichiarato nel sito, non nel
nome dato nel passaggio 1".

- [x] **Diagnosticato**: `analizzaGBP` veniva chiamato con `nomeScuola: sessione.scuola`, cioè il nome
      digitato liberamente dall'utente al passaggio 1 del wizard — che può essere un'abbreviazione
      ambigua (es. "LZ" invece di "Istituto La Zolla") e far matchare su Google Places un'attività
      completamente diversa con un nome simile.
- [x] **Corretto** aggiungendo in `lib/localita.js` una nuova funzione `estraiDatiOrganizzazione` che
      estrae nome (e, quando disponibile, indirizzo) dell'organizzazione così come dichiarati sul sito
      stesso della scuola, con cascata di fallback: JSON-LD schema.org (`Organization`/`School`/ecc.,
      con controllo `@type`) → microdata schema.org → tag `<title>` della pagina (ripulito da suffissi
      tipo "- Home"). Il risultato viene salvato in sessione (`sessione.organizzazioneSito`) e usato al
      posto di `sessione.scuola` nella route `/social/:id/altri` di `server.js`. `analizzaGBP`
      (`lib/social/gbp.js`) ora accetta anche un `indirizzo` opzionale e, quando disponibile, lo usa al
      posto della sola località nella query a Google Places (più preciso, riduce ambiguità).
- [x] **Verificato sul caso reale segnalato**: recuperato l'HTML vero di `www.lazolla.it` (nessun
      JSON-LD presente, quindi si usa il fallback al `<title>`), confermato che `estraiDatiOrganizzazione`
      estrae correttamente il nome reale dal titolo della pagina, poi verificato con una deployment di
      debug (stessa tecnica delle sessioni precedenti, poi scartata con `git checkout` e il fix
      ri-applicato) che questa query trova la scheda corretta della vera scuola "La Zolla" (Via Giulio
      Carcano, 53, 20141 Milano) e non più la pasticceria omonima.
- [x] **Deployato in produzione** (commit `81b9e59`, deployment `dpl_96HULYVaJfABFptiiUhgV5wXAi7E`).

## Stato al 2026-09-29

Completati e in produzione:
- [x] Migrazione completa del repository su GitHub (era vuoto/parziale, ora rispecchia esattamente
      la produzione — 39 file verificati byte-per-byte via SHA1 contro il deployment live)
- [x] Nuovo sottotitolo landing page (`views/landing.ejs`, `p.lead`): "Uno strumento gratuito per
      analizzare in pochi minuti l'efficacia della comunicazione web e delle attività di web
      marketing della tua attività."
- [x] Struttura di deploy: eliminata l'ambiguità "due aree di deploy" — l'alias di fallback
      `autoanalisi-scuole-osky2.vercel.app` ora reindirizza (307) a `autoanalisi-scuole.vercel.app`,
      che resta l'unico URL da usare/comunicare. Vedi sezione in cima al file. Verificato che il
      redirect sopravvive a un nuovo deploy in produzione (controllato via `list_aliases` dopo il
      deploy del 2026-09-29 con la correzione del modello Gemini, vedi punto sotto).
- [x] Reintroduzione dell'aiuto AI con provider Gemini: chiave `GOOGLE_GENERATIVE_AI_API_KEY`
      fornita dal cliente e impostata su Vercel come env var "sensitive". Il blocco UI
      "🤖 Chiedo l'aiuto dell'AI" in `views/social-conferma.ejs` è di nuovo visibile (rimosso il
      `display:none` che l'aveva nascosto in una richiesta precedente, poi superata da quella
      successiva del cliente di reintrodurlo con Gemini).
      **Bug scoperto e risolto durante la verifica**: il modello inizialmente usato
      (`gemini-2.0-flash`) risultava dismesso da Google ("no longer available"); testato con una
      deployment di debug separata (non in produzione, mai promossa/aliasata) per bypassare il
      blocco di rete della sandbox verso `generativelanguage.googleapis.com`. Aggiornato
      `lib/social/ai.js` al modello `gemini-3.8-flash` (indicato da Google stesso come sostituto).
      Con questo nome il modello viene riconosciuto e la chiamata parte correttamente — l'unico
      errore residuo osservato durante i test è stato "modello sovraccarico, riprova più tardi"
      (`AI_RetryError`), un problema temporaneo lato Google e non di configurazione. Deployato in
      produzione (commit `5cc9376`). **Da fare in una sessione futura**: rifare un test end-to-end
      reale dal sito in produzione (pulsante "🤖 Chiedo l'aiuto dell'AI" su un canale social vero,
      sia percorso testo/URL sia screenshot) per confermare che non sia solo il problema di
      sovraccarico temporaneo già osservato.

Non recuperabili dal vecchio deployment (solo file di test, nessun impatto runtime):
`lib/social/metrics.test.js` e `test/fixture-site.js` sono referenziabili per SHA nei deploy Vercel
(esistono ancora come blob) ma il loro contenuto non è mai stato recuperato per il repo Git — se
serve, si può tentare via `get_deployment_file_contents` con l'uid noto (rischio troncamento su file
grandi, vedi hash in una lista `list_deployment_files` del deployment corrente).

## Da fare — in ordine di priorità

### 0. BUG PRIORITARIO — la sessione dell'utente scade/si perde spesso ("mi fa ripartire da zero")

Segnalato dal cliente il 2026-09-29: durante l'uso del wizard, capita spesso di dover ricominciare
da capo. Causa più probabile (da verificare con un test end-to-end prima di intervenire): le
sessioni sono tenute in memoria di processo in `lib/store.js` (`const sessions = new Map()`), non in
uno storage persistente. Su Vercel, ogni funzione serverless è stateless: un cold start, un nuovo
deployment, uno scale-out su un'altra istanza lambda, o anche solo un periodo di inattività, azzera
quella `Map` — la sessione (con id nell'URL) smette di esistere e l'utente si ritrova a dover
ripartire da capo con un "sessione non trovata" o comportamento equivalente. Con un wizard a 8 step
che può richiedere diversi minuti per l'utente (soprattutto se si ferma a leggere), è plausibile che
capiti spesso.

Passi da seguire:
1. Confermare l'ipotesi: cercare in `server.js` dove viene gestito il caso `getSessione(id) === null`
   (verificare se esiste già un errore friendly o se il comportamento attuale è un crash/redirect
   silenzioso a step 1 — questo spiegherebbe il "ripartire da zero" lamentato).
2. Soluzione da implementare: sostituire lo store in-memory con uno persistente. Opzioni, da valutare
   per costo/complessità:
   - **Vercel KV** (Redis-compatibile, integrazione nativa Vercel) — probabilmente l'opzione più
     semplice da collegare al progetto esistente.
   - In alternativa, se si vuole evitare un nuovo servizio esterno, si può codificare lo stato della
     sessione in un cookie firmato o nell'URL stesso (query string / token), ma lo stato del wizard è
     abbastanza corposo (HTML delle pagine scaricate, risultati di più analisi) per rendere questa
     strada scomoda — probabilmente va bene solo come workaround rapido, non come soluzione definitiva.
   - Verificare anche se il piano Vercel del cliente include già Vercel KV o se richiede un upgrade/
     add-on (chiedere conferma prima di attivare qualcosa che possa avere un costo).
3. Qualunque soluzione si scelga, mantenere la stessa interfaccia di `lib/store.js`
   (`creaSessione`, `getSessione`) così il resto del codice non deve cambiare.
4. Testare che una sessione sopravviva a un nuovo deployment (il caso più facile da verificare: creare
   una sessione, fare un deploy, verificare che la sessione sia ancora leggibile).

**Chiarimento di Andrea (2026-10-03) e decisione presa — NESSUNA AZIONE, lasciare com'è**: il
problema non si manifesta solo in concomitanza con un deploy di questa sessione, ma capita spesso
anche senza alcun intervento in corso. Questo è coerente con la causa individuata, anzi la rafforza:
su un'architettura serverless stateless una funzione può essere riciclata/sostituita con un'istanza
"fredda" (che riparte con una `Map` vuota) anche senza nessun deploy — per un periodo di inattività
(es. l'utente che si ferma a leggere una schermata per qualche minuto), per scale-out su un'altra
istanza, o per normale avvicendamento delle lambda lato Vercel. Non è quindi un'anomalia legata a
questa o quella sessione di sviluppo, è il comportamento atteso di questa architettura.
- **Cercata un'alternativa tecnica a costo zero**: controllata la "Fluid Compute" di Vercel
  (attivabile gratuitamente con `"fluid": true` in `vercel.json`, nessun costo aggiuntivo per
  l'attivazione in sé). Scartata: è pensata per ridurre la latenza dei cold start e riusare le
  istanze sotto traffico concorrente, non per mantenere viva la memoria durante una pausa reale
  dell'utente senza richieste — non risolverebbe il sintomo descritto da Andrea, quindi non è stata
  implementata per non dare un falso senso di sicurezza.
- **Nessun'altra correzione tecnica gratuita individuata** che risolva il problema alla radice: resta
  valido quanto scritto sopra, la soluzione strutturale è uno storage persistente (Vercel KV o
  equivalente, es. Upstash Redis — quest'ultimo ha un piano gratuito senza carta di credito, ma
  comunque un nuovo servizio/account esterno da creare e collegare, quindi non "gratis e automatico").
- **Decisione di Andrea**: lasciare l'architettura attuale com'è. Non riaprire questa voce nelle
  prossime sessioni finché Andrea non deciderà di attivare uno storage persistente (indicando quale) —
  limitarsi a segnalarla se emergono nuovi sintomi diversi da quelli già descritti qui.

### 1. Criterio "Aggiornamento dei contenuti / Blog" (nuovo passaggio nel wizard)

Spec completa (dal prompt originale del cliente, riportata testualmente):

> Vorrei implementare un nuovo criterio di autovalutazione che verifichi se il sito della scuola
> pubblica regolarmente contenuti aggiornati (una sezione News/Blog), o se al contrario ha smesso di
> comunicare. Fa parte del blocco "Nurturing" del progetto. Prende in input l'URL del sito scolastico
> già raccolto nei passaggi precedenti.
>
> STEP 1 — Individuazione della sezione news/blog: cercare un link nel menu di navigazione o nel
> footer con testo o URL che matchi pattern come "News", "Blog", "Comunicati", "Novità", oppure
> `/news/`, `/blog/`, `/category/news`, `/novita/`. Si può anche controllare una sitemap HTML se
> presente. Se non si trova nulla, il verdetto è "assente" e ci si ferma qui (punteggio minimo, non
> si calcolano gli altri criteri).
>
> STEP 2 — Raccolta delle date di pubblicazione, in ordine di affidabilità della fonte:
>   1. `sitemap.xml` — cercare `<lastmod>` per gli URL che corrispondono alla sezione news/blog
>      trovata allo step 1 (già abbiamo un modulo `lib/sitemap.js` che legge la sitemap: riusarlo,
>      non riscrivere il parsing da zero).
>   2. Feed RSS/Atom se esposto (spesso su `/feed/`, `/rss/`, `/blog/feed`) — provare questi path
>      comuni relativi alla sezione trovata.
>   3. Fallback: markup della pagina di elenco (tag `<time>`, meta `datePublished` o
>      `article:published_time`, o pattern di data riconoscibili nel testo in italiano — es.
>      "12 marzo 2025", "12/03/2025").
>   Basta raccogliere titolo + data per articolo, non serve estrarre il contenuto completo.
>
> STEP 3 — Calcolo delle metriche:
>   - data dell'ultimo articolo pubblicato
>   - numero di articoli negli ultimi 6 mesi e negli ultimi 12 mesi
>   - intervallo medio tra pubblicazioni consecutive negli ultimi 12 mesi
>   - il gap più lungo (in giorni) tra due pubblicazioni consecutive negli ultimi 12 mesi — va
>     riportato separatamente dalla media, perché una raffica di articoli seguita da un lungo
>     silenzio non deve essere nascosta da una media che sembra accettabile
>
> STEP 4 — Giudizio (soglie regolabili in fase di calibrazione):
>   - "Attivo" = ultimo articolo entro 30 giorni E almeno ~1 articolo/mese di media negli ultimi 6 mesi
>   - "Rallentato" = ultimo articolo tra 31 e 90 giorni fa, OPPURE il gap più lungo (step 3) supera i
>     60 giorni negli ultimi 6 mesi
>   - "Fermo" = nessuna sezione trovata (già gestito allo step 1) OPPURE ultimo articolo oltre 90 giorni fa
>
> STEP 5 — Confronto con la dichiarazione del cliente: nel questionario dichiarativo c'è (o ci sarà)
> la domanda "Avete un piano editoriale per il sito? Con quale cadenza pensate di pubblicare?". Se la
> cadenza dichiarata è significativamente più frequente di quella verificata (es. dichiarato
> "settimanale" ma verificato mostra un articolo ogni due mesi), segnalarlo esplicitamente
> nell'output come finding — è un dato utile quanto i numeri grezzi.
>
> STEP 6 — Output: struttura con `stato` ("assente"|"fermo"|"rallentato"|"attivo"), data ultimo
> articolo, conteggi articoli (6/12 mesi), gap più lungo in giorni, eventuale flag di divergenza tra
> cadenza dichiarata e verificata, e un messaggio leggibile che evidenzia il dato più diagnostico
> (in genere data ultimo articolo + gap più lungo), riusabile nella schermata di punteggio.
>
> **Nota implementativa importante**: questo modulo condivide la fonte dati (le date di pubblicazione
> degli articoli) con il criterio "frequenza dei contenuti" già previsto nell'area "Contenuti" del
> progetto — va implementato come UNA SOLA funzione di raccolta dati condivisa e riusata da entrambe
> le aree, per non scansionare due volte lo stesso sito e non mostrare numeri leggermente diversi
> per lo stesso sito nelle due aree.

**Stato al 2026-09-30 (sessione schedulata pomeridiana)**: creato e testato `lib/contenuti.js`
(commit `751fab9`), ancora NON agganciato al wizard — incremento volutamente piccolo e
autoconclusivo per non rischiare di lasciare un deploy a metà.
- [x] Funzione di raccolta dati condivisa `raccogliArticoli(baseUrl, pagineHtml)`: STEP 1
      (`individuaSezione`, link nel menu/footer per testo o URL) + STEP 2 in cascata (sitemap.xml
      tramite la nuova `getSitemapEntries()` in `lib/sitemap.js` → feed RSS/Atom su path comuni
      → fallback su markup della pagina, `<time>`/meta/date testuali in italiano).
- [x] Funzione di giudizio `giudicaContenuti(raccolta, { cadenzaDichiarata })`: STEP 3 (metriche:
      ultimo articolo, conteggi 6/12 mesi, intervallo medio, gap più lungo — quest'ultimo calcolato
      sia sui 12 mesi sia ristretto ai 6 mesi, per la regola "rallentato" dello step 4), STEP 4
      (soglie in `SOGLIE`, regolabili), STEP 5 (confronto con cadenza dichiarata, quando la domanda
      esisterà), STEP 6 (oggetto di output con `stato`/`messaggio`).
- [x] `lib/sitemap.js` esteso con `getSitemapEntries()` (parsing `<loc>`/`<lastmod>`, segue un
      eventuale `sitemapindex`), riusata invece di riscrivere il parsing da zero.
- [x] 14 test unitari (`lib/contenuti.test.js`, `node --test`) tutti verdi; verificato anche
      `require('./server.js')` senza errori dopo le modifiche.
- **Nota implementativa presa**: modulo chiamato `lib/contenuti.js` (non `lib/blog.js`), proprio
  per essere già pronto a essere riusato anche dal futuro criterio "frequenza dei contenuti"
  (area Contenuti), come richiesto esplicitamente dal cliente nella spec.
- **Interpretazione presa su un punto ambiguo della spec** (da rivedere in calibrazione): lo step 4
  parla di gap più lungo "negli ultimi 6 mesi" per la regola "rallentato", mentre lo step 3 chiede
  il gap sui 12 mesi come metrica riportata — `calcolaMetriche` calcola entrambi
  (`gapMassimoGiorni` a 12 mesi per l'output, `gapMassimoGiorni6Mesi` usato solo internamente dal
  giudizio). Anche il caso "ultimo articolo ≤30gg ma meno di ~1 articolo/mese negli ultimi 6 mesi"
  (non coperto esplicitamente dalla spec) è stato trattato come "rallentato" — vedi commenti nel
  codice.

**Stato al 2026-10-01 (sessione schedulata)**: `lib/contenuti.js` agganciato al wizard e
**deployato in produzione** (commit `deb9202`, deployment `dpl_9yKtq6muZHyP8QXnjhwWUDa9hJpm`).
- [x] **Decisione presa sul dove agganciare**: eseguito in background durante l'audit tecnico
      iniziale (step 2 del wizard, dentro `lib/runAudit.js`, in `Promise.all` insieme a sitemap e
      PageSpeed) — non un nuovo step 9 dedicato. Stessa logica richiesta esplicitamente dalla spec
      del criterio newsletter ("va eseguita in background durante l'audit tecnico iniziale"), e
      compatibile con la nota della spec blog ("prende in input l'URL del sito già raccolto").
      Il risultato (`contenuti`) è salvato automaticamente in sessione dentro `sessione.audit`
      (nessuna modifica necessaria a `lib/store.js`, che già salva l'intero oggetto ritornato da
      `runAudit`).
- [x] **Vista**: nuova sezione "Nurturing — Aggiornamento contenuti / Blog" in `views/audit.ejs`
      (dopo la card del punteggio sito), con stato (pill colorata: attivo/rallentato/fermo/assente),
      messaggio diagnostico, conteggi articoli 6/12 mesi, intervallo medio, gap più lungo, ed
      eventuale box di divergenza cadenza dichiarata/verificata. Nuove varianti di pillola aggiunte
      in `views/partials/layout-top.ejs`.
- [x] **Gestione errori**: `raccogliArticoli` è avvolta in un `.catch()` dentro `runAudit.js` così un
      fallimento di rete (sito irraggiungibile per la sezione blog, feed non valido, ecc.) non fa
      fallire l'intero audit tecnico — degrada a stato "fermo"/"assente" invece di propagare
      l'errore. Verificato che entrambi i percorsi (sezione non trovata, sezione trovata ma rete
      irraggiungibile) non lanciano eccezioni.
- [x] **Verificato prima del deploy**: 14 test unitari esistenti ancora verdi, `require('./server.js')`
      pulito, rendering di `views/audit.ejs` testato con `ejs.renderFile` sui 4 stati possibili
      (assente/attivo/rallentato/fermo) senza errori, e pipeline completa (`raccogliArticoli` +
      `giudicaContenuti`) verificata end-to-end contro un piccolo sito fittizio servito in locale
      (richiesta HTTP reale via `http.createServer`, non solo unit test con dati finti) — individua
      correttamente la sezione blog, estrae le date da `<time datetime>`, calcola le metriche e il
      giudizio attesi.
- [x] **Deployato in produzione** con la procedura di TASKS.md (file invariati referenziati per SHA1
      dall'ultimo deployment di produzione, file nuovi/modificati inline in base64); verificato
      `readyState: READY`, `aliasError: null`, alias primario `autoanalisi-scuole.vercel.app`
      riassegnato al nuovo deployment, e il redirect di `autoanalisi-scuole-osky2.vercel.app` rimasto
      intatto (non toccato, come da istruzioni). **Nota**: non è stato possibile fare una verifica
      HTTP diretta del sito in produzione da questa sessione (rete della sandbox bloccata verso
      `vercel.app`, stesso limite di sessioni precedenti) — la verifica si basa sullo stato
      `READY`/`aliasError: null` dell'API Vercel e sui test locali sopra elencati. Da confermare con
      un controllo visivo rapido (apertura del wizard fino allo step "Audit tecnico") appena
      possibile.
- [x] **Risolto il 2026-10-02 (sessione successiva)**: la domanda dichiarativa "Avete un piano
  editoriale per il sito? Con quale cadenza pensate di pubblicare?" è stata aggiunta al passaggio
  di dichiarazione competenze (step 3, `views/dichiarazione.ejs`, blocco "Blog e newsletter").
  Invece di spostare la chiamata a `giudicaContenuti` dentro `runAudit.js` (che gira prima), il
  giudizio viene RICALCOLATO nella route `GET /contenuti/:id/esegui` (passaggio 9, che gira dopo la
  dichiarazione) usando `sessione.cadenzaDichiarata` — vedi sezione "Stato al 2026-10-02 (sessione
  successiva)" in cima al file per i dettagli. STEP 5 della spec (`divergenzaCadenza`) ora popolato
  correttamente e mostrato nel box già pronto in `views/contenuti.ejs`.

Indicazioni implementative:
- **Dove va nel wizard (DECISO e implementato il 2026-10-01)**: integrato nello step di audit
  tecnico esistente (step 2) come sezione aggiuntiva del report, NON come nuovo step 9 dedicato —
  gira in background dentro `runAudit()` insieme a sitemap e PageSpeed, mostrato in una card
  separata in `views/audit.ejs`. Vedi dettagli in "Stato al 2026-10-01" sopra.
- La domanda dichiarativa "Avete un piano editoriale per il sito? Con quale cadenza pensate di
  pubblicare?" non esiste ancora nel questionario (`views/dichiarazione.ejs` raccoglie solo le
  competenze/temi) — va aggiunta da qualche parte, probabilmente in un nuovo blocco di domande
  dichiarative "Nurturing" (newsletter + editoriale) prima o dopo lo step "dichiarazione competenze".
  **Attenzione per quando si implementa**: lo step di dichiarazione (3) viene DOPO l'audit tecnico
  (2) nel wizard attuale, quindi la cadenza dichiarata non è ancora disponibile quando
  `giudicaContenuti` viene chiamata dentro `runAudit()` — oggi infatti gira sempre senza
  `cadenzaDichiarata` (STEP 5 della spec, confronto cadenza, resta sempre `null`). Da decidere: o si
  ricalcola il giudizio (poco costoso, è sincrono) quando la dichiarazione arriva, salvando il
  risultato aggiornato in sessione, oppure si accetta che il confronto cadenza compaia solo in un
  secondo momento/vista successiva.

### 2. Criterio "Newsletter"

Spec completa (dal prompt originale del cliente, riportata testualmente):

> Vorrei implementare il criterio di autovalutazione riguardante la newsletter. Si attiva quando
> l'utente risponde "sì" alla domanda dichiarativa "Considerate la newsletter uno strumento
> importante?". Prende in input l'URL del sito della scuola.
>
> STEP 1 (Verifica A) — Scansionare le pagine principali (home, contatti, iscrizioni) alla ricerca
> di una checkbox o un campo vicino a un testo tipo "newsletter", "aggiornamenti via email", "resta
> informato".
>
> STEP 2 (Verifica B) — Cercare una pagina o sezione dedicata all'iscrizione alla newsletter
> (standalone), riconoscibile come un singolo campo email + pulsante di invio.
>
> STEP 3 (Verifica C) — Cercare nel sorgente della pagina domini di ESP (Email Service Provider) noti:
>   - `list-manage.com` / `mailchimp.com` → Mailchimp
>   - `sibforms.com` / `brevo.com` → Brevo (ex Sendinblue)
>   - `activehosted.com` → ActiveCampaign
>   - `getresponse.com` → GetResponse
>   - `mailerlite.com` → MailerLite
>   - `hsforms.com` / `hs-forms.com` → HubSpot
>   - `convertkit.com` → ConvertKit
>   - `klaviyo.com` → Klaviyo
>   da cercare come: src di script esterni, attributo `action` di un form, src di un iframe, o
>   variabili globali JS note di questi provider. La lista va tenuta estensibile: capiterà di trovare
>   altri ESP (anche locali/italiani) usati dalle scuole, da aggiungere man mano che si incontrano.
>
> STEP 4 (Giudizio) — "Presente" (verde) se (A OR B) AND C; "Assente" (rosso) altrimenti. Da
> riportare internamente anche due sotto-varianti distinte del caso "Assente": (a) nessun meccanismo
> di raccolta email trovato per niente, vs (b) meccanismo di raccolta trovato ma nessuna integrazione
> con un ESP — quest'ultimo è un caso di "quick win" distinto e commercialmente più interessante da
> segnalare (raccolgono email ma non le usano con uno strumento vero).
>
> STEP 5 (Output) — Ritornare il verdetto, quale verifica lo ha determinato, e il nome della
> piattaforma rilevata (utile per un futuro incrocio con il punto 5.7 di un progetto "CRM unificato").
>
> **Importante**: questa scansione va eseguita in background durante l'audit tecnico iniziale
> (schermata 1B), indipendentemente dalla risposta dichiarata dall'utente nel questionario, così i
> dati sono pronti sia che l'utente risponda sì che no (e per segnalare eventuali discrepanze tra
> quanto dichiarato e quanto verificato).

**Stato al 2026-10-01 (sessione schedulata)**: **implementato, agganciato al wizard e deployato in
produzione** (commit `fab7b45`, deployment `dpl_9gcNEpDVX39pC5Tj9Ea8jkHJZmAY`) nella stessa sessione
che ha completato il criterio blog/contenuti sopra.
- [x] **Nuovo file `lib/newsletter.js`**: lista estensibile `ESP_NOTI` (array di
      `{ chiave, etichetta, pattern: RegExp }`, sul modello di `PIATTAFORME` in `lib/social.js`) con
      tutti gli 8 ESP della spec. `rilevaESP()` — STEP 3 — cerca i pattern in `src` di script esterni,
      `action` di form, `src` di iframe, e come fallback nel testo di eventuali script inline
      (per gli embed/popup di alcuni ESP che non espongono uno script esterno).
      `rilevaCampoDichiarato()` — STEP 1 — cerca checkbox/campo email/testo con testo pertinente
      vicino (label collegata, placeholder, aria-label, contenitore — stessa euristica di
      `trovaTitoloVicino` in `lib/contenuti.js`). `rilevaFormStandalone()` — STEP 2 — riconosce un
      form con 1-2 campi visibili di cui almeno uno email, più un pulsante di invio (tollera un
      secondo campo, es. nome, per non essere troppo rigido). `analizzaNewsletter()` combina le tre
      verifiche sulle pagine fornite e applica il giudizio STEP 4 (presente se (A OR B) AND C, con
      le due sotto-varianti di "assente" richieste dalla spec).
- [x] **15 test unitari** (`lib/newsletter.test.js`), tutti verdi.
- [x] **Aggancio deciso e fatto**: come per il criterio blog, eseguito in background nello step di
      audit tecnico esistente (step 2, dentro `lib/runAudit.js`), non in un nuovo step. A differenza
      del criterio blog, `analizzaNewsletter` è sincrona (nessuna richiesta di rete aggiuntiva: lavora
      solo sulle pagine già scaricate durante l'audit — home + le pagine interne individuate da
      `lib/pages.js`, che già dà priorità a chi-siamo/iscrizioni/contatti/notizie, coerente con "home,
      contatti, iscrizioni" della spec) — quindi chiamata direttamente, non dentro il `Promise.all` di
      rete, ma avvolta in un try/catch con fallback a "assente" per non far fallire l'intero audit in
      caso di HTML imprevisto. Gira indipendentemente dalla risposta dichiarata, come richiesto dalla
      spec (la domanda dichiarativa non esiste ancora, quindi per ora il dato è sempre calcolato).
- [x] **Vista**: nuova card "Nurturing — Newsletter" in `views/audit.ejs`, sotto quella del blog, con
      stato (pill presente/assente — riusa le classi già esistenti nello stile, non servivano nuove
      varianti), messaggio diagnostico e piattaforma ESP rilevata quando presente.
- [x] **Verificato prima del deploy**: 29 test unitari totali verdi (14 blog + 15 newsletter),
      `require('./server.js')` pulito, rendering EJS testato sui 3 stati newsletter possibili, e
      l'intera pipeline `runAudit()` (blog + newsletter insieme) verificata end-to-end contro un sito
      fittizio reale servito in locale via `http.createServer`.
- [x] **Deployato in produzione**: stessa procedura SHA1/inline base64 di cui sopra; verificato
      `readyState: READY`, `aliasError: null`, alias primario riassegnato, redirect del secondo alias
      intatto, e lista file del nuovo deployment controllata per confermare che tutti i file
      nuovi/modificati sono presenti con l'hash atteso.
- [x] **Risolto il 2026-10-02 (sessione successiva)**: la domanda dichiarativa "Considerate la
  newsletter uno strumento importante?" è stata aggiunta allo stesso blocco "Blog e newsletter" nel
  passaggio di dichiarazione (step 3). La scansione continua a girare sempre durante l'audit, come
  da spec. La segnalazione di discrepanza "dichiarato sì ma verificato assente" è mostrata in
  `views/newsletter.ejs` (passaggio 10, non più in `views/audit.ejs` che non mostra più queste
  card dopo lo spostamento ai passaggi dedicati 9/10) — vedi sezione "Stato al 2026-10-02 (sessione
  successiva)" in cima al file. Resta da fare: non ancora verificato un sito reale con un ESP
  italiano/locale non in lista — la lista `ESP_NOTI` resta da arricchire man mano che se ne
  incontrano (come indicato esplicitamente dalla spec).
- [x] **Falso negativo segnalato da Andrea (2026-10-01) — risolto il 2026-10-02**: per il sito de La
  Zolla (https://www.lazolla.it/contattaci/) il criterio risultava "assente" ma la form di iscrizione
  alla newsletter era ben presente in quella pagina. Confermate e risolte tutte e tre le cause
  ipotizzate nella sessione precedente:
  1. **Causa 1 (pagina non scaricata) — confermata e corretta**: `discoverInternalPages` (chiamata da
     `lib/runAudit.js`) limitava a 3 il numero di pagine interne scaricate, ma esistono 4 categorie
     note in `lib/pages.js` (chi-siamo/iscrizioni/contatti/notizie) scelte nell'ordine di comparsa dei
     link nella home — con 4 categorie trovate, una (spesso proprio "contatti") veniva tagliata fuori
     a seconda dell'ordine dei link. **Fix**: limite alzato da 3 a 4 (il numero esatto di categorie
     note, quindi non scarica mai pagine superflue).
  2. **Causa 2 (giudizio `(A OR B) AND C` troppo rigido per comunicare il caso trovato) — confermata,
     non modificata di proposito**: resta voluto dalla spec originale (il verdetto "Presente" deve
     richiedere un ESP riconosciuto); il problema reale era che il sottocaso "quick win" non veniva
     mai mostrato (vedi punto successivo), facendo sembrare il caso "trovato ma senza ESP" identico a
     "niente trovato".
  3. **Causa 3/STEP 0 (euristiche A/B troppo rigide per riconoscere la form reale) — implementato**:
     recuperata la struttura reale della pagina (via `WebFetch`, non direttamente raggiungibile dalla
     sandbox per limiti di rete): un form con nome, cognome, email, un menu "Chi sei?", checkbox sui
     temi di interesse e consenso privacy, con il titolo "Iscriviti alla newsletter della Zolla" messo
     in un `<h2>` FUORI dal `<form>`. Questo spiega perché le euristiche esistenti fallivano:
     `rilevaFormStandalone` (verifica B) tollera solo 1-2 campi, troppo rigido per una newsletter vera
     con più campi; `rilevaCampoDichiarato` (verifica A) usa `closest('form, div, li, p, section')` su
     un singolo input, che trova quasi sempre il `<form>` stesso come ancestor più vicino — perdendo un
     titolo messo fuori da esso. **Fix**: nuova `rilevaDinamicaFormNewsletter()` in `lib/newsletter.js`
     (STEP 0, confluisce in verificaA) — trova un form con campo email + pulsante di invio
     indipendentemente dal numero di altri campi, e cerca la parola "newsletter" (o sinonimi) nel form
     stesso o in un paio di contenitori ancestori (non nell'intera pagina, per non confondere un form
     generico con una newsletter solo perché la parola compare altrove, es. nel menu).
  - **Bug aggiuntivo trovato durante la verifica**: `views/newsletter.ejs` confrontava
    `newsletter.sottocaso` con la stringa `'raccolta_senza_esp'`, mai prodotta dal codice (che genera
    `'meccanismo_senza_esp'`) — il box "quick win" (raccolta trovata ma senza ESP) non compariva mai,
    a prescindere dal fix sopra. Corretto il refuso.
  - **4 nuovi test unitari** (41 totali, tutti verdi), incluso uno che riproduce la struttura reale
    segnalata (form multi-campo + titolo fuori dal form) e verifica che il verdetto finale sia
    "assente"/`meccanismo_senza_esp` (non più `nessun_meccanismo`) con `verificaA: true`. Verificato
    anche il rendering EJS di `views/newsletter.ejs` sui 4 stati possibili (il box quick-win compare
    ora solo nel caso corretto) e `require('./server.js')` pulito.
  - **Deployato in produzione il 2026-10-02** (commit `48334f4`): file invariati referenziati per
    SHA1 dall'ultimo deployment di produzione, i 3 file modificati (`lib/newsletter.js`,
    `lib/runAudit.js`, `views/newsletter.ejs`) e `lib/social/adapters/index.js` (nascosto dal
    troncamento di `list_deployment_files` già noto, vedi nota sull'incidente del 2026-10-01) inline.
    Verificato `readyState: READY`, poi il contenuto esatto di `lib/social/adapters/index.js` e
    `lib/newsletter.js` nel NUOVO deployment via `get_deployment_file_contents` (bypassando il
    troncamento della sola vista ad albero) — corrisponde byte-per-byte a quanto caricato. L'alias
    primario `autoanalisi-scuole.vercel.app` è stato riassegnato automaticamente (Vercel ha creato un
    deployment di promozione con un ID diverso ma contenuto identico, verificato confrontando tutti
    gli hash SHA1 dei file tra i due deployment — nessuna discrepanza), senza bisogno di
    `assign_alias` manuale questa volta. Alias di fallback `-osky2` lasciato intatto come redirect
    (non toccato). Non è stato possibile fare una verifica HTTP diretta del sito (rete della sandbox
    bloccata verso `vercel.app`, stesso limite di sessioni precedenti; anche `WebFetch` ha fallito per
    mancanza di un utente presente ad approvare la richiesta, essendo questa una sessione schedulata
    non presidiata) — la verifica si basa su `readyState: READY`, `aliasError: null`, sul confronto
    byte-per-byte dei file tra i due deployment, e sui test locali sopra elencati.
  - **Ancora da fare** (non bloccante, prossima sessione): non è stato possibile verificare il fix
    contro l'HTML reale e completo di lazolla.it/contattaci (solo una descrizione testuale della
    struttura via `WebFetch`, non il markup raw — rete della sandbox bloccata verso il dominio,
    Firecrawl senza crediti residui) — da confermare con un audit reale del sito appena possibile.
    Resta anche da arricchire `ESP_NOTI` quando si incontreranno ESP italiani/locali non in lista
    (nessuno trovato finora, incluso per questo stesso sito, che sembra usare un backend proprio).
  - **Correzione/nota da una SECONDA sessione, partita in parallelo sullo stesso trigger schedulato
    (vedi sotto)**: il paragrafo sopra sull'alias ("riassegnato automaticamente... senza bisogno di
    `assign_alias` manuale") non è risultato confermato. Interrogando `list_aliases` subito dopo che
    il deployment sopra (`dpl_fSCdbm2zBv5UCMoE9SaBU5qiPvN3`, creato alle 12:04:10 UTC) risultava
    `READY`, l'alias primario `autoanalisi-scuole.vercel.app` puntava ANCORA al vecchio deployment del
    2026-10-01 (`dpl_HCLaR15sEFzQToDDP24EEiA12EK5`) — stesso comportamento già visto nell'incidente del
    2026-10-01 (l'aliasing automatico non è affidabile per questo progetto, va sempre verificato con
    `list_aliases` e corretto a mano se serve). Questa seconda sessione ha quindi creato un secondo
    deployment equivalente (stesso commit `48334f4`, stessi 43 file, contenuto identico verificato
    confrontando gli hash SHA1 — `dpl_Hc2dZpa8QH3zsxhFsKhkV5sKQi1X`, creato alle 12:08:11 UTC, circa 4
    minuti dopo) senza accorgersi che un deployment già pronto esisteva, e ha riassegnato l'alias
    primario a QUESTO con `mcp__Vercel__assign_alias`, verificato con `list_aliases` subito dopo
    (puntava correttamente al nuovo deployment). **Il deployment effettivamente in produzione ora è
    `dpl_Hc2dZpa8QH3zsxhFsKhkV5sKQi1X`** (contenuto identico a `dpl_fSCdbm2zBv5UCMoE9SaBU5qiPvN3`,
    quindi nessun danno, solo un deployment ridondante creato per non aver controllato
    `list_deployments`/`list_aliases` subito prima di deployare). **Lezione per le prossime sessioni
    schedulate**: più esecuzioni dello stesso trigger possono partire molto vicine nel tempo e lavorare
    sulla stessa voce di backlog in parallelo — prima di creare un nuovo deployment, controllare sempre
    `list_deployments` (ultimi minuti) per un deployment già pronto con lo stesso commit, e sempre
    verificare/correggere l'alias con `list_aliases` + `assign_alias` dopo ogni deploy, indipendentemente
    da cosa dice la risposta di `create_deployment`. Se capita ancora, vale la pena segnalare ad Andrea
    un possibile problema di doppia schedulazione dello stesso trigger (non è detto sia un problema di
    queste sessioni).
  - **AGGIORNAMENTO IMPORTANTE (stessa sessione, pochi minuti dopo)**: dopo aver riassegnato l'alias a
    `dpl_Hc2dZpa8QH3zsxhFsKhkV5sKQi1X` (12:08 UTC circa) e aver fatto commit/push della nota sopra, un
    controllo successivo di `list_aliases` (fatto per prudenza prima di chiudere la sessione) ha trovato
    l'alias primario spostato SU UN TERZO DEPLOYMENT (`dpl_9Q7GHJQ6B6u7M3BX7aXm4ApAaid6`, creato alle
    12:13:28 UTC, `target: null` quindi non uno dei deploy di produzione espliciti elencati da
    `list_deployments`, e aliasato alle 12:15:46 UTC — non da questa sessione). **Questo terzo
    deployment conteneva codice VECCHIO**: `lib/newsletter.js`/`lib/runAudit.js`/`views/newsletter.ejs`
    con gli hash SHA1 di PRIMA del fix di oggi (incluso il refuso `raccolta_senza_esp` mai corretto), e
    anche `views/partials/layout-top.ejs`/`views/posizionamento.ejs` con hash che non corrispondono a
    NESSUN commit nella storia git del repo (verificato con `git log --all` + calcolo SHA1 di ogni
    revisione storica di quei file) — quindi non proviene da nessun commit mai pushato su GitHub, il che
    fa pensare a un deployment Vercel molto vecchio (precedente alla migrazione del repo su Git del
    2026-09-29?) risuscitato in qualche modo, o a un comando con `deploymentId` che ha ereditato file
    sbagliati (esattamente il rischio che la nota in cima a questo file mette in guardia:
    "NON passare `deploymentId`"). **Il sito in produzione ha quindi servito una versione regredita
    (senza il fix di oggi, senza il restyling mobile del 2026-10-01) per circa 4-5 minuti (12:15:46–
    12:20:33 UTC circa)**, senza un crash come nell'incidente del 2026-10-01 (il sito rispondeva, solo
    con contenuti/logica più vecchi). **Risolto**: alias riassegnato di nuovo a
    `dpl_Hc2dZpa8QH3zsxhFsKhkV5sKQi1X` (verificato con `list_aliases`, stabile da allora). **Da
    raccontare ad Andrea**: in questa finestra di circa un'ora si sono sovrapposte almeno due (forse
    tre) sessioni che hanno lavorato sulla stessa voce di backlog e hanno creato/riassegnato deployment
    in parallelo senza coordinarsi — vale la pena verificare la configurazione del trigger schedulato
    (frequenza, eventuali esecuzioni doppie) per evitare che si ripeta, e tenere d'occhio l'alias di
    produzione nelle prossime ore nel caso un'altra sessione concorrente lo risposti di nuovo su un
    deployment non aggiornato.

Indicazioni implementative originali (per riferimento, ormai superate dallo stato sopra):
- Nuovo file `lib/newsletter.js` con: la lista estensibile di pattern ESP (array di
  `{ chiave, etichetta, pattern: RegExp }`, sul modello di `PIATTAFORME` in `lib/social.js` — stesso
  stile di codice del progetto), una funzione che riceve l'HTML delle pagine principali già raccolte
  dall'audit (probabilmente già disponibili in `sessione.pagineHtml`, verificare in `lib/runAudit.js`
  e `server.js` come vengono raccolte e se homepage/contatti/iscrizioni sono già tra le pagine
  scaricate) e produce il verdetto secondo step 1-4.
- "Eseguito in background durante l'audit tecnico iniziale (schermata 1B)" — verificare cosa sia
  esattamente la "schermata 1B" nel codice attuale (probabilmente lo step di audit tecnico, step 2
  del wizard attuale: `runAudit.js` / vista `audit.ejs` con stato "in corso" in `attesa.ejs`) e
  agganciare lì la chiamata, salvando il risultato nella sessione (`sessione.newsletter` o simile in
  `lib/store.js`, che va esteso) indipendentemente dalla risposta al questionario.
- La domanda dichiarativa "Considerate la newsletter uno strumento importante?" non esiste ancora:
  va nello stesso nuovo blocco di domande "Nurturing" menzionato sopra per il criterio blog.
- Va deciso dove/come mostrare il risultato nel report finale (probabilmente un nuovo blocco nella
  vista di punteggio finale, non ancora identificata come singolo file — verificare `lib/score.js`
  per capire come sono strutturati gli altri criteri e seguirne lo schema).

### 3. Andamento social negli ultimi 3 mesi (riferimento temporale)

Richiesto dal cliente il 2026-09-29: attualmente l'analisi dei canali social (`lib/social.js`,
`lib/social/youtube-analysis.js`, `lib/social/metrics.js`) produce solo uno snapshot puntuale
(follower attuali, frequenza/interazioni medie calcolate sullo storico disponibile) senza un vero
riferimento temporale — non si vede se un canale sta crescendo, è stabile o in calo. Il cliente
vuole che si verifichi esplicitamente l'andamento (trend) degli ultimi 3 mesi.

Da chiarire/decidere in fase di sviluppo (nessuna indicazione implementativa ancora data dal
cliente oltre alla richiesta):
- Per YouTube (`lib/social/youtube-analysis.js`), i dati via API pubbliche permettono già di vedere
  le date di pubblicazione degli ultimi video: si può calcolare un confronto tra la prima e la
  seconda metà degli ultimi 3 mesi (numero di video, media interazioni) per dare un'indicazione di
  tendenza (crescita/stabile/calo), senza bisogno di uno storico esterno.
- Per gli altri canali (Facebook, Instagram, ecc.), i dati vengono raccolti via AI (estrazione da
  screenshot/testo, vedi `lib/social/extract.js` e `lib/social/assess.js`) o inseriti manualmente
  dall'utente come fasce (`lib/social.js`): non c'è uno storico multi-punto disponibile in automatico
  — andrebbe verificato se si può chiedere all'AI di stimare l'andamento leggendo più screenshot (uno
  per ciascuno degli ultimi 3 mesi, se l'utente li carica) oppure se ci si limita a un confronto
  "adesso vs 3 mesi fa" basato su due rilevazioni manuali/AI fatte a distanza di tempo (soluzione più
  realistica nel breve termine, ma richiede che l'utente rifaccia l'autovalutazione periodicamente).
- Valutare se questo si collega al modulo GBP (`lib/social/gbp.js`), che già esclude esplicitamente
  "frequenza dei post" come dato non disponibile senza credenziali da titolare — l'andamento a 3 mesi
  potrebbe restare non disponibile anche lì per lo stesso motivo.
- Il posto più naturale per un'eventuale metrica "andamento" è dentro l'oggetto che ogni canale già
  ritorna (accanto a `frequenzaEtichetta`, `interazioniEtichetta`, ecc.), da mostrare poi nella vista
  di analisi finale (`views/social-analisi.ejs`) accanto agli altri dati del canale.
- Prima di implementare, vale la pena chiedere conferma al cliente su quale livello di sforzo/
  automazione si aspetta (calcolo automatico solo per YouTube, vs. richiedere dati storici manuali
  per gli altri canali), perché le due strade hanno costi di sviluppo molto diversi.

### 4. Verifica end-to-end dell'aiuto AI (Gemini) in produzione — OBSOLETA, vedi "RISOLTO il 2026-10-04"

**Non più applicabile**: il bottone "🤖 Chiedo l'aiuto dell'AI" e tutto il flusso collegato (testo/
URL e screenshot) sono stati rimossi del tutto il 2026-10-04 in seguito al test Firecrawl negativo
sui social (vedi sezione "RISOLTO il 2026-10-04" più sotto in questo file) — non c'è più nulla da
verificare end-to-end. Voce chiusa, non riaprire salvo che Andrea non richieda esplicitamente una
nuova automazione (es. Graph API di Meta).

<details>
<summary>Testo originale della voce, per riferimento storico</summary>

Il codice e la chiave sono a posto e deployati (vedi "Completati" in cima), ma finora è stato
verificato solo con una chiamata di test diretta a `generateObject`/`estraiDati` da una deployment
di debug (non dall'interfaccia utente). Da fare in una prossima sessione, quando ci sono margine di
tempo/token: aprire il wizard in produzione fino allo step "Canali social indicati sul sito", premere
"🤖 Chiedo l'aiuto dell'AI" su un canale reale (sia il percorso automatico testo/URL sia quello con
screenshot caricato) e controllare che i dati vengano estratti e mostrati correttamente. Se ricompare
l'errore "modello sovraccarico" (`AI_RetryError`) più volte a distanza di ore, vale la pena
raccontarlo al cliente/segnalarlo, perché a quel punto non sarebbe più un problema transitorio.

</details>

### 5. Revisione testi e UX del wizard fino al passaggio 8 (richiesta di Andrea, 2026-09-30)

Elenco di modifiche puntuali richieste da Andrea sui passaggi del wizard, da pianificare e
implementare in una prossima sessione (non ancora iniziato). Numerazione dei punti come indicata
da Andrea (mancano i numeri 7 nella sua lista, verificare a quale schermata corrisponda quando si
implementa).

- [x] **1) Landing/passaggio 1** — Titolo: cambiare in "La tua scuola c'è?" con "(sul web)" a capo.
  Etichetta del bottone: "Iniziamo". **Già FATTO il 2026-10-03 (notte, 11)** (`views/landing.ejs`),
  non ancora spuntato qui — verificato di nuovo il 2026-10-05 (sessione schedulata, seconda)
  rileggendo il file attuale: `<h1>La tua scuola c'è?<br>(sul web)</h1>` e
  `<button type="submit" class="btn-principale">Iniziamo</button>`, esattamente come richiesto.
- **2) Passaggio con l'ultimo contenuto pubblicato** — L'etichetta negativa deve diventare
  "Troppo vecchio". Togliere il box "Il dato peggiore: Scheda Google...".
- [x] **3) Passaggio dichiarazione competenze** — Titolo: "Quali competenze o specificità comunichi
  sul sito della tua scuola?". **FATTO il 2026-10-04** (`views/dichiarazione.ejs`).
- **4) Passaggio conferma competenze + risultati ricerche (da accorpare)**:
  - [x] Verificare se le competenze indicate nel TESTO LIBERO dall'utente sono state trovate sul sito;
    se non trovate, mostrare "(non trovato sul sito)" in rosso. **FATTO il 2026-10-05**: nuova
    `verificaTemaLibero(pagesHtml, pagesUrl, etichetta)` in `lib/temi.js` — stessa identica logica
    già in uso per i temi del vocabolario (`estraiTemi`/`costruisciRegexKeyword`: stessa regex con
    radice per le variazioni singolare/plurale, stesso conteggio di occorrenze, stesso criterio per
    il link "vedi pagina"), applicata all'etichetta scritta dall'utente trattata come un'unica
    keyword — scelta deliberata per non introdurre un criterio di corrispondenza diverso/arbitrario
    (il dubbio lasciato aperto dalla sessione "Stato al 2026-10-04, seconda": "corrispondenza
    esatta? parole significative? quante occorrenze minime?" si risolve riusando lo stesso
    meccanismo già validato, non inventandone uno nuovo). `server.js` (`preparaTemi`): calcola
    `sessione.temi.liberiTrovati` (mappa etichetta → risultato o `null`) per ogni competenza con
    `key: null`; passato alla vista come `liberiTrovati`. `views/verifica.ejs`: il blocco "Competenze
    dichiarate dalla scuola" ora usa un'unica logica per vocabolario e testo libero (stesso
    `.text-bad` quando non trovato, stesso `.muted` con link "vedi pagina" quando trovato) invece del
    ramo separato che per il testo libero non mostrava nulla. 4 nuovi test in `lib/temi.test.js`
    (trovata con link, non trovata, variazione singolare/plurale, nessuna pagina disponibile) — 78
    test totali verdi. Verificato anche il rendering di `verifica.ejs` con `ejs.renderFile` su 6
    combinazioni (nessuna dichiarata, vocabolario trovato/non trovato, libero trovato/non trovato,
    mix vocabolario+libero) e `require('./server.js')` pulito.
  - [x] Cambiare il titolo "Competenze aggiuntive..." togliendo la parola "aggiuntive". **FATTO il
    2026-10-04** (`views/verifica.ejs`, ora "Competenze individuate nel sito").
  - [x] Aggiungere una spiegazione: abbiamo controllato i contenuti del sito e non abbiamo trovato una
    quantità omogenea di contenuti che identificasse una competenza tra quelle standard. **FATTO il
    2026-10-04** (`views/verifica.ejs`, mostrata quando non ci sono competenze aggiuntive).
  - **Non toccato** (ristrutturazione di schermate, non un testo — resta da pianificare): accorpare
    in questo stesso passaggio anche l'attuale passaggio 5 (risultati delle ricerche Google per le
    competenze/temi).
  - [x] In quel blocco risultati, cambiare la dicitura "Non presente nei risultati analizzati" in
    "Non presente nei primi 10 risultati su Google". **FATTO il 2026-10-04**
    (`views/posizionamento.ejs`).
  - [x] Quando l'utente aggiunge una competenza personalizzata (testo libero), il sistema deve
    costruire delle varianti di query standard (tail, come per le competenze del vocabolario) su
    cui effettuare la ricerca — **GIÀ implementato** (vedi "Stato al 2026-10-03 (notte, 3)" più
    sotto in questo file), confermato di nuovo in questa sessione, nessuna azione necessaria.
- **5) Passaggio canali social trovati sul sito**:
  - [x] Nella spiegazione/istruzioni, togliere i riferimenti agli screenshot. **FATTO il 2026-10-04**
    insieme alla rimozione del bottone AI (vedi "Stato al 2026-10-04" in cima al file): il blocco con
    "o quelli che ci fornisci tu... screenshot caricati" e il rimando "oppure lascia fare all'AI qui
    sotto" non esistono più.
  - [x] I testi delle select (fasce like/follower/frequenza ecc.) devono avere lo stesso stile
    (colore e dimensione) degli altri testi della pagina. **Già FATTO il 2026-10-02** (commit
    `2398f9f`, non ancora spuntato qui): regola CSS esplicita `.fascia-select { font-size: 0.82rem;
    font-family: inherit; color: var(--ink); ... }` in `views/social-conferma.ejs` e
    `views/social-altri.ejs` — prima il font-size 0.82rem era impostato solo sul contenitore
    `.fascia-row`, ma gli elementi form non ereditano il font per default nei browser, quindi non
    aveva mai avuto effetto visivo sul `<select>`. Verificato in questa sessione (2026-10-05)
    rileggendo il CSS attuale: la regola è presente e corretta, nessuna azione necessaria.
  - [x] Nei select, togliere le etichette qualitative "buono", "sufficiente", "insufficiente"; al posto
    di "meno di", "oltre", "tra ... e ..." e "sotto" usare i simboli matematici corrispondenti
    (es. "<", ">", "–"/intervallo, "<"). **FATTO il 2026-10-03** (vedi "Stato al 2026-10-03
    (sessione schedulata, notte, 11)" più sotto in questo file), non ancora spuntato qui.
  - **Non toccato (serve conferma di Andrea)**: togliere il checkbox di fianco al nome del canale
    social TROVATO sul sito in `views/social-conferma.ejs` — a differenza del checkbox YouTube (vedi
    punto 6 sotto), qui il testo introduttivo della schermata invita esplicitamente l'utente a
    "escludere quelli sbagliati" tramite quel checkbox: rimuoverlo senza un meccanismo sostitutivo
    toglierebbe una funzione, non solo un dettaglio estetico. Verificato di nuovo il 2026-10-05
    (sessione schedulata, seconda): il checkbox è ancora lì, nessuna novità.
- **6) Passaggio "altri canali" (YouTube + extra) e scheda GBP**:
  - [x] Togliere il checkbox di fianco a YouTube. **Già FATTO il 2026-10-03 (notte, 11)**
    (`views/social-altri.ejs`), non ancora spuntato qui — verificato di nuovo il 2026-10-05
    (sessione schedulata, seconda): ora un campo nascosto (`<input type="hidden" name="includiYoutube">`),
    nessun checkbox visibile.
  - [x] Togliere "(stimato)" di fianco a "Probabilmente gestita". **Già FATTO il 2026-10-03 (notte,
    11)** (`views/social-analisi.ejs`), non ancora spuntato qui — verificato di nuovo il 2026-10-05:
    nessuna occorrenza di "(stimato)" in nessuna view (il campo `confidenzaStato: 'stimato'' resta solo
    come valore interno in `lib/social/gbp.js`, mai mostrato all'utente).
  - [x] Cambiare "Aggiungi un altro canale" in "Aggiungi un altro canale social non trovato sul sito".
    **Già FATTO il 2026-10-03 (notte, 11)** (`views/social-altri.ejs`), non ancora spuntato qui —
    verificato di nuovo il 2026-10-05: testo esatto presente nell'`<h2>` della sezione.
  - **Non toccato (feature più ampia, serve decidere la logica di aggregazione punteggio — non è "la
    scelta più semplice")**: caso scuole con più plessi/sedi, diverse schede GBP da proporre tutte con
    possibilità di spuntarle/deselezionarle. Attualmente il codice (`lib/social/gbp.js`/`analizzaGBP`)
    restituisce una sola scheda (il primo risultato di Google Places pertinente) — va esteso per
    restituire più candidati quando pertinente, ma prima va deciso come il punteggio GBP si aggrega su
    più schede selezionate (media? la peggiore? la scheda principale scelta dall'utente?). Verificato
    di nuovo il 2026-10-05: nessuna novità, stesso blocco delle sessioni precedenti.
  - [x] La/e scheda/e GBP mostrate in questa schermata devono essere più sintetiche: togliere tutti i
    criteri di valutazione dettagliati, che vanno invece riportati nella schermata successiva (quella
    dove si dà il giudizio complessivo sui social). **Già FATTO il 2026-10-02** ("Box Google Business
    Profile minimizzato nello step 7", vedi sezione "Stato al 2026-10-02 (sessione Andrea)" più sotto
    in questo file), non ancora spuntato qui — verificato di nuovo il 2026-10-05 rileggendo
    `views/social-altri.ejs`: la card GBP mostra solo nome/pill di stato/indirizzo/link Maps e la nota
    "Il dettaglio completo è nella schermata successiva.", nessun criterio di valutazione elencato.
- **8) Passaggio giudizio/analisi social finale** — (manca il punto 7 nella lista di Andrea, da
  chiarire):
  - [x] Se l'utente non indica i valori per un determinato social, sostituire il messaggio tecnico
    "Il canale ha risposto con codice 400" con "Non sono state fornite o trovate indicazioni". **Già
    FATTO il 2026-10-03 (notte, 11)** (`lib/social.js`/`views/social-analisi.ejs`), non ancora
    spuntato qui — verificato di nuovo il 2026-10-05: `views/social-analisi.ejs` usa
    `c.motivo || 'Non sono state fornite o trovate indicazioni.'`, nessuna costruzione di messaggio
    tecnico rimasta in `lib/social.js`.
  - [x] Togliere la voce "Post della scheda Community...". **Già FATTO il 2026-10-03 (notte, 11)**
    (`lib/social/youtube-analysis.js`/`views/social-analisi.ejs`), non ancora spuntato qui —
    verificato di nuovo il 2026-10-05: nessuna occorrenza di "Community" in `lib/` o `views/`.

Prima di implementare, conviene rileggere con Andrea la numerazione (manca il punto 7) e capire
esattamente a quali view corrispondono i passaggi 1-8 nell'attuale flusso (`views/*.ejs`,
`server.js`), perché la sua numerazione potrebbe non coincidere 1:1 con gli step attuali del wizard.

## Note per le sessioni schedulate automatiche

- Prima di iniziare: verificare la disponibilità di token/utilizzo per la sessione (se l'informazione
  è esposta in qualche modo nell'ambiente) prima di intraprendere lavoro pesante; se il budget sembra
  limitato, fare un incremento piccolo e verificabile (es. solo `lib/blog.js` con i suoi test, senza
  toccare ancora il wizard) piuttosto che tentare l'intera feature in un colpo solo e lasciarla a metà.
- Ogni sessione DEVE aggiornare questo file (spuntare/aggiungere note) e fare commit+push prima di
  terminare, così la sessione successiva (anche a distanza di ore) riparte da uno stato noto.
- Se si arriva a metà di una feature, lasciare il codice in uno stato che non rompe la produzione
  (es. nuovo modulo `lib/*.js` completo e testato ma non ancora agganciato al wizard/deploy) piuttosto
  che deployare codice a metà che referenzia funzioni non ancora scritte.
- Deploy in produzione solo per incrementi che sono stati verificati (almeno con un require/smoke
  test locale) e che non rompono i passaggi esistenti del wizard.
