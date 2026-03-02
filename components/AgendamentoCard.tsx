import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, getStatusColors } from "../constants/colors";
import { Agendamento } from "../types";

interface AgendamentoCardProps {
  item: Agendamento;
}

/**
 * Componente que renderiza um card individual de agendamento.
 */
export const AgendamentoCard: React.FC<AgendamentoCardProps> = ({ item }) => {
  const { bg, text } = getStatusColors(item.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.pacienteNome}>{item.nome_paciente}</Text>
        <View style={[styles.badge, { backgroundColor: bg }]}>
          <Text style={[styles.badgeText, { color: text }]}>{item.status}</Text>
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

const styles = StyleSheet.create({
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
});
