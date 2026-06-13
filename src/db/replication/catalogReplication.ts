import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import type { AppDatabase } from '../index';

/**
 * Inicia a replicação live pull-only para as coleções do catálogo: Ameaças e Traços.
 * Como são dados globais cadastrados pelo Mestre (GM), os jogadores apenas consomem (pull-only).
 * A semeadura inicial desses dados no Supabase é de responsabilidade do Mestre.
 */
export async function startCatalogReplication(db: AppDatabase): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    console.info('[replication] Supabase não configurado — catálogo rodando apenas offline.');
    return;
  }

  console.info('[replication] Iniciando sincronização do catálogo com o Supabase...');

  const threatRep = replicateSupabase({
    tableName: 'threats',
    client: supabase,
    collection: (db as any).threats,
    replicationIdentifier: 'threats-supabase-v1',
    live: true,
    pull: { batchSize: 100 },
    // Sem push: catálogo de ameaças é somente leitura para os jogadores
  });
  threatRep.error$.subscribe(err => console.error('[replication:threats]', err));

  const traitRep = replicateSupabase({
    tableName: 'traits',
    client: supabase,
    collection: (db as any).traits,
    replicationIdentifier: 'traits-supabase-v1',
    live: true,
    pull: { batchSize: 200 },
    // Sem push: catálogo de traços é somente leitura para os jogadores
  });
  traitRep.error$.subscribe(err => console.error('[replication:traits]', err));

  // Aguarda a sincronização inicial para garantir que o catálogo local tenha dados atualizados
  try {
    await Promise.all([
      threatRep.awaitInitialReplication(),
      traitRep.awaitInitialReplication(),
    ]);
    console.info('[replication] Sincronização do catálogo concluída com sucesso.');
  } catch (err) {
    console.error('[replication] Falha na replicação inicial do catálogo:', err);
  }
}
