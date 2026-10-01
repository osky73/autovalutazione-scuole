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

## Come deployare

Il progetto Vercel NON è collegato via Git integration: i deploy si fanno con
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
- **Ancora da fare** (prossima sessione, non bloccante): la domanda dichiarativa "Avete un piano
  editoriale per il sito? Con quale cadenza pensate di pubblicare?" (nuovo blocco "Nurturing" nel
  questionario `views/dichiarazione.ejs` o successivo) non esiste ancora — finché non c'è,
  `giudicaContenuti` viene chiamata senza `cadenzaDichiarata` e il confronto STEP 5 resta sempre
  `null` (comportamento corretto e documentato, nessun bug). Una volta aggiunta la domanda, passarla
  a `giudicaContenuti` in `runAudit.js` (richiede spostare quella chiamata dopo la dichiarazione, o
  ricalcolare il giudizio quando la dichiarazione arriva, visto che oggi gira durante l'audit che la
  precede nel wizard — da decidere la soluzione migliore quando si implementa la domanda).

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
- **Ancora da fare** (prossima sessione, non bloccante): la domanda dichiarativa "Considerate la
  newsletter uno strumento importante?" (stesso futuro blocco "Nurturing" del questionario, insieme
  alla domanda sulla cadenza editoriale del criterio blog) — per ora la scansione gira sempre, come
  previsto dalla spec per quando la domanda non è ancora stata risposta/non esiste. Da decidere anche
  dove mostrare un'eventuale segnalazione di discrepanza "dichiarato sì ma verificato assente" una
  volta che la domanda esisterà (probabilmente nella stessa card di `views/audit.ejs`, sul modello
  del box di divergenza cadenza del criterio blog). Non ancora verificato un sito reale con un ESP
  italiano/locale non in lista — la lista `ESP_NOTI` resta da arricchire man mano che se ne incontrano
  (come indicato esplicitamente dalla spec).

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
