const crypto = require('crypto');

const sessions = new Map();

function creaSessione({ scuola, url }) {
  const id = crypto.randomUUID();
  const sessione = {
    id,
    scuola,
    url,
    createdAt: new Date(),
    obiettivi: null,
    audit: null,
    auditErrore: null,
    pagineHtml: null,
    pagineUrl: null,
    dichiarati: null,
    temi: null,
    confermati: null,
    localita: undefined,
    posizionamento: null,
    socialTrovati: undefined,
    socialConfermati: null,
    socialAnalisi: null,
    socialValutazione: null,
  };
  sessions.set(id, sessione);
  return sessione;
}

function getSessione(id) {
  return sessions.get(id) || null;
}

module.exports = { creaSessione, getSessione };
