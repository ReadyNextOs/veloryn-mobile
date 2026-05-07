// SQLite cache dla wiadomości mail — offline fallback.
// Trzyma max 200 najnowszych wiadomości per folder.

import * as SQLite from 'expo-sqlite';
import type { MailListItem } from '@/types/mail';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('veloryn_mail.db');
  await initSchema(_db);
  return _db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS mail_messages_cache (
      id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      folder_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      received_at TEXT NOT NULL,
      PRIMARY KEY (id, folder_id)
    );
    CREATE INDEX IF NOT EXISTS idx_mail_cache_folder
      ON mail_messages_cache(account_id, folder_id, received_at DESC);
  `);
}

/** Zapisuje wiadomości do cache. Trzyma max 200 najnowszych per folder. */
export async function cacheMailMessages(
  accountId: string,
  folderId: string,
  messages: MailListItem[],
): Promise<void> {
  try {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (const msg of messages) {
        await db.runAsync(
          `INSERT OR REPLACE INTO mail_messages_cache
           (id, account_id, folder_id, payload, received_at)
           VALUES (?, ?, ?, ?, ?)`,
          [msg.id, accountId, folderId, JSON.stringify(msg), msg.received_at],
        );
      }
      // Usuń stare — trzymaj tylko 200 najnowszych per folder
      await db.runAsync(
        `DELETE FROM mail_messages_cache
         WHERE folder_id = ? AND account_id = ? AND id NOT IN (
           SELECT id FROM mail_messages_cache
           WHERE folder_id = ? AND account_id = ?
           ORDER BY received_at DESC
           LIMIT 200
         )`,
        [folderId, accountId, folderId, accountId],
      );
    });
  } catch {
    // Cache failures nie blokują app
  }
}

/** Pobiera cached wiadomości z SQLite (sorted newest first). */
export async function getCachedMailMessages(
  accountId: string,
  folderId: string,
  limit = 200,
): Promise<MailListItem[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{ payload: string }>(
      `SELECT payload FROM mail_messages_cache
       WHERE account_id = ? AND folder_id = ?
       ORDER BY received_at DESC
       LIMIT ?`,
      [accountId, folderId, limit],
    );
    return rows.map((r) => JSON.parse(r.payload) as MailListItem);
  } catch {
    return [];
  }
}

/** Wyczyść cały cache (np. po logout). */
export async function clearMailCache(): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM mail_messages_cache');
  } catch {
    // ignoruj
  }
}
