import NetInfo from "@react-native-community/netinfo";
import { DeviceEventEmitter } from "react-native";
import { agendarNotificacoesDeSessoes } from "../hooks/useNotifications";
import { apiFetchAgendamentos, apiFetchPacientes } from "./api";
import { getSyncLog, upsertAgendamentos, upsertPacientes } from "./database";

export type SyncResult = {
  sucesso: boolean;
  semInternet?: boolean;
  erro?: string;
  agendamentos?: number;
  pacientes?: number;
  horario?: string;
};

/**
 * Verifica se há conexão com a internet.
 */
export async function temInternet(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!(state.isConnected && state.isInternetReachable);
}

let lastSyncTime = 0;
const SYNC_THROTTLE_MS = 5000; // 5 segundos para facilitar testes

/**
 * Sincroniza agendamentos e pacientes com o servidor.
 * Retorna resultado com contagem de registros sincronizados.
 */
export async function sincronizar(force = false): Promise<SyncResult> {
  const agora = Date.now();

  // Se não for forçado e o último sync foi recente, ignora (Throttle)
  if (!force && agora - lastSyncTime < SYNC_THROTTLE_MS) {
    console.log("[Sync] Pulando sincronização automática (throttle ativo)");
    return { sucesso: true, agendamentos: 0, pacientes: 0 };
  }

  const online = await temInternet();

  if (!online) {
    return { sucesso: false, semInternet: true };
  }

  try {
    // Buscar em paralelo
    const [resAgendamentos, resPacientes] = await Promise.all([
      apiFetchAgendamentos(),
      apiFetchPacientes(),
    ]);

    // Salvar no SQLite
    await Promise.all([
      upsertAgendamentos(resAgendamentos.agendamentos ?? []),
      upsertPacientes(resPacientes.pacientes ?? []),
    ]);

    const horario = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Atualizar notificações locais após sync
    await agendarNotificacoesDeSessoes();

    lastSyncTime = Date.now();

    // Notificar o sistema que a sincronia terminou (para atualizar telas abertas)
    DeviceEventEmitter.emit("sync-finished", {
      agendamentos: resAgendamentos.total ?? 0,
      pacientes: resPacientes.total ?? 0,
    });

    return {
      sucesso: true,
      agendamentos: resAgendamentos.total ?? 0,
      pacientes: resPacientes.total ?? 0,
      horario,
    };
  } catch (err: any) {
    return {
      sucesso: false,
      erro: err?.response?.data?.message ?? err?.message ?? "Erro desconhecido",
    };
  }
}

/**
 * Retorna data/hora do último sync de agendamentos.
 */
export async function getUltimaSync(): Promise<string | null> {
  const log = await getSyncLog();
  return log["agendamentos"] ?? null;
}
