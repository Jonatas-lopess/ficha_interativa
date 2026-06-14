/**
 * Utilitário para obter, gerar e salvar o ID único do usuário (player key)
 * usado para identificar e sincronizar suas fichas no Supabase.
 */
export function getOrGenerateUserId(): string {
  let id = localStorage.getItem('rpg_player_user_id');
  if (!id) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      // Fallback simples para UUID v4 se crypto.randomUUID não estiver disponível
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    localStorage.setItem('rpg_player_user_id', id);
  }
  return id;
}

export function setUserId(id: string): void {
  const cleanId = id.trim();
  if (cleanId) {
    localStorage.setItem('rpg_player_user_id', cleanId);
  }
}
