import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Colors } from "../constants/colors";
import { useAutoSync } from "../hooks/useAutoSync";
import { useUpdateCheck } from "../hooks/useUpdateCheck";
import { initDatabase } from "../services/database";
import { useAuthStore } from "../stores/authStore";

// Silenciar avisos do Expo Go sobre funcionalidades de notificação
LogBox.ignoreLogs([
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadAuth } = useAuthStore();

  // Ativar sincronização automática global (apenas se estiver autenticado)
  useAutoSync(isAuthenticated);

  // Ativar verificação de atualizações do EAS
  useUpdateCheck();

  useEffect(() => {
    async function bootstrap() {
      await initDatabase();
      await loadAuth();
    }
    bootstrap();
  }, [loadAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/(app)/dashboard");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isLoading]);

  // Mostrar loading apenas enquanto carrega a autenticação
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.solidPurple} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Colors.bgPrincipal} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.bgPrincipal,
    justifyContent: "center",
    alignItems: "center",
  },
});
