import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.bgPrincipal,
          borderBottomWidth: 1,
          borderBottomColor: Colors.bordaFina,
        },
        headerTitleStyle: {
          color: Colors.textoPrimario,
          fontWeight: "bold",
        },
        tabBarStyle: {
          backgroundColor: Colors.bgPrincipal,
          borderTopWidth: 1,
          borderTopColor: Colors.bordaFina,
          // Altura dinâmica baseada na Safe Area (estilo WhatsApp)
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.solidPurple,
        tabBarInactiveTintColor: Colors.textoTerciario,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Início",
          tabBarLabel: "Início",
          headerTitle: "PsiFlow - Início",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agendamentos"
        options={{
          title: "Agenda",
          tabBarLabel: "Agenda",
          headerTitle: "PsiFlow - Agenda",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pacientes"
        options={{
          title: "Pacientes",
          tabBarLabel: "Pacientes",
          headerTitle: "PsiFlow - Pacientes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="paciente/[id]"
        options={{
          href: null,
          headerTitle: "Detalhes do Paciente",
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
          headerTitle: "PsiFlow - Meu Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
