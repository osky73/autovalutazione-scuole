## Nota sulla struttura di questo file (2026-11-13)

Questo file era cresciuto a oltre 5000 righe (~440KB) di log giornalieri quasi identici
("nessuna voce di backlog azionabile..."), al punto da non poter più essere letto per intero in
una singola chiamata dagli strumenti di lettura di una sessione — cioè l'esatto contrario dello
scopo di questo file ("fonte di verità" da leggere per intero a ogni sessione, vedi istruzioni
della sessione schedulata). In questa sessione (2026-11-13, pomeriggio) lo storico completo è stato
spostato **senza perdere nulla** in `TASKS_ARCHIVE.md` (copia 1:1 del vecchio `TASKS.md`, stesse
5191 righe), e questo file è stato ridotto a: stato corrente, promemoria attivi, backlog ("Da fare")
e procedura di deploy. Le sessioni future:
- leggono SOLO questo file per intero (ora leggero, nessun troncamento);
- consultano `TASKS_ARCHIVE.md` solo se serve il dettaglio storico di una feature già completata
  (es. "come è stato implementato esattamente il criterio newsletter il 2026-10-01/02", o i dettagli
  dell'incidente del 2026-10-01) — con una ricerca testuale mirata, non una lettura integrale;
- continuano ad aggiungere qui una breve voce di stato a fine sessione (poche righe, non un
  resoconto di decine di righe come in passato) — se la voce diventa lunga/storica, conviene
  spostarla in `TASKS_ARCHIVE.md` nella sessione successiva per mantenere questo file leggero nel
  tempo, invece di lasciarlo crescere indefinitamente come prima.

## Stato al 2026-11-13 (sessione schedulata, pomeriggio)

- **Repo e ambiente**: clonato/aggiornato (`git pull` già allineato a `main`, nessun commit umano
  nuovo), `npm install` eseguito (mancavano i moduli, prima installazione in questa sandbox), tutti i
  **99 test unitari verdi** (`npm test`) e `node -e "require('./server.js')"` pulito — il codice in
  produzione risulta sano, nessuna regressione.
- **Verificato lo stato dei due criteri assegnati da questa automazione (blog/contenuti e
  newsletter)**: **entrambi già completi e deployati in produzione** da sessioni precedenti
  (2026-10-01/02, vedi `TASKS_ARCHIVE.md` per il dettaglio di implementazione/test/deploy) — tutte le
  voci della sezione "Da fare" punti 1 e 2 sono spuntate `[x]`. **Nessuna voce di backlog azionabile
  nello scope assegnato** (il prompt di questa automazione limita il lavoro di codice a questi due
  criteri, saltando le voci già completate) — confermato leggendo `TASKS.md` per intero, non solo
  fidandosi delle note delle sessioni precedenti.
- **Connettore Vercel**: non raggiungibile anche in questa sessione, ma con un errore diverso dalle
  sessioni precedenti (non più "accesso negato al team", ma un errore di connessione/dialing (502)
  verso il server MCP — stesso tipo di errore su molti altri connettori contemporaneamente in questa
  sessione, quindi probabilmente un problema infrastrutturale lato ambiente di questa sessione, non
  necessariamente lo stesso problema di permessi segnalato nei giorni scorsi). **Nota importante
  emersa rileggendo questo file per intero**: da quando il progetto Vercel è collegato via Git
  integration (2026-10-02 sera, vedi "Come deployare" sotto), il connettore Vercel non è più
  necessario per EFFETTUARE un deploy (basta `git push origin main`) — serve solo per VERIFICARE lo
  stato del deployment e degli alias via API. Dato che in questa sessione non c'era comunque nessuna
  modifica di codice da deployare, l'indisponibilità del connettore non ha bloccato nulla di
  concreto oggi.
- **Nessuna riga di codice applicativo toccata** (nessuna voce di backlog azionabile nello scope
  assegnato). **Nessuna notifica inviata**: una sessione schedulata precedente di oggi ha già
  avvisato Andrea dello stallo sul connettore Vercel; nessuna novità sostanziale da aggiungere
  rispetto a quella notifica.
- **Unico lavoro svolto in questa sessione**: la pulizia/riorganizzazione di questo file descritta
  nella nota qui sopra (nessun impatto sul codice applicativo, nessun deploy necessario).


## ⚠️ SITO BLOCCATO AI MOTORI DI RICERCA (dal 2026-10-04, richiesta di Andrea) — RICORDARE ALL'UTENTE

Finché questa nota c'è, `autoanalisi-scuole.vercel.app` NON deve comparire su Google: header `X-Robots-Tag: noindex...` su
ogni risposta (`server.js`), `<meta name="robots" content="noindex...">` in `views/partials/layout-top.ejs`,
`GET /robots.txt` con `Disallow: /`. **Ricordare ad Andrea, a ogni sessione e prima di qualsiasi lancio/promozione,
che il sito è bloccato**. Per sbloccarlo (solo se Andrea lo chiede): togliere i tre punti sopra e rimettere robots.txt permissivo.

## 📌 DA FARE — Privacy policy (richiesta di Andrea, 2026-10-05)

Bisogna **creare una privacy policy** per la piattaforma. Serve in particolare perché il modulo di contatto (passaggio 13) raccoglie
nome, cognome, telefono e un messaggio, e perché l'app analizza siti e profili della scuola e usa servizi esterni (Serper, Google
Places/PageSpeed, ecc.). Punti da definire con Andrea prima di scriverla: chi è il titolare del trattamento (dati e indirizzo da
indicare), quali dati vengono trattati e perché (modulo di contatto, dati inseriti nel percorso, obiettivi), per quanto tempo si
conservano (oggi i dati stanno solo in memoria sul server e si perdono al riavvio), quali servizi esterni li ricevono, i diritti
dell'interessato e come esercitarli, cookie/tracciamento (oggi non risultano usati). Collocazione prevista: pagina `/privacy` con
link nel piè di pagina di tutte le schermate e vicino al modulo di contatto (con una dicitura di consenso). Nota: non sono un
avvocato: il testo andrebbe fatto rivedere da un professionista prima della pubblicazione.

## 🕓 DA VALUTARE IN UN SECONDO MOMENTO (non iniziare senza Andrea)

- **Invio e-mail dal server (oltre al `mailto:` del modulo di contatto)** — segnato da Andrea il 2026-10-05. Vercel non ha un
  server di posta: servirebbe un servizio esterno. Opzione discussa: **SMTP di Gmail** (`smtp.gmail.com`, porta 465 SSL o 587
  STARTTLS, utente = indirizzo Gmail, password = "password per le app" a 16 caratteri, richiede la verifica in due passaggi;
  parametri da ricontrollare sulla guida ufficiale prima di usarli). Credenziali SOLO come variabili d'ambiente su Vercel
  (mai nel codice né in chat). Limiti: mittente = account di Andrea, non il dirigente (per questo il modulo usa `mailto:`);
  limite giornaliero di invii di un Gmail personale. Alternative più adatte se i volumi crescono: Resend, Brevo, SendGrid.
  Possibile uso futuro: invio automatico del report finale al dirigente.

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
- [x] **2) Passaggio con l'ultimo contenuto pubblicato** — L'etichetta negativa deve diventare
  "Troppo vecchio". Togliere il box "Il dato peggiore: Scheda Google...". **FATTO il 2026-10-23
  (sessione schedulata)**: la parte sull'etichetta negativa era già risolta indirettamente (il
  vecchio indicatore "Ultimo contenuto pubblicato" è stato rimosso dal punteggio il 2026-10-02, non
  esiste più alcuna etichetta negativa da rinominare); il box "Il dato peggiore" è stato rimosso da
  `views/audit.ejs` (commit `f044e82`, deployato in produzione) — vedi sezione di stato in cima al
  file per i dettagli. La logica di calcolo (`audit.worst` in `lib/score.js`) resta invariata, perché
  usata internamente dalla schermata finale "punti deboli e contatto".
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
