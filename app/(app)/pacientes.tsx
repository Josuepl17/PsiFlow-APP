import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../../constants/colors";
import { getPacientes } from "../../services/database";
import { Paciente } from "../../types";

export default function PacientesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    const dados = await getPacientes();
    setPacientes(dados);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = busca.trim()
    ? pacientes.filter((p) =>
        p.nome.toLowerCase().includes(busca.toLowerCase()),
      )
    : pacientes;

  const renderItem = ({ item }: { item: Paciente }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/paciente/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarLetter}>
          {item.nome.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardNome}>{item.nome}</Text>
        <Text style={styles.cardDetalhe}>
          {item.status === "ativo" ? "✅ Ativo" : "⛔ Inativo"}
          {item.telefone ? `  •  ${item.telefone}` : ""}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={Colors.textoTerciario}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color={Colors.textoTerciario}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar paciente..."
          placeholderTextColor={Colors.placeholder}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.solidPurple} />
        </View>
      ) : filtrados.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="people-outline"
            size={48}
            color={Colors.textoTerciario}
          />
          <Text style={styles.emptyText}>Nenhum paciente encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrincipal,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgSuperior,
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.bordaFina,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: Colors.textoPrimario,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.bordaFina,
    gap: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.solidPurple,
    justifyContent: "center",
    alignItems: "center",
  },
  cardAvatarLetter: {
    color: Colors.branco,
    fontSize: 18,
    fontWeight: "bold",
  },
  cardInfo: {
    flex: 1,
  },
  cardNome: {
    color: Colors.textoPrimario,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardDetalhe: {
    color: Colors.textoSecundario,
    fontSize: 13,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    color: Colors.textoTerciario,
    fontSize: 16,
  },
});
