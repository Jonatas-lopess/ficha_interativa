import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { characterSchema } from './schemas/characterSchema';
import { threatSchema }    from './schemas/threatSchema';
import { traitSchema }     from './schemas/traitSchema';
import { skillSchema }     from './schemas/skillSchema';

// Register migration schema plugin
addRxPlugin(RxDBMigrationSchemaPlugin);

export type AppDatabase = Awaited<ReturnType<typeof _createDb>>;

let _dbInstance: AppDatabase | null = null;

async function _createDb() {
  if (import.meta.env.DEV) {
    // Dev-mode plugin gives helpful runtime validation warnings.
    // Must be added exactly once before createRxDatabase.
    const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode');
    addRxPlugin(RxDBDevModePlugin);
  }

  const baseStorage = getRxStorageLocalstorage();
  const storage = wrappedValidateAjvStorage({ storage: baseStorage });

  const db = await createRxDatabase({
    name: 'rpg-db-v3',         // v3 to apply updated schemas and avoid DB6 schema mismatch error
    storage,
    multiInstance: false,       // single tab — no broadcast channel overhead
  });

  const migrationStrategies = {
    1: (oldDoc: any) => {
      const { _modified, ...rest } = oldDoc;
      return rest;
    }
  };

  await db.addCollections({
    characters: { 
      schema: characterSchema,
      migrationStrategies
    },
    threats: { 
      schema: threatSchema,
      migrationStrategies
    },
    traits: { 
      schema: traitSchema,
      migrationStrategies
    },
    skills: {
      schema: skillSchema,
      migrationStrategies
    },
  });

  return db;
}

/**
 * Singleton accessor. Safe to call multiple times — returns the same promise
 * after the first call.
 */
export async function getDatabase(): Promise<AppDatabase> {
  if (import.meta.env.DEV) {
    const globalObj = typeof window !== 'undefined' ? (window as any) : globalThis;
    if (!globalObj.__rxdb_db) {
      globalObj.__rxdb_db = await _createDb();
    }
    return globalObj.__rxdb_db;
  }

  if (!_dbInstance) {
    _dbInstance = await _createDb();
  }
  return _dbInstance;
}
