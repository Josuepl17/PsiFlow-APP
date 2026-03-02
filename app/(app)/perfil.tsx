import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { API_BASE_URL } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";

export default function PerfilScreen() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Garante que se o backend mandar apenas o caminho (ex: psicologos/avatars/foto.jpg),
  // a gente adicione o prefixo /storage/ e a URL base.
  const getFotoUrl = (fotoPath: string | null | undefined) => {
    if (!fotoPath) return null;
    if (fotoPath.startsWith("http")) return fotoPath;

    // Remove barra inicial se existir para padronizar
    let cleanPath = fotoPath.startsWith("/") ? fotoPath.slice(1) : fotoPath;

    // Se o caminho não começar com 'storage/', nós adicionamos
    if (!cleanPath.startsWith("storage/")) {
      cleanPath = `storage/${cleanPath}`;
    }

    return `${API_BASE_URL}/${cleanPath}`;
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair do aplicativo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/");
        },
      },
    ]);
  };

  const fotoUrl = getFotoUrl(user?.foto);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View style={styles.photoContainer}>
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.placeholderPhoto}>
              <Ionicons name="person" size={60} color={Colors.textoTerciario} />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.nome || "Usuário"}</Text>
        <Text style={styles.userEmail}>
          {user?.email || "E-mail não informado"}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>CRP</Text>
          <Text style={styles.infoValue}>{user?.crp || "Não informado"}</Text>
        </View>

        {user?.telefone && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Telefone</Text>
            <Text style={styles.infoValue}>{user.telefone}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.branco} />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrincipal,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bordaFina,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.bgSuperior,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.solidPurple,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  placeholderPhoto: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textoPrimario,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.textoSecundario,
  },
  infoSection: {
    padding: 20,
    gap: 16,
  },
  infoCard: {
    backgroundColor: Colors.bgCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: Colors.bordaFina,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textoTerciario,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 18,
    color: Colors.textoPrimario,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: Colors.perigo,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 4,
    shadowColor: Colors.preto,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: Colors.branco,
    fontSize: 18,
    fontWeight: "bold",
  },
});
