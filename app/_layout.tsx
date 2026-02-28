import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Colors } from "../constants/colors";
import { initDatabase } from "../services/database";
import { useAuthStore } from "../stores/authStore";

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadAuth } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      await initDatabase();
      await loadAuth();
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/(app)/agendamentos");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isLoading]);

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
