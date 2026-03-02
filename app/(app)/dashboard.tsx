import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
    DeviceEventEmitter,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LoadingOverlay } from "../../components/LoadingOverlay";
import { Colors } from "../../constants/colors";
import { getEstatisticasMensais } from "../../services/database";
import { useSyncStore } from "../../stores/syncStore";
import { DashboardStats } from "../../types";

export default function DashboardScreen() {
  const { isInitialSyncing } = useSyncStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const mesAtual = format(new Date(), "MMMM", { locale: ptBR });
  const mesAnoSQL = format(new Date(), "yyyy-MM");

  const carregarStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEstatisticasMensais(mesAnoSQL);
      setStats(data);
    } catch (error) {
      console.error("[Dashboard] Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  }, [mesAnoSQL]);

  useEffect(() => {
    carregarStats();
  }, [carregarStats]);

  // Atualizar quando houver sincronização
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("sync-finished", () => {
      carregarStats();
    });
    return () => sub.remove();
  }, [carregarStats]);

  if (loading || isInitialSyncing) {
    return <LoadingOverlay visible={true} />;
  }

  const taxaConclusao =
    stats?.total && stats.total > 0
      ? (stats.concluidos / stats.total) * 100
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 20 },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.mesLabel}>Resumo de {mesAtual}</Text>
        <Text style={styles.boasVindas}>Olá, psicólogo(a)!</Text>
      </View>

      {/* Card Destaque (Principal) */}
      <LinearGradient
        colors={[Colors.solidPurple, "#4338ca"]}
        style={styles.mainCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.mainCardContent}>
          <View>
            <Text style={styles.totalLabel}>Total de Atendimentos</Text>
            <Text style={styles.totalValue}>{stats?.total || 0}</Text>
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="bar-chart" size={30} color={Colors.solidPurple} />
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Taxa de Conclusão</Text>
            <Text style={styles.progressValue}>
              {taxaConclusao.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${taxaConclusao}%` }]}
            />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.grid}>
        {/* Card Concluídos */}
        <View style={styles.statCard}>
          <View
            style={[
              styles.statIcon,
              { backgroundColor: "rgba(34, 197, 94, 0.1)" },
            ]}
          >
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          </View>
          <Text style={styles.statValue}>{stats?.concluidos || 0}</Text>
          <Text style={styles.statLabel}>Concluídos</Text>
        </View>

        {/* Card Agendados */}
        <View style={styles.statCard}>
          <View
            style={[
              styles.statIcon,
              { backgroundColor: "rgba(59, 130, 246, 0.1)" },
            ]}
          >
            <Ionicons name="calendar-outline" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.statValue}>{stats?.agendados || 0}</Text>
          <Text style={styles.statLabel}>Agendados</Text>
        </View>

        {/* Card Cancelados */}
        <View style={[styles.statCard, styles.fullWidth]}>
          <View
            style={[
              styles.statIcon,
              { backgroundColor: "rgba(239, 68, 68, 0.1)" },
            ]}
          >
            <Ionicons name="close-circle" size={24} color="#ef4444" />
          </View>
          <View style={styles.cancelContent}>
            <Text style={styles.statValue}>{stats?.cancelados || 0}</Text>
            <Text style={styles.statLabel}>Cancelados / Faltas</Text>
          </View>
        </View>
      </View>

      <View style={styles.tipsContainer}>
        <Ionicons name="bulb-outline" size={20} color={Colors.textoTerciario} />
        <Text style={styles.tipText}>
          Dica: Todos os dados são sincronizados automaticamente com o servidor
          do PsiFlow.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrincipal,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 25,
  },
  mesLabel: {
    color: Colors.textoTerciario,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  boasVindas: {
    color: Colors.textoPrimario,
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },
  mainCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  totalValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  progressValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: Colors.bgCard,
    width: "48%",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.bordaFina,
  },
  fullWidth: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cancelContent: {
    marginLeft: 16,
    flex: 1,
  },
  statValue: {
    color: Colors.textoPrimario,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.textoTerciario,
    fontSize: 12,
    fontWeight: "500",
  },
  tipsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 8,
  },
  tipText: {
    color: Colors.textoTerciario,
    fontSize: 12,
    marginLeft: 10,
    fontStyle: "italic",
    flex: 1,
  },
});
