import { db } from 'sdk';
import { eq } from 'sdk/db';
import { apiKeys } from '../schema.js';

export async function getKey(userId) {
  const row = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).get();
  return row?.key || null;
}

export async function saveKey(userId, key) {
  await db.insert(apiKeys).values({ userId, key })
    .onConflictDoUpdate({ target: apiKeys.userId, set: { key } })
    .run();
}

export async function deleteKey(userId) {
  await db.delete(apiKeys).where(eq(apiKeys.userId, userId)).run();
}
