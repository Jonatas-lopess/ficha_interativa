import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { characterSchema } from './schemas/characterSchema';
import { threatSchema }    from './schemas/threatSchema';
import { traitSchema }     from './schemas/traitSchema';

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

  const db = await createRxDatabase({
    name: 'rpg-db-v2',         // v2 to avoid collisions with old LocalStorageDriver keys
    storage: getRxStorageLocalstorage(),
    multiInstance: false,       // single tab — no broadcast channel overhead
  });

  const migrationStrategies = {
    1: (oldDoc: any) => ({
      ...oldDoc,
      _modified: oldDoc._modified || new Date().toISOString()
    })
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
  });

  return db;
}

/**
 * Singleton accessor. Safe to call multiple times — returns the same promise
 * after the first call.
 */
export async function getDatabase(): Promise<AppDatabase> {
  if (!_dbInstance) {
    _dbInstance = await _createDb();
  }
  return _dbInstance;
}
