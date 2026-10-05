const http = require('http');

const PORT = Number(process.env.PORT) || 3000;
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const MAX_BODY_BYTES = 256 * 1024;
const REQUEST_TIMEOUT_MS = 60_000;
const DEFAULT_MODEL = 'openrouter/free';

// ALLOWED_ORIGIN: '*' (padrão) ou uma ou mais origens separadas por vírgula.
// Use só a origem, sem caminho e sem barra final. Ex.: https://romastefale.github.io
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || '*')
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
const ALLOW_ALL = ALLOWED_ORIGINS.includes('*');

function corsOrigin(requestOrigin) {
  if (ALLOW_ALL) return '*';
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : null;
}

function sendJson(res, status, data, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Vary'] = 'Origin';
  }

  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

// Mesmo formato de erro do OpenRouter: { error: { message } }
function sendError(res, status, message, origin) {
  return sendJson(res, status, { error: { message } }, origin);
}

const server = http.createServer(async (req, res) => {
  const requestOrigin = req.headers.origin || '';
  const origin = corsOrigin(requestOrigin);
  const path = (req.url || '').split('?')[0];

  if (req.method === 'GET' && path === '/health') {
    return sendJson(res, 200, { ok: true, keyConfigured: Boolean(OPENROUTER_API_KEY) }, origin);
  }

  if (req.method === 'OPTIONS') {
    if (!origin) return sendError(res, 403, 'Origem não autorizada.', null);
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    });
    return res.end();
  }

  if (path !== '/api/chat') {
    return sendError(res, 404, 'Not found', origin);
  }

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Método não permitido.', origin);
  }

  if (!origin) {
    console.warn(`Origem bloqueada: "${requestOrigin}". Permitidas: ${ALLOWED_ORIGINS.join(', ')}`);
    return sendError(res, 403, 'Origem não autorizada.', null);
  }

  if (!OPENROUTER_API_KEY) {
    return sendError(res, 500, 'OPENROUTER_API_KEY não configurada no Railway.', origin);
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return sendError(res, 415, 'Content-Type deve ser application/json.', origin);
  }

  const declaredLength = Number(req.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return sendError(res, 413, 'Requisição muito grande.', origin);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let body = '';
    let totalBytes = 0;
    let tooLarge = false;

    for await (const chunk of req) {
      totalBytes += Buffer.byteLength(chunk);
      if (totalBytes > MAX_BODY_BYTES) {
        tooLarge = true;
        continue;
      }
      if (!tooLarge) body += chunk;
    }

    if (tooLarge) {
      return sendError(res, 413, 'Requisição muito grande.', origin);
    }

    const payload = JSON.parse(body || '{}');
    const messages = Array.isArray(payload.messages) ? payload.messages : null;

    if (!messages) {
      return sendError(res, 400, 'Campo messages inválido.', origin);
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': ALLOW_ALL ? 'https://github.com' : ALLOWED_ORIGINS[0],
        'X-Title': 'AI-pi',
      },
      body: JSON.stringify({
        model: typeof payload.model === 'string' && payload.model ? payload.model : DEFAULT_MODEL,
        messages,
      }),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: { message: `Resposta inválida do OpenRouter (HTTP ${response.status}).` } };
    }

    if (!response.ok) {
      // Aparece nos logs do Railway para facilitar o diagnóstico.
      console.error(`OpenRouter HTTP ${response.status}:`, raw.slice(0, 500));
    }

    return sendJson(res, response.status, data, origin);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendError(res, 400, 'JSON inválido.', origin);
    }
    if (error?.name === 'AbortError') {
      return sendError(res, 504, 'A API demorou demais para responder.', origin);
    }
    console.error(error);
    return sendError(res, 502, `Falha ao contatar o OpenRouter: ${error?.message || 'erro desconhecido'}`, origin);
  } finally {
    clearTimeout(timeout);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AI-pi proxy rodando na porta ${PORT}`);
});
