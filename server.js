const http = require('http');

const PORT = Number(process.env.PORT) || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const MAX_BODY_BYTES = 256 * 1024;
const REQUEST_TIMEOUT_MS = 60_000;

function corsOrigin(requestOrigin) {
  if (ALLOWED_ORIGIN === '*') return '*';
  return requestOrigin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : null;
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

const server = http.createServer(async (req, res) => {
  const requestOrigin = req.headers.origin || '';
  const origin = corsOrigin(requestOrigin);

  if (req.method === 'OPTIONS') {
    if (!origin) return sendJson(res, 403, { error: 'Origem não autorizada.' }, null);
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    });
    return res.end();
  }

  if (req.url !== '/api/chat') {
    return sendJson(res, 404, { error: 'Not found' }, origin);
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método não permitido.' }, origin);
  }

  if (!origin) {
    return sendJson(res, 403, { error: 'Origem não autorizada.' }, null);
  }

  if (!OPENROUTER_API_KEY) {
    return sendJson(res, 500, { error: 'OPENROUTER_API_KEY não configurada no Railway.' }, origin);
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return sendJson(res, 415, { error: 'Content-Type deve ser application/json.' }, origin);
  }

  const declaredLength = Number(req.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return sendJson(res, 413, { error: 'Requisição muito grande.' }, origin);
  }

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
      return sendJson(res, 413, { error: 'Requisição muito grande.' }, origin);
    }

    const payload = JSON.parse(body || '{}');
    const messages = Array.isArray(payload.messages) ? payload.messages : null;

    if (!messages) {
      return sendJson(res, 400, { error: 'Campo messages inválido.' }, origin);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': ALLOWED_ORIGIN === '*' ? 'https://github.com' : ALLOWED_ORIGIN,
          'X-Title': 'AI-pi',
        },
        body: JSON.stringify({
          model: typeof payload.model === 'string' && payload.model ? payload.model : 'openrouter/free',
          messages,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json().catch(() => ({}));
    return sendJson(res, response.status, data, origin);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendJson(res, 400, { error: 'JSON inválido.' }, origin);
    }
    if (error?.name === 'AbortError') {
      return sendJson(res, 504, { error: 'A API demorou demais para responder.' }, origin);
    }
    console.error(error);
    return sendJson(res, 500, { error: 'Erro interno no proxy.' }, origin);
  }
});

server.listen(PORT, () => {
  console.log(`AI-pi proxy rodando na porta ${PORT}`);
});
