import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Colors } from "../constants/colors";
import { useAuthStore } from "../stores/authStore";

/**
 * Rota raiz (/) do aplicativo.
 * Serve como um controlador de entrada que redireciona o usuário
 * baseado no seu estado de autenticação.
 */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Se ainda estiver carregando o estado de autenticação, mostra um loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.solidPurple} />
      </View>
    );
  }

  // Redireciona conforme o estado
  if (isAuthenticated) {
    // @ts-ignore - Forçando caminho absoluto caso typedRoutes não reconheça
    return <Redirect href="/(app)/dashboard" />;
  }

  // @ts-ignore - Forçando caminho absoluto
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrincipal,
    justifyContent: "center",
    alignItems: "center",
  },
});
