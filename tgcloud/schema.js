import { table, integer, text, index, sql } from 'sdk/db';

// Histórico da conversa de cada chat (sem foreign keys: o runtime não as suporta).
export const messages = table('messages', {
  id:      integer('id').primaryKey({ autoIncrement: true }),
  chatId:  integer('chat_id').notNull(),
  role:    text('role').notNull(),
  content: text('content').notNull(),
  created: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  chatIdx: index('idx_messages_chat').on(t.chatId, t.id),
}));

// Chave do OpenRouter de cada usuário, enviada por ele ao bot (só em chat privado).
export const apiKeys = table('api_keys', {
  userId:  integer('user_id').primaryKey(),
  key:     text('key').notNull(),
  updated: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
