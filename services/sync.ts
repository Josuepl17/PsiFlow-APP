import NetInfo from "@react-native-community/netinfo";
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

/**
 * Sincroniza agendamentos e pacientes com o servidor.
 * Retorna resultado com contagem de registros sincronizados.
 */
export async function sincronizar(): Promise<SyncResult> {
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
