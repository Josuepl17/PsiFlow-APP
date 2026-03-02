import * as Notifications from "expo-notifications";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Alert } from "react-native";

export function useUpdateCheck() {
  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    if (__DEV__) return; // Não monitorar em desenvolvimento

    if (isUpdatePending) {
      exibirNotificacaoUpdate();
    }
  }, [isUpdatePending]);

  async function exibirNotificacaoUpdate() {
    // 1. Notificação Push Local
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚀 Atualização Disponível",
        body: "Uma nova versão do PsiFlow foi baixada e está pronta para uso!",
        data: { type: "update-ready" },
        sound: "default",
      },
      trigger: null, // Exibir imediatamente
    });

    // 2. Alerta Visual (Opcional, mas recomendado para ação imediata)
    Alert.alert(
      "App Atualizado!",
      "Uma nova atualização foi instalada. Deseja reiniciar o aplicativo agora para aplicar as mudanças?",
      [
        { text: "Depois", style: "cancel" },
        {
          text: "Reiniciar Agora",
          onPress: () => Updates.reloadAsync(),
        },
      ],
    );
  }
}
