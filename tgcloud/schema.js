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
