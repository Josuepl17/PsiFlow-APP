import { format } from "date-fns";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiMarcarLembreteEnviado } from "../services/api";
import {
  getAgendamentosFuturos,
  marcarLembreteEnviado,
} from "../services/database";
import { Agendamento } from "../types";

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Solicita permissão de notificações ao sistema.
 */
export async function solicitarPermissaoNotificacoes(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("sessoes", {
      name: "Lembretes de Sessão",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7c3aed",
    });
  }

  return finalStatus === "granted";
}

/**
 * Cancela todas as notificações agendadas existentes.
 */
export async function cancelarTodasNotificacoes(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Agenda notificações locais 1h antes para cada agendamento futuro.
 * 'novosAgendamentos': Se passado, agenda apenas estes pontualmente.
 * 'cancelarPrior': Se true, limpa o sistema antes de começar (usar na primeira carga).
 */
export async function agendarNotificacoesDeSessoes(
  cancelarPrior: boolean = false,
): Promise<number> {
  const permissao = await solicitarPermissaoNotificacoes();
  if (!permissao) return 0;

  if (cancelarPrior) {
    console.log(
      "[Notificações] Limpando fila antiga para evitar limite de 500",
    );
    await cancelarTodasNotificacoes();
  }

  const agoraDate = new Date();
  const dataLocal = format(agoraDate, "yyyy-MM-dd");
  const horaLocal = format(agoraDate, "HH:mm:ss");

  console.log(
    `[Notificações] Processando agendamentos após: ${dataLocal} ${horaLocal}`,
  );

  // Sempre busca os próximos 60 do banco local para garantir a janela cronológica correta
  const agendamentos: Agendamento[] = await getAgendamentosFuturos(
    dataLocal,
    horaLocal,
    60,
  );

  let agendadas = 0;

  for (const ag of agendamentos) {
    try {
      const dataHoraStr = `${ag.data}T${ag.hora_inicial}`;
      const dataHoraSessao = new Date(dataHoraStr);
      const dataNotificacao = new Date(
        dataHoraSessao.getTime() - 60 * 60 * 1000,
      );

      if (dataNotificacao > agoraDate) {
        const horaAlerta = format(dataNotificacao, "HH:mm:ss");
        console.log(
          `[Notificações] ⏰ AGENDANDO: ag_${ag.id} | Sessão: ${ag.hora_inicial.substring(0, 5)} | Alerta Programado: ${horaAlerta}`,
        );
        await Notifications.scheduleNotificationAsync({
          identifier: `ag_${ag.id}`,
          content: {
            title: "🗓️ Sessão em 1 hora",
            body: `Paciente: ${ag.nome_paciente} às ${ag.hora_inicial.substring(0, 5)}`,
            data: { agendamento_id: ag.id },
            sound: "default",
            ...(Platform.OS === "android" && { channelId: "sessoes" }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: dataNotificacao,
          },
        });
        agendadas++;
      } else if (dataHoraSessao > agoraDate && ag.lembrete_enviado === 0) {
        console.log(
          `[Notificações] ⚡ DISPARO IMEDIATO: ag_${ag.id} | Sessão: ${ag.hora_inicial.substring(0, 5)} (Menos de 1h para o início)`,
        );
        await Notifications.scheduleNotificationAsync({
          identifier: `ag_${ag.id}`,
          content: {
            title: "🔔 Sessão em breve",
            body: `Sessão com ${ag.nome_paciente} às ${ag.hora_inicial.substring(0, 5)}`,
            data: { agendamento_id: ag.id },
            sound: "default",
            ...(Platform.OS === "android" && { channelId: "sessoes" }),
          },
          trigger: null,
        });
        await marcarLembreteEnviado(ag.id);
        try {
          await apiMarcarLembreteEnviado(ag.id);
        } catch {}
        agendadas++;
      }
    } catch (e) {
      console.error("Erro ao agendar notificação:", e);
    }
  }

  console.log(`[Notificações] ${agendadas} lembretes processados.`);
  return agendadas;
}

export { Notifications };

