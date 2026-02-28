import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getAgendamentosFuturos } from "../services/database";

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
 * Cancela as anteriores antes de reagendar (evita duplicatas).
 */
export async function agendarNotificacoesDeSessoes(): Promise<number> {
  const permissao = await solicitarPermissaoNotificacoes();
  if (!permissao) return 0;

  await cancelarTodasNotificacoes();

  const agora = new Date().toISOString();
  const agendamentos = await getAgendamentosFuturos(agora);

  let agendadas = 0;

  for (const ag of agendamentos) {
    try {
      // Montar Date completa do agendamento
      const dataHoraStr = `${ag.data}T${ag.hora_inicial}`;
      const dataHoraSessao = new Date(dataHoraStr);

      // 1h antes
      const dataNotificacao = new Date(
        dataHoraSessao.getTime() - 60 * 60 * 1000,
      );

      // Só agendar se ainda está no futuro
      if (dataNotificacao > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🗓️ Sessão em 1 hora",
            body: `Paciente: ${ag.nome_paciente} às ${ag.hora_inicial}`,
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
      }
    } catch {
      // Ignora agendamentos com datas inválidas
    }
  }

  return agendadas;
}

export { Notifications };
