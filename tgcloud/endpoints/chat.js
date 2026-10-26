import { EndpointError } from 'sdk';
import { askOpenRouter } from '../lib/openrouter.js';

const ROLES = ['system', 'user', 'assistant'];
const MAX_MESSAGES = 30;
const MAX_CONTENT = 8000;

// Chamado pelo Mini App: Telegram.WebApp.Serverless.call('chat', { messages }).
// A origem já foi verificada pela plataforma (ctx.initData); a chave nunca sai daqui.
export default async function (input) {
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

  try {
    return { text: await askOpenRouter(clean) };
  } catch (error) {
    console.error(error);
    throw new EndpointError(error.message);
  }
}
