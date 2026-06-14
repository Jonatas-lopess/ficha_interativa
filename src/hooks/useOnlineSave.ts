import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';
import { getOrGenerateUserId } from '../utils/userId';
import type { Character } from '../types';
import type { Persisted } from '../repository/persistenceTypes';

export type OnlineSaveStatus = 'idle' | 'saving' | 'success' | 'error';

export function useOnlineSave() {
  const [status, setStatus] = useState<OnlineSaveStatus>('idle');

  const salvarOnline = async (character: Persisted<Character>) => {
    if (!isSupabaseConfigured || !supabase) {
      alert('Supabase não configurado. Por favor, verifique as variáveis de ambiente.');
      return;
    }

    setStatus('saving');
    try {
      const userId = getOrGenerateUserId();
      // Prepara os dados para o Supabase, garantindo os campos de controle de replicação e o ID de proprietário
      const payload = {
        ...character,
        user_id: userId,
        _deleted: false,
        _modified: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('characters')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        throw error;
      }
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err: any) {
      console.error('[online-save] Erro ao salvar online:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return { salvarOnline, status, isConfigured: isSupabaseConfigured };
}
