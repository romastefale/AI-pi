import { api, db } from 'sdk';
import { eq, desc } from 'sdk/db';
import { messages } from '../schema.js';
import { askOpenRouter } from '../lib/openrouter.js';
import { HISTORY_LIMIT, MINI_APP_URL } from '../lib/config.js';

const SYSTEM = 'Você é um assistente pessoal dentro do Telegram. Responda em português do Brasil, salvo quando o usuário pedir outro idioma. Seja claro, natural e direto. Não invente fatos atuais. Quando uma informação depender de dados em tempo real que você não tenha disponível, deixe isso explícito.';
const TELEGRAM_LIMIT = 4096;

export default async function (message) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();
  if (!text) return;

  if (text === '/start') {
    return api.sendMessage({
      chat_id: chatId,
      text: 'Olá! Envie uma mensagem e eu respondo. Use /reset para limpar a conversa.',
      ...(MINI_APP_URL && {
        reply_markup: { inline_keyboard: [[{ text: 'Abrir o app', web_app: { url: MINI_APP_URL } }]] },
      }),
    });
  }

  if (text === '/reset') {
    await db.delete(messages).where(eq(messages.chatId, chatId)).run();
    return api.sendMessage({ chat_id: chatId, text: 'Conversa apagada.' });
  }

  await api.sendChatAction({ chat_id: chatId, action: 'typing' });
  await db.insert(messages).values({ chatId, role: 'user', content: text }).run();

  const recent = await db.select().from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.id))
    .limit(HISTORY_LIMIT)
    .all();

  const history = recent.reverse().map(m => ({ role: m.role, content: m.content }));
  const today = new Date().toLocaleDateString('pt-BR');

  let answer;
  try {
    answer = await askOpenRouter([{ role: 'system', content: `${SYSTEM} Data: ${today}.` }, ...history]);
  } catch (error) {
    console.error(error);
    return api.sendMessage({ chat_id: chatId, text: `Erro: ${error.message}` });
  }

  await db.insert(messages).values({ chatId, role: 'assistant', content: answer }).run();

  for (let i = 0; i < answer.length; i += TELEGRAM_LIMIT) {
    await api.sendMessage({ chat_id: chatId, text: answer.slice(i, i + TELEGRAM_LIMIT) });
  }
}
