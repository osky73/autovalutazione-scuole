# Backlog — autoanalisi-scuole

Questo file è la fonte di verità per il lavoro pianificato su questa app. Ogni sessione (anche quelle
schedulate automaticamente al mattino/pomeriggio) deve leggerlo per intero prima di iniziare, e
aggiornarlo (spuntando le voci fatte, annotando decisioni prese) prima di terminare.

Repo: https://github.com/osky73/autovalutazione-scuole (branch `main`)
Produzione: https://autoanalisi-scuole.vercel.app e https://autoanalisi-scuole-osky2.vercel.app
(stesso progetto Vercel, due alias sullo stesso deployment)

## Come deployare

Il progetto Vercel NON è collegato via Git integration: i deploy si fanno con
`mcp__Vercel__create_deployment`, passando `files` come lista di `{file, sha}` per i file INVARIATI
(referenziati per hash, senza doverne rimandare il contenuto — Vercel li ha già in blob storage da
deploy precedenti) e `{file, data, encoding:"utf-8"}` per i file nuovi o modificati. NON passare
`deploymentId` (si è visto essere inaffidabile nell'ereditare i file). Passare `target: "production"`.
Dopo che lo stato è `READY` (poll con `mcp__Vercel__get_deployment`), verificare che entrambi gli
alias puntino al nuovo deployment con `mcp__Vercel__assign_alias` (il primo alias di solito si
aggiorna da solo, il secondo va assegnato esplicitamente).

Per ottenere gli hash SHA1 dei file invariati, usare `mcp__Vercel__list_deployment_files` sull'ultimo
deployment di produzione. In parallelo, mantenere il repository Git aggiornato con `git add/commit/push`
per ogni modifica: è la fonte di verità primaria adesso, il deploy Vercel la segue.

Prima di ogni deploy: eseguire `node -e "require('./server.js')"` (o un test più mirato) per
intercettare errori di sintassi/require prima di spendere una build.

## Stato al 2026-09-29

Completati e in produzione:
- [x] Migrazione completa del repository su GitHub (era vuoto/parziale, ora rispecchia esattamente
      la produzione — 39 file verificati byte-per-byte via SHA1 contro il deployment live)
- [x] Nascosto (non rimosso) il blocco "🤖 Chiedo l'aiuto dell'AI" in `views/social-conferma.ejs`
      (`style="display:none"` sul div `.ai-blocco`). Le route server `/social/:id/ai-aiuto` e
      `/social/:id/ai-estrai` sono rimaste attive (non è stato chiesto di rimuoverle, solo di
      nascondere la UI) — da reintrodurre lato UI quando richiesto.
- [x] Nuovo sottotitolo landing page (`views/landing.ejs`, `p.lead`): "Uno strumento gratuito per
      analizzare in pochi minuti l'efficacia della comunicazione web e delle attività di web
      marketing della tua attività."

Non recuperabili dal vecchio deployment (solo file di test, nessun impatto runtime):
`lib/social/metrics.test.js` e `test/fixture-site.js` sono referenziabili per SHA nei deploy Vercel
(esistono ancora come blob) ma il loro contenuto non è mai stato recuperato per il repo Git — se
serve, si può tentare via `get_deployment_file_contents` con l'uid noto (rischio troncamento su file
grandi, vedi hash in una lista `list_deployment_files` del deployment corrente).

## Da fare — in ordine di priorità

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

Indicazioni implementative (da valutare/decidere durante lo sviluppo, non ancora decise):
- Nuovo file `lib/blog.js` (o `lib/contenuti.js` se si vuole già pensarlo come modulo condiviso con
  il futuro criterio "frequenza dei contenuti" dell'area Contenuti) con la funzione di raccolta dati
  condivisa (es. `raccogliArticoli(baseUrl, pagineHtml)` che ritorna `{ sezioneTrovata, url, articoli:
  [{titolo, data, fonte}] }`) + una funzione di giudizio separata che applica le soglie dello step 4
  e produce l'oggetto di output dello step 6.
- Dove va nel wizard: è un nuovo passaggio. Attualmente il wizard ha 8 step (vedi `server.js`):
  1 landing → 2 audit tecnico → 3 dichiarazione competenze → 4 verifica coerenza → 5 posizionamento
  → 6 social (conferma canali trovati) → 7 altri canali (YouTube/GBP/manuali) → 8 analisi social
  finale. Il criterio blog fa parte del blocco "Nurturing" (non ancora presente come step dedicato:
  va deciso se aggiungere uno step 9, o integrarlo nello step di audit tecnico esistente come sezione
  aggiuntiva del report — la spec dice "prende in input l'URL del sito già raccolto", il che è
  compatibile con farlo girare in background durante l'audit tecnico iniziale, simile a come la spec
  newsletter richiede per il proprio criterio — vedi sotto).
- La domanda dichiarativa "Avete un piano editoriale per il sito? Con quale cadenza pensate di
  pubblicare?" non esiste ancora nel questionario (`views/dichiarazione.ejs` raccoglie solo le
  competenze/temi) — va aggiunta da qualche parte, probabilmente in un nuovo blocco di domande
  dichiarative "Nurturing" (newsletter + editoriale) prima o dopo lo step "dichiarazione competenze".
- Riusare `lib/sitemap.js` per il parsing di sitemap.xml (già esiste e gestisce `<lastmod>`).

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

Indicazioni implementative (da decidere durante lo sviluppo):
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

### 3. Reintroduzione dell'aiuto AI (in sospeso, nessuna scadenza)

L'utente ha detto esplicitamente "la implementeremo in un secondo momento" — non è nel backlog
attivo, va fatto solo se/quando richiesto esplicitamente. Il codice è ancora tutto presente (solo
nascosto via CSS), quindi la reintroduzione è semplice: rimuovere `style="display:none"` dal div
`.ai-blocco` in `views/social-conferma.ejs`.

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
