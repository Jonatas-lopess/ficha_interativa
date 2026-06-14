import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { getOrGenerateUserId } from '../../utils/userId';
import type { AppDatabase } from '../index';
import { useState, useEffect } from 'react';

export interface CatalogSyncStatus {
  isConfigured: boolean;
  isInitialSyncComplete: boolean;
  isSyncing: boolean;
  error: string | null;
  online: boolean;
}

let syncStatus: CatalogSyncStatus = {
  isConfigured: isSupabaseConfigured,
  isInitialSyncComplete: false,
  isSyncing: false,
  error: null,
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
};

const listeners = new Set<(status: CatalogSyncStatus) => void>();

function updateSyncStatus(patch: Partial<CatalogSyncStatus>) {
  syncStatus = { ...syncStatus, ...patch };
  listeners.forEach(l => l(syncStatus));
}

// Escuta a conectividade da internet globalmente no navegador
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => updateSyncStatus({ online: true }));
  window.addEventListener('offline', () => updateSyncStatus({ online: false, isSyncing: false }));
}

export function subscribeToCatalogSync(listener: (status: CatalogSyncStatus) => void) {
  listeners.add(listener);
  listener(syncStatus); // Emite o valor atual imediatamente ao inscrever
  return () => {
    listeners.delete(listener);
  };
}

export function getCatalogSyncStatus() {
  return syncStatus;
}

/**
 * Hook React customizado para escutar o progresso e estado da sincronização do Supabase.
 */
export function useCatalogSync() {
  const [status, setStatus] = useState<CatalogSyncStatus>(syncStatus);

  useEffect(() => {
    return subscribeToCatalogSync(setStatus);
  }, []);

  return status;
}

/**
 * Inicia a replicação live pull-only para as coleções do catálogo: Ameaças e Traços,
 * e a replicação pull-only para as fichas vinculadas ao UUID do usuário.
 */
export async function startCatalogReplication(db: AppDatabase): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    console.info('[replication] Supabase não configurado — catálogo rodando apenas offline.');
    updateSyncStatus({ isConfigured: false, isInitialSyncComplete: true });
    return;
  }

  const userId = getOrGenerateUserId();
  console.info(`[replication] Iniciando sincronização (User ID: ${userId})...`);
  updateSyncStatus({ isConfigured: true, isSyncing: true, error: null });

  const threatRep = replicateSupabase({
    tableName: 'threats',
    client: supabase,
    collection: (db as any).threats,
    replicationIdentifier: 'threats-supabase-v1',
    live: true,
    pull: { batchSize: 100 },
  });

  const traitRep = replicateSupabase({
    tableName: 'traits',
    client: supabase,
    collection: (db as any).traits,
    replicationIdentifier: 'traits-supabase-v1',
    live: true,
    pull: { batchSize: 200 },
  });

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
  });

  // Vincula status de syncing dinamicamente
  let activeThreats = false;
  let activeTraits = false;
  let activeChars = false;

  const checkSyncing = () => {
    const isSyncing = activeThreats || activeTraits || activeChars;
    updateSyncStatus({ isSyncing });
  };

  threatRep.active$.subscribe(act => {
    activeThreats = act;
    checkSyncing();
  });
  traitRep.active$.subscribe(act => {
    activeTraits = act;
    checkSyncing();
  });
  characterRep.active$.subscribe(act => {
    activeChars = act;
    checkSyncing();
  });

  // Vincula erros das replicações
  const handleError = (col: string, err: any) => {
    console.error(`[replication:${col}]`, err);
    updateSyncStatus({ error: err.message || String(err) });
  };
  threatRep.error$.subscribe(err => handleError('threats', err));
  traitRep.error$.subscribe(err => handleError('traits', err));
  characterRep.error$.subscribe(err => handleError('characters', err));

  // Aguarda a sincronização inicial para garantir que o catálogo local e as fichas tenham dados atualizados
  try {
    await Promise.all([
      threatRep.awaitInitialReplication(),
      traitRep.awaitInitialReplication(),
      characterRep.awaitInitialReplication(),
    ]);
    updateSyncStatus({ isInitialSyncComplete: true, error: null });
    console.info('[replication] Sincronização inicial concluída com sucesso.');
  } catch (err: any) {
    updateSyncStatus({ isInitialSyncComplete: true, error: err.message || String(err) });
    console.error('[replication] Falha na replicação inicial:', err);
  }
}
