/**
 * One-time migration from the legacy LocalStorageDriver (rpg-db:*) keys
 * to the RxDB-managed store (rpg-db-v2).
 *
 * Runs once at app startup. After a successful migration the flag
 * `rpg-db:__migrated_v2` is set so it never runs again.
 *
 * Usage: call `migrateFromLocalStorageDriver()` inside initializeDatabase()
 * or in main.tsx before any repository access.
 */
export async function migrateFromLocalStorageDriver(
  characterRepo: { save: (c: any) => Promise<unknown> },
  threatRepo:    { save: (t: any) => Promise<unknown> },
  traitRepo:     { save: (t: any) => Promise<unknown> },
): Promise<void> {
  const FLAG = 'rpg-db:__migrated_v2';
  if (localStorage.getItem(FLAG)) return;

  const OLD_PREFIX = 'rpg-db:';
  let migrated = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(OLD_PREFIX) || key === FLAG) continue;

    const raw = localStorage.getItem(key);
    if (!raw) continue;

    let doc: Record<string, unknown>;
    try { doc = JSON.parse(raw); } catch { continue; }
    if (doc._deleted) continue;

    const id = key.substring(OLD_PREFIX.length); // e.g. "character_1abc"

    try {
      if (id.startsWith('character_')) {
        await characterRepo.save({ ...doc, _id: id });
        migrated++;
      } else if (id.startsWith('threat_')) {
        await threatRepo.save({ ...doc, _id: id });
        migrated++;
      } else if (id.startsWith('trait_')) {
        await traitRepo.save({ ...doc, _id: id });
        migrated++;
      }
    } catch (err) {
      console.warn(`[migration] Skipped "${id}":`, err);
    }
  }

  localStorage.setItem(FLAG, new Date().toISOString());
  if (migrated > 0) {
    console.log(`[migration] Migrated ${migrated} document(s) to RxDB.`);
  }
}
