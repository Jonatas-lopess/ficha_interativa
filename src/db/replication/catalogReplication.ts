import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { getOrGenerateUserId } from '../../utils/userId';
import type { AppDatabase } from '../index';

/**
 * Inicia a replicação live pull-only para as coleções do catálogo: Ameaças e Traços,
 * e a replicação pull-only para as fichas vinculadas ao UUID do usuário.
 * Como são dados globais cadastrados pelo Mestre (GM), os jogadores apenas consomem (pull-only).
 * A semeadura inicial desses dados no Supabase é de responsabilidade do Mestre.
 */
export async function startCatalogReplication(db: AppDatabase): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    console.info('[replication] Supabase não configurado — catálogo rodando apenas offline.');
    return;
  }

  const userId = getOrGenerateUserId();
  console.info(`[replication] Iniciando sincronização (User ID: ${userId})...`);

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

  const characterRep = replicateSupabase({
    tableName: 'characters',
    client: supabase,
    collection: (db as any).characters,
    replicationIdentifier: `characters-supabase-${userId}`,
    live: true,
    pull: {
      batchSize: 50,
      queryBuilder: ({ query }) => query.eq('user_id', userId)
    }
    // Sem push: a gravação online de fichas de personagens é manual via botão "Salvar Online"
  });
  characterRep.error$.subscribe(err => console.error('[replication:characters]', err));

  // Aguarda a sincronização inicial para garantir que o catálogo local e as fichas tenham dados atualizados
  try {
    await Promise.all([
      threatRep.awaitInitialReplication(),
      traitRep.awaitInitialReplication(),
      characterRep.awaitInitialReplication(),
    ]);
    console.info('[replication] Sincronização inicial concluída com sucesso.');
  } catch (err) {
    console.error('[replication] Falha na replicação inicial:', err);
  }
}
