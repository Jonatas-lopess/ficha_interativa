/**
 * Supabase replication stub.
 *
 * Currently a no-op — replication is local-only.
 * When you're ready to enable cloud sync:
 *   1. Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
 *   2. Uncomment the replicateSupabase blocks below
 *   3. Create matching tables in Supabase (see rxdb_supabase_plan.md for DDL)
 */

// import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
// import { createClient } from '@supabase/supabase-js';
// import type { AppDatabase } from '../index';

// export const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY,
// );

// export function startReplication(db: AppDatabase) {
//   const characterRep = replicateSupabase({
//     tableName: 'characters',
//     client: supabase,
//     collection: db.collections.characters,
//     replicationIdentifier: 'characters-supabase-v1',
//     live: true,
//     pull: { batchSize: 50 },
//     push: { batchSize: 50 },
//   });
//   characterRep.error$.subscribe(err => console.error('[replication:characters]', err));
//
//   // Threats and traits are pull-only (seeded by GM, no client push)
//   const threatRep = replicateSupabase({
//     tableName: 'threats',
//     client: supabase,
//     collection: db.collections.threats,
//     replicationIdentifier: 'threats-supabase-v1',
//     live: true,
//     pull: { batchSize: 100 },
//   });
//   threatRep.error$.subscribe(err => console.error('[replication:threats]', err));
//
//   return { characterRep, threatRep };
// }

export function startReplication(_db: unknown): void {
  // no-op until Supabase credentials are configured
}
