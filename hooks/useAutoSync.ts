import { useEffect } from "react";
import { sincronizar } from "../services/sync";
import { useSyncStore } from "../stores/syncStore";

/**
 * Hook que gerencia a sincronização automática do app.
 * Sincroniza quando o app volta de background para active.
 */
export function useAutoSync(enabled: boolean = true) {
  const { setIsInitialSyncing } = useSyncStore();

  useEffect(() => {
    if (!enabled) {
      setIsInitialSyncing(false);
      return;
    }

    async function initialSync() {
      // Sincroniza apenas na inicialização (abertura do app)
      console.log("[AutoSync] Iniciando sincronia inicial (travando tela)...");
      setIsInitialSyncing(true);
      try {
        await sincronizar(true);
      } catch (e) {
        console.error("[AutoSync] Erro na sincronia inicial:", e);
      } finally {
        console.log("[AutoSync] Sincronia inicial concluída (liberando tela).");
        setIsInitialSyncing(false);
      }
    }

    initialSync();
  }, [enabled, setIsInitialSyncing]);
}
