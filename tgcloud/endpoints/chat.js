import { EndpointError } from 'sdk';
import { askOpenRouter, NO_KEY_MESSAGE } from '../lib/openrouter.js';
import { getKey } from '../lib/keys.js';

const ROLES = ['system', 'user', 'assistant'];
const MAX_MESSAGES = 30;
const MAX_CONTENT = 8000;

// Chamado pelo Mini App: Telegram.WebApp.Serverless.call('chat', { messages }).
// A origem já foi verificada pela plataforma (ctx.initData); a chave do usuário
// (enviada ao bot no chat) é lida do banco e nunca sai daqui.
export default async function (input, ctx) {
  const messages = input?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    throw new EndpointError('Campo messages inválido.');
  }

  const clean = messages.map(m => {
    if (!m || !ROLES.includes(m.role) || typeof m.content !== 'string') {
      throw new EndpointError('Campo messages inválido.');
    }
    return { role: m.role, content: m.content.slice(0, MAX_CONTENT) };
  });

  const apiKey = await getKey(ctx.initData.user.id);
  if (!apiKey) throw new EndpointError(NO_KEY_MESSAGE, { code: 'NO_KEY' });

  try {
    return { text: await askOpenRouter(clean, apiKey) };
  } catch (error) {
    console.error(error);
    throw new EndpointError(error.message);
  }
}
