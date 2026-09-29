const PATTERNS = [
  { platform: 'instagram', re: /(^|\.)instagram\.com$/i },
  { platform: 'facebook', re: /(^|\.)facebook\.com$|(^|\.)fb\.com$/i },
  { platform: 'youtube', re: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
  { platform: 'linkedin', re: /(^|\.)linkedin\.com$/i },
  { platform: 'tiktok', re: /(^|\.)tiktok\.com$/i },
  { platform: 'x', re: /(^|\.)twitter\.com$|(^|\.)x\.com$/i },
  { platform: 'threads', re: /(^|\.)threads\.net$/i },
  { platform: 'pinterest', re: /(^|\.)pinterest\.[a-z.]+$/i },
];

function daUrl(url) {
  try {
    const host = new URL(url).hostname;
    const trovata = PATTERNS.find((p) => p.re.test(host));
    return trovata ? trovata.platform : null;
  } catch (e) {
    return null;
  }
}

function riconosciPiattaforma(input, platformDichiarata) {
  const valore = (input || '').trim();
  if (!valore) return { platform: null, handle: null, ambiguo: false };

  if (/^https?:\/\//i.test(valore)) {
    const platform = daUrl(valore);
    return {
      platform: platform || platformDichiarata || null,
      handle: valore,
      ambiguo: !platform && !platformDichiarata,
    };
  }

  const pulito = valore.replace(/^@/, '');
  if (platformDichiarata) {
    return { platform: platformDichiarata, handle: pulito, ambiguo: false };
  }
  return { platform: null, handle: pulito, ambiguo: true };
}

module.exports = { daUrl, riconosciPiattaforma };
