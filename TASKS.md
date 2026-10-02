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

### 4. Verifica end-to-end dell'aiuto AI (Gemini) in produzione

Il codice e la chiave sono a posto e deployati (vedi "Completati" in cima), ma finora è stato
verificato solo con una chiamata di test diretta a `generateObject`/`estraiDati` da una deployment
di debug (non dall'interfaccia utente). Da fare in una prossima sessione, quando ci sono margine di
tempo/token: aprire il wizard in produzione fino allo step "Canali social indicati sul sito", premere
"🤖 Chiedo l'aiuto dell'AI" su un canale reale (sia il percorso automatico testo/URL sia quello con
screenshot caricato) e controllare che i dati vengano estratti e mostrati correttamente. Se ricompare
l'errore "modello sovraccarico" (`AI_RetryError`) più volte a distanza di ore, vale la pena
raccontarlo al cliente/segnalarlo, perché a quel punto non sarebbe più un problema transitorio.

### 5. Revisione testi e UX del wizard fino al passaggio 8 (richiesta di Andrea, 2026-09-30)

Elenco di modifiche puntuali richieste da Andrea sui passaggi del wizard, da pianificare e
implementare in una prossima sessione (non ancora iniziato). Numerazione dei punti come indicata
da Andrea (mancano i numeri 7 nella sua lista, verificare a quale schermata corrisponda quando si
implementa).

- **1) Landing/passaggio 1** — Titolo: cambiare in "La tua scuola c'è?" con "(sul web)" a capo.
  Etichetta del bottone: "Iniziamo".
- **2) Passaggio con l'ultimo contenuto pubblicato** — L'etichetta negativa deve diventare
  "Troppo vecchio". Togliere il box "Il dato peggiore: Scheda Google...".
- **3) Passaggio dichiarazione competenze** — Titolo: "Quali competenze o specificità comunichi
  sul sito della tua scuola?".
- **4) Passaggio conferma competenze + risultati ricerche (da accorpare)**:
  - Verificare se le competenze indicate nel testo libero dall'utente sono state trovate sul sito;
    se non trovate, mostrare la scritta "(non trovato sul sito)" in rosso.
  - Cambiare il titolo "Competenze aggiuntive..." togliendo la parola "aggiuntive".
  - Aggiungere una spiegazione: abbiamo controllato i contenuti del sito e non abbiamo trovato una
    quantità omogenea di contenuti che identificasse una competenza tra quelle standard.
  - Accorpare in questo stesso passaggio anche l'attuale passaggio 5 (risultati delle ricerche
    Google per le competenze/temi).
  - In quel blocco risultati, cambiare la dicitura "Non presente nei risultati analizzati" in
    "Non presente nei primi 10 risultati su G[oogle]".
  - Quando l'utente aggiunge una competenza personalizzata (testo libero), il sistema deve
    costruire delle varianti di query standard (tail, come per le competenze del vocabolario) su
    cui effettuare la ricerca — attualmente probabilmente le competenze aggiunte a mano non hanno
    query associate.
- **5) Passaggio canali social trovati sul sito**:
  - Nella spiegazione/istruzioni, togliere i riferimenti agli screenshot.
  - I testi delle select (fasce like/follower/frequenza ecc.) devono avere lo stesso stile
    (colore e dimensione) degli altri testi della pagina.
  - Nei select, togliere le etichette qualitative "buono", "sufficiente", "insufficiente"; al posto
    di "meno di", "oltre", "tra ... e ..." e "sotto" usare i simboli matematici corrispondenti
    (es. "<", ">", "–"/intervallo, "<").
  - Togliere il checkbox di fianco al nome del canale social trovato sul sito (probabilmente reso
    superfluo/ridondante da altro controllo).
- **6) Passaggio "altri canali" (YouTube + extra) e scheda GBP**:
  - Togliere il checkbox di fianco a YouTube.
  - Togliere "(stimato)" di fianco a "Probabilmente gestita".
  - Cambiare "Aggiungi un altro canale" in "Aggiungi un altro canale social non trovato sul sito".
  - **Caso scuole con più plessi/sedi**: una scuola con più plessi può avere diverse schede GBP.
    Bisogna proporle tutte in questa schermata, con la possibilità di spuntarle/deselezionarle,
    per permettere all'utente di "spegnere" le sedi che non sono di sua competenza o interesse.
    Attualmente il codice (`lib/social/gbp.js`/`analizzaGBP`) restituisce una sola scheda (il primo
    risultato di Google Places) — va esteso per restituire più candidati quando pertinente.
  - La/e scheda/e GBP mostrate in questa schermata devono essere più sintetiche: togliere tutti i
    criteri di valutazione dettagliati, che vanno invece riportati nella schermata successiva
    (quella dove si dà il giudizio complessivo sui social).
- **8) Passaggio giudizio/analisi social finale** — (manca il punto 7 nella lista di Andrea, da
  chiarire):
  - Se l'utente non indica i valori per un determinato social, sostituire il messaggio tecnico
    "Il canale ha risposto con codice 400" con "Non sono state fornite o trovate indicazioni".
  - Togliere la voce "Post della scheda Community...".

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
