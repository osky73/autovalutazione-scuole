function providerDisponibile() {
  return Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY
  );
}

function ottieniModello() {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const { google } = require('@ai-sdk/google');
    return google('gemini-3.8-flash');
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const { anthropic } = require('@ai-sdk/anthropic');
    return anthropic('claude-3-5-haiku-latest');
  }
  if (process.env.AI_GATEWAY_API_KEY) {
    return 'anthropic/claude-3-5-haiku';
  }
  const err = new Error(
    'Nessun provider AI configurato lato server (GOOGLE_GENERATIVE_AI_API_KEY, ANTHROPIC_API_KEY o AI_GATEWAY_API_KEY)'
  );
  err.code = 'AI_NOT_CONFIGURED';
  throw err;
}

module.exports = { providerDisponibile, ottieniModello };
