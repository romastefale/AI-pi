import { fetch } from 'sdk';
import { OPENROUTER_MODEL } from './config.js';

export const NO_KEY_MESSAGE = 'Você ainda não enviou sua chave do OpenRouter. Mande a chave (sk-or-...) para o bot, em conversa privada.';

export async function askOpenRouter(messages, apiKey) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'AI-pi',
    },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages }),
  });

  let data = {};
  try { data = JSON.parse(await res.text()); } catch {}

  if (!res.ok) {
    const err = data?.error;
    throw new Error((typeof err === 'string' ? err : err?.message) || `Erro HTTP ${res.status}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('A API respondeu sem conteúdo.');
  return text;
}
