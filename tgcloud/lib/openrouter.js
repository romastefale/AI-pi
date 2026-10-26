import { fetch } from 'sdk';
import { OPENROUTER_API_KEY, OPENROUTER_MODEL } from './config.js';

export async function askOpenRouter(messages) {
  if (OPENROUTER_API_KEY.includes('__OPENROUTER_API_KEY__')) {
    throw new Error('Chave da API não injetada. Configure o secret OPENROUTER_API_KEY e refaça o deploy.');
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
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
