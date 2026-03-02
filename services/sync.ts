import NetInfo from "@react-native-community/netinfo";
import { DeviceEventEmitter } from "react-native";
import { agendarNotificacoesDeSessoes } from "../hooks/useNotifications";
import { SyncResult } from "../types";
import {
    apiFetchAgendamentos,
    apiFetchArquivos,
    apiFetchPacientes,
} from "./api";
import {
    getSincronizacao,
    updateSincronizacao,
    upsertAgendamentos,
    upsertArquivos,
    upsertPacientes,
} from "./database";

// Removido o type SyncResult interno para usar o global em ../types

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
    // 1. Buscar última data de sincronização incremental
    const logsIncremental = await getSincronizacao();
    const sinceAgendamentos = logsIncremental["agendamentos"] ?? null;
    const sincePacientes = logsIncremental["pacientes"] ?? null;
    const sinceArquivos = logsIncremental["arquivos_pacientes"] ?? null;

    console.log(
      `[Sync] 🔄 INICIANDO SINCRONIZAÇÃO. Agendamentos > ${sinceAgendamentos}, Pacientes > ${sincePacientes}, Arquivos > ${sinceArquivos}`,
    );

    // 2. Buscar em paralelo com os filtros
    const [resAgendamentos, resPacientes] = await Promise.all([
      apiFetchAgendamentos(sinceAgendamentos),
      apiFetchPacientes(sincePacientes),
    ]);

    const countAgendamentos = resAgendamentos.agendamentos?.length ?? 0;
    const countPacientes = resPacientes.pacientes?.length ?? 0;

    // 3. Salvar agendamentos e pacientes no SQLite
    await Promise.all([
      upsertAgendamentos(resAgendamentos.agendamentos ?? []),
      upsertPacientes(resPacientes.pacientes ?? []),
    ]);

    // 4. Atualizar o timestamp da sincronização incremental usando o horário do SERVIDOR
    await Promise.all([
      updateSincronizacao("agendamentos", resAgendamentos.server_time),
      updateSincronizacao("pacientes", resPacientes.server_time),
    ]);

    // 5. Sincronizar arquivos de pacientes (tolerante a falhas: rota pode não existir no servidor ainda)
    let countArquivos = 0;
    try {
      const resArquivos = await apiFetchArquivos(sinceArquivos);
      countArquivos = resArquivos.arquivos?.length ?? 0;
      await upsertArquivos(resArquivos.arquivos ?? []);
      await updateSincronizacao("arquivos_pacientes", resArquivos.server_time);
    } catch (errArquivos: any) {
      console.warn(
        "[Sync] ⚠️ Sincronização de arquivos falhou (rota disponível após deploy do backend):",
        errArquivos?.response?.status ?? errArquivos?.message,
      );
    }

    const horario = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Atualizar notificações locais apenas se houver agendamentos novos ou se for uma carga inicial
    if (countAgendamentos > 0 || force) {
      console.log(
        force
          ? "[Sync] Carga forçada/inicial: Refazendo janela de 60 notificações..."
          : "[Sync] Agendamentos novos: Atualizando lembretes pontuais...",
      );
      await agendarNotificacoesDeSessoes(
        force, // Limpa o sistema apenas em carga forçada/inicial
      );
    }

    lastSyncTime = Date.now();

    // Notificar o sistema que a sincronia terminou (para atualizar telas abertas)
    console.log(
      `[Sync] ✅ Sincronização concluída. Recebidos: ${countAgendamentos} agendamentos, ${countPacientes} pacientes, ${countArquivos} arquivos.`,
    );

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
    console.error("[Sync] Erro:", err);
    return {
      sucesso: false,
      erro: err?.response?.data?.message ?? err?.message ?? "Erro desconhecido",
    };
  }
}
