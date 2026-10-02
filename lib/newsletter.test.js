const test = require('node:test');
const assert = require('node:assert/strict');
const { analizzaNewsletter, rilevaESP, rilevaCampoDichiarato, rilevaFormStandalone, rilevaDinamicaFormNewsletter } = require('./newsletter');

test('rilevaESP trova Mailchimp via src di script esterno', () => {
  const html = `<html><body><script src="https://usX.list-manage.com/embed.js"></script></body></html>`;
  const esp = rilevaESP(html);
  assert.equal(esp.chiave, 'mailchimp');
});

test('rilevaESP trova Brevo via action di un form', () => {
  const html = `<html><body><form action="https://xyz.sibforms.com/serve/MUIE..."><input type="email" name="email" /></form></body></html>`;
  const esp = rilevaESP(html);
  assert.equal(esp.chiave, 'brevo');
});

test('rilevaESP trova HubSpot via src di un iframe', () => {
  const html = `<html><body><iframe src="https://info.hs-forms.com/forms/embed/12345.html"></iframe></body></html>`;
  const esp = rilevaESP(html);
  assert.equal(esp.chiave, 'hubspot');
});

test('rilevaESP ritorna null quando nessun ESP noto è presente', () => {
  const html = `<html><body><form action="/contatti-invia"><input type="email" name="email" /></form></body></html>`;
  assert.equal(rilevaESP(html), null);
});

test('rilevaCampoDichiarato trova un checkbox vicino al testo "newsletter"', () => {
  const html = `<html><body>
    <form>
      <label><input type="checkbox" name="iscrizione" /> Iscrivimi alla newsletter della scuola</label>
    </form>
  </body></html>`;
  assert.equal(rilevaCampoDichiarato(html), true);
});

test('rilevaCampoDichiarato trova un campo vicino al testo "resta informato"', () => {
  const html = `<html><body>
    <div class="box"><p>Resta informato sulle novità della scuola</p><input type="email" name="mail_contatto" /></div>
  </body></html>`;
  assert.equal(rilevaCampoDichiarato(html), true);
});

test('rilevaCampoDichiarato ritorna false quando non c\'è alcun testo pertinente vicino', () => {
  const html = `<html><body><form><input type="email" name="utente" /></form></body></html>`;
  assert.equal(rilevaCampoDichiarato(html), false);
});

test('rilevaFormStandalone riconosce un form con solo email + pulsante', () => {
  const html = `<html><body>
    <form action="/iscrizione">
      <input type="email" name="email" placeholder="La tua email" />
      <button type="submit">Iscriviti</button>
    </form>
  </body></html>`;
  assert.equal(rilevaFormStandalone(html), true);
});

test('rilevaFormStandalone non scatta su un form di contatto con molti campi', () => {
  const html = `<html><body>
    <form action="/contatti-invia">
      <input type="text" name="nome" />
      <input type="text" name="cognome" />
      <input type="email" name="email" />
      <textarea name="messaggio"></textarea>
      <button type="submit">Invia</button>
    </form>
  </body></html>`;
  assert.equal(rilevaFormStandalone(html), false);
});

test('rilevaFormStandalone tollera un secondo campo (es. nome) oltre all\'email', () => {
  const html = `<html><body>
    <form action="/newsletter-iscrizione">
      <input type="text" name="nome" placeholder="Nome" />
      <input type="email" name="email" placeholder="Email" />
      <input type="submit" value="Iscrivimi" />
    </form>
  </body></html>`;
  assert.equal(rilevaFormStandalone(html), true);
});

test('rilevaDinamicaFormNewsletter (STEP 0) trova un form con molti campi e titolo "newsletter" fuori dal <form> — caso lazolla.it segnalato da Andrea', () => {
  // Riproduce la struttura reale segnalata: form con nome, cognome, email, un menu "Chi sei?",
  // checkbox sui temi e consenso privacy — troppi campi per rilevaFormStandalone (STEP 2), e con il
  // titolo "Iscriviti alla newsletter" messo FUORI dal <form> (quindi closest('form,...') su un
  // input, usato da rilevaCampoDichiarato/STEP 1, non lo vede mai).
  const html = `<html><body>
    <section class="box-newsletter">
      <h2>Iscriviti alla newsletter della Zolla</h2>
      <form action="/invia-iscrizione">
        <input type="text" name="nome" placeholder="Nome e cognome" />
        <input type="text" name="cognome" placeholder="Cognome" />
        <input type="email" name="email" placeholder="La tua email" />
        <select name="ruolo"><option>Genitore</option><option>Alunno</option></select>
        <label><input type="checkbox" name="tema_eventi" /> Eventi e incontri</label>
        <label><input type="checkbox" name="tema_lavoro" /> Opportunità di lavoro</label>
        <label><input type="checkbox" name="privacy" /> Ho letto l'informativa privacy</label>
        <button type="submit">Iscrivimi</button>
      </form>
    </section>
  </body></html>`;
  assert.equal(rilevaDinamicaFormNewsletter(html), true);
  assert.equal(rilevaFormStandalone(html), false);
  assert.equal(rilevaCampoDichiarato(html), false);
});

test('rilevaDinamicaFormNewsletter ignora un form generico se "newsletter" compare solo lontano (es. nel menu)', () => {
  const html = `<html><body>
    <nav><a href="/newsletter-archivio">Archivio newsletter</a></nav>
    <main>
      <form action="/contatti-invia">
        <input type="text" name="nome" />
        <input type="email" name="email" />
        <textarea name="messaggio"></textarea>
        <button type="submit">Invia</button>
      </form>
    </main>
  </body></html>`;
  assert.equal(rilevaDinamicaFormNewsletter(html), false);
});

test('rilevaDinamicaFormNewsletter ritorna false se il form non ha un campo email', () => {
  const html = `<html><body>
    <h2>Newsletter</h2>
    <form><input type="text" name="nome" /><button type="submit">Invia</button></form>
  </body></html>`;
  assert.equal(rilevaDinamicaFormNewsletter(html), false);
});

test('analizzaNewsletter: caso lazolla.it — "assente" ma con sottocaso quick-win, non più "nessun meccanismo"', () => {
  const contatti = `<html><body>
    <section class="box-newsletter">
      <h2>Iscriviti alla newsletter della Zolla</h2>
      <form action="/invia-iscrizione">
        <input type="text" name="nome" placeholder="Nome e cognome" />
        <input type="email" name="email" placeholder="La tua email" />
        <select name="ruolo"><option>Genitore</option></select>
        <label><input type="checkbox" name="privacy" /> Ho letto l'informativa privacy</label>
        <button type="submit">Iscrivimi</button>
      </form>
    </section>
  </body></html>`;
  const r = analizzaNewsletter([contatti]);
  assert.equal(r.stato, 'assente');
  assert.equal(r.sottocaso, 'meccanismo_senza_esp');
  assert.equal(r.verificaA, true);
});

test('analizzaNewsletter: presente quando c\'è un meccanismo di raccolta E un ESP', () => {
  const home = `<html><body>
    <form action="https://usX.list-manage.com/subscribe/post">
      <input type="email" name="EMAIL" placeholder="La tua email" />
      <button type="submit">Iscriviti</button>
    </form>
  </body></html>`;
  const r = analizzaNewsletter([home]);
  assert.equal(r.stato, 'presente');
  assert.equal(r.piattaformaChiave, 'mailchimp');
  assert.equal(r.verificaB, true);
});

test('analizzaNewsletter: assente (quick win) quando c\'è raccolta email ma nessun ESP', () => {
  const home = `<html><body>
    <form action="/iscrizione-newsletter-interna">
      <input type="email" name="email" placeholder="Email" />
      <button type="submit">Iscriviti</button>
    </form>
  </body></html>`;
  const r = analizzaNewsletter([home]);
  assert.equal(r.stato, 'assente');
  assert.equal(r.sottocaso, 'meccanismo_senza_esp');
});

test('analizzaNewsletter: assente (nessun meccanismo) quando non si trova nulla', () => {
  const home = `<html><body><p>Benvenuti sul sito della scuola.</p></body></html>`;
  const r = analizzaNewsletter([home]);
  assert.equal(r.stato, 'assente');
  assert.equal(r.sottocaso, 'nessun_meccanismo');
  assert.equal(r.piattaforma, null);
});

test('analizzaNewsletter: combina dati trovati su più pagine diverse', () => {
  const home = `<html><body><p>Niente di rilevante qui.</p></body></html>`;
  const contatti = `<html><body>
    <label><input type="checkbox" name="news" /> Iscrivimi alla newsletter</label>
    <script src="https://xyz.sibforms.com/serve/abc"></script>
  </body></html>`;
  const r = analizzaNewsletter([home, contatti]);
  assert.equal(r.stato, 'presente');
  assert.equal(r.verificaA, true);
  assert.equal(r.piattaformaChiave, 'brevo');
});

test('analizzaNewsletter: gestisce un array vuoto senza lanciare eccezioni', () => {
  const r = analizzaNewsletter([]);
  assert.equal(r.stato, 'assente');
  assert.equal(r.sottocaso, 'nessun_meccanismo');
});
