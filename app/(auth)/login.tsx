import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { Colors } from "../../constants/colors";
import { agendarNotificacoesDeSessoes } from "../../hooks/useNotifications";
import { apiLogin } from "../../services/api";
import { upsertUser } from "../../services/database";
import { sincronizar, temInternet } from "../../services/sync";
import { useAuthStore } from "../../stores/authStore";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const { setAuth } = useAuthStore();

  const showNotification = (
    message: string,
    type: "success" | "error" = "error",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      // 1. Validar internet (obrigatório para login)
      const online = await temInternet();
      if (!online) {
        Alert.alert(
          "Sem Internet",
          "O login obrigatório requer conexão com a internet para o primeiro acesso e validação.",
        );
        setLoading(false);
        return;
      }

      // 2. Tentar login na API
      const response = await apiLogin(email, password); // 'email' aqui contém Email, CRP ou CPF

      if (response.success) {
        // 3. Salvar no SQLite local
        await upsertUser(response.user);

        // 4. Salvar o token no SecureStore imediatamente
        await SecureStore.setItemAsync("psiflow_token", response.token);

        showNotification("Login realizado! Sincronizando dados...", "success");

        // 5. Sincronizar dados iniciais
        await sincronizar();

        // 6. Agendar notificações Iniciais
        await agendarNotificacoesDeSessoes();

        // 7. Atualizar estado global
        await setAuth(response.token, response.user);
      } else {
        showNotification(response.message || "Falha na autenticação.");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Não foi possível conectar ao servidor.";
      showNotification(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.fundo}>
        <LinearGradient
          colors={["rgba(79, 70, 229, 0.4)", "transparent"]}
          style={[styles.blob, styles.blobA]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={["rgba(79, 70, 229, 0.3)", "transparent"]}
          style={[styles.blob, styles.blobB]}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {notification && (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={[
                styles.notification,
                notification.type === "success"
                  ? styles.successNotification
                  : styles.errorNotification,
              ]}
            >
              <Text style={styles.notificationText}>
                {notification.message}
              </Text>
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.card}
          >
            <View style={styles.header}>
              <Animated.View
                entering={ZoomIn.delay(400).duration(600)}
                style={styles.logoContainer}
              >
                <Image
                  source={require("../../assets/images/logo-icon.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </Animated.View>
              <Animated.Text
                entering={FadeIn.delay(600).duration(600)}
                style={styles.title}
              >
                PsiFlow
              </Animated.Text>
              <Animated.Text
                entering={FadeIn.delay(800).duration(600)}
                style={styles.subtitle}
              >
                Acesse sua conta
              </Animated.Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail, CRP ou CPF</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  placeholderTextColor={Colors.textoTerciario}
                  keyboardType="default"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder=""
                    placeholderTextColor={Colors.textoTerciario}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color={Colors.textoTerciario}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradientPurple}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.branco} />
                  ) : (
                    <Text style={styles.buttonText}>Entrar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footerLinks}>
                <Text style={styles.footerText}>Problemas com acesso?</Text>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Suporte</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrincipal || "#0a0a0a",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  fundo: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.6,
  },
  blobA: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    left: -width * 0.5,
  },
  blobB: {
    width: width,
    height: width,
    bottom: -width * 0.3,
    right: -width * 0.3,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(19, 19, 22, 0.9)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textoSecundario,
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.textoSecundario,
    marginLeft: 4,
  },
  input: {
    height: 50,
    backgroundColor: "rgba(39, 39, 42, 0.5)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(39, 39, 42, 0.5)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
    height: 50,
    justifyContent: "center",
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  footerText: {
    color: Colors.textoTerciario,
    fontSize: 14,
  },
  linkText: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "600",
  },
  notification: {
    width: "100%",
    maxWidth: 380,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  successNotification: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  errorNotification: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  notificationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
