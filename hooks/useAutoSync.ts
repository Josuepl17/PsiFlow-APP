import { useEffect } from "react";
import { sincronizar } from "../services/sync";

/**
 * Hook que gerencia a sincronização automática do app.
 * Sincroniza quando o app volta de background para active.
 */
export function useAutoSync() {
  useEffect(() => {
    // Sincroniza apenas na inicialização (abertura do app)
    console.log("[AutoSync] Inicializando sincronia de abertura...");
    sincronizar();
  }, []);
}
