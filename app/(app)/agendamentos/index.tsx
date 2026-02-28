import { Ionicons } from "@expo/vector-icons";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, getStatusColors } from "../../../constants/colors";
import { agendarNotificacoesDeSessoes } from "../../../hooks/useNotifications";
import {
    getTodosAgendamentos,
    getTodosPacientes,
} from "../../../services/database";
import { sincronizar, temInternet } from "../../../services/sync";

export default function AgendamentosScreen() {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [filteredAgendamentos, setFilteredAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const insets = useSafeAreaInsets();

  // Filtros
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [filtroPaciente, setFiltroPaciente] = useState("");
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [pacienteFiltroId, setPacienteFiltroId] = useState<number | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [todosAg, todosPac] = await Promise.all([
        getTodosAgendamentos(),
        getTodosPacientes(),
      ]);
      setAgendamentos(todosAg);
      setPacientes(todosPac);
      verificarConexao();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const verificarConexao = async () => {
    const online = await temInternet();
    setIsOnline(online);
  };

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Aplicar filtros
  useEffect(() => {
    let result = agendamentos;

    // Filtro por data (obrigatório começar focado no dia atual conforme pedido)
    result = result.filter((item) =>
      isSameDay(parseISO(item.data), dataSelecionada),
    );

    // Filtro por nome do paciente
    if (filtroPaciente) {
      result = result.filter((item) =>
        item.nome_paciente.toLowerCase().includes(filtroPaciente.toLowerCase()),
      );
    }

    // Filtro por ID específico do paciente
    if (pacienteFiltroId) {
      result = result.filter((item) => item.paciente_id === pacienteFiltroId);
    }

    setFilteredAgendamentos(result);
  }, [agendamentos, dataSelecionada, filtroPaciente, pacienteFiltroId]);

  const onRefresh = async () => {
    setRefreshing(true);
    const online = await temInternet();
    if (online) {
      await sincronizar();
      await agendarNotificacoesDeSessoes();
    }
    await carregarDados();
    setRefreshing(false);
  };

  const manualSync = async () => {
    setRefreshing(true);
    const result = await sincronizar();
    if (result.sucesso) {
      await agendarNotificacoesDeSessoes();
      await carregarDados();
    } else if (result.semInternet) {
      alert("Sem conexão. Usando dados locais.");
    } else {
      alert("Erro na sincronização: " + result.erro);
    }
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: any }) => {
    const { bg, text } = getStatusColors(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.pacienteNome}>{item.nome_paciente}</Text>
          <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={[styles.badgeText, { color: text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={Colors.textoSecundario}
            />
            <Text style={styles.infoText}>
              {item.hora_inicial.substring(0, 5)} -{" "}
              {item.hora_final?.substring(0, 5) || "--:--"}
            </Text>
          </View>

          {item.observacao ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={Colors.textoSecundario}
              />
              <Text style={styles.infoText} numberOfLines={2}>
                {item.observacao}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.solidPurple} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toolbar / Filtros */}
      <View style={styles.toolbar}>
        <View style={styles.dateSelector}>
          <TouchableOpacity
            onPress={() =>
              setDataSelecionada(
                (prev) => new Date(prev.setDate(prev.getDate() - 1)),
              )
            }
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={Colors.textoPrimario}
            />
          </TouchableOpacity>

          <Text style={styles.dateText}>
            {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </Text>

          <TouchableOpacity
            onPress={() =>
              setDataSelecionada(
                (prev) => new Date(prev.setDate(prev.getDate() + 1)),
              )
            }
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textoPrimario}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.textoTerciario}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Filtrar por paciente..."
            placeholderTextColor={Colors.textoTerciario}
            value={filtroPaciente}
            onChangeText={setFiltroPaciente}
          />
          {filtroPaciente ? (
            <TouchableOpacity onPress={() => setFiltroPaciente("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.textoTerciario}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredAgendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 150 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.solidPurple}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={Colors.bgMaisSuperior}
            />
            <Text style={styles.emptyText}>
              Nenhum agendamento para este dia.
            </Text>
          </View>
        }
      />

      {/* Botão Sincronizar Flutuante */}
      {isOnline && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 24 + insets.bottom }]}
          onPress={manualSync}
        >
          <LinearGradient
            colors={Colors.gradientPurple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGradient}
          >
            <Ionicons name="sync" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrincipal,
  },
  center: {
    flex: 1,
    backgroundColor: Colors.bgPrincipal,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbar: {
    padding: 16,
    backgroundColor: Colors.bgPrincipal,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bordaFina,
    gap: 12,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  dateText: {
    color: Colors.textoPrimario,
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(39, 39, 42, 0.5)",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "rgba(37, 37, 42, 0.8)",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  pacienteNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textoPrimario,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textoSecundario,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 16,
  },
  emptyText: {
    color: Colors.textoTerciario,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
