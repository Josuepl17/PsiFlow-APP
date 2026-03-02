import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../../../constants/colors";
import { API_BASE_URL } from "../../../services/api";
import {
    getArquivosPorPaciente,
    getPacientes,
} from "../../../services/database";
import { ArquivoPaciente, Paciente } from "../../../types";

// Pasta local permanente para os arquivos baixados
const PASTA_DOWNLOADS = FileSystem.documentDirectory + "psiflow_docs/";

/** Garante que a pasta de downloads exista */
async function garantirPasta() {
  const info = await FileSystem.getInfoAsync(PASTA_DOWNLOADS);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PASTA_DOWNLOADS, {
      intermediates: true,
    });
  }
}

/** Constrói a URL pública do arquivo com o prefixo storage/ */
function construirUrl(path: string): string {
  let cleanPath = path.startsWith("/") ? path.slice(1) : path;
  if (!cleanPath.startsWith("storage/")) {
    cleanPath = `storage/${cleanPath}`;
  }
  return `${API_BASE_URL}/${cleanPath}`;
}

/** Caminho local onde o arquivo ficará salvo */
function caminhoLocal(nomeOriginal: string, id: number): string {
  const ext = nomeOriginal.includes(".") ? "" : "";
  // Usa o id para evitar colisão de nomes
  return PASTA_DOWNLOADS + `${id}_${nomeOriginal}${ext}`;
}

function formatarTamanho(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensaoBadge(nomeOriginal: string): string {
  const partes = nomeOriginal.split(".");
  return partes.length > 1 ? partes[partes.length - 1].toUpperCase() : "ARQ";
}

export default function PacienteDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const pacienteId = Number(id);

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [arquivos, setArquivos] = useState<ArquivoPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [baixados, setBaixados] = useState<Record<number, boolean>>({});

  const carregarDados = useCallback(async () => {
    setLoading(true);
    await garantirPasta();

    const [pacientesData, arquivosData] = await Promise.all([
      getPacientes(),
      getArquivosPorPaciente(pacienteId),
    ]);

    const found = pacientesData.find((p) => p.id === pacienteId) ?? null;
    setPaciente(found);
    setArquivos(arquivosData);

    // Verificar quais já foram baixados
    const statusBaixados: Record<number, boolean> = {};
    for (const arq of arquivosData) {
      const local = caminhoLocal(arq.nome_original, arq.id);
      const info = await FileSystem.getInfoAsync(local);
      statusBaixados[arq.id] = info.exists;
    }
    setBaixados(statusBaixados);
    setLoading(false);
  }, [pacienteId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleDownload = async (arq: ArquivoPaciente) => {
    const local = caminhoLocal(arq.nome_original, arq.id);

    // Se já baixado, abre direto
    if (baixados[arq.id]) {
      const disponivel = await Sharing.isAvailableAsync();
      if (disponivel) {
        await Sharing.shareAsync(local, {
          dialogTitle: arq.nome_original,
        });
      } else {
        Alert.alert(
          "Aviso",
          "Não é possível abrir este arquivo neste dispositivo.",
        );
      }
      return;
    }

    try {
      setDownloading(arq.id);
      const url = construirUrl(arq.path);

      const resultado = await FileSystem.downloadAsync(url, local);

      if (resultado.status === 200) {
        setBaixados((prev) => ({ ...prev, [arq.id]: true }));

        const disponivel = await Sharing.isAvailableAsync();
        if (disponivel) {
          await Sharing.shareAsync(local, { dialogTitle: arq.nome_original });
        } else {
          Alert.alert(
            "Download concluído!",
            `"${arq.nome_original}" foi salvo no dispositivo.`,
          );
        }
      } else {
        Alert.alert(
          "Erro",
          "Não foi possível baixar o arquivo. Verifique sua conexão.",
        );
        // Remover arquivo incompleto se houver
        await FileSystem.deleteAsync(local, { idempotent: true });
      }
    } catch (err) {
      Alert.alert(
        "Erro",
        "Falha ao baixar o arquivo. Verifique sua conexão com a internet.",
      );
      console.error("[Download] Erro:", err);
    } finally {
      setDownloading(null);
    }
  };

  const renderArquivo = ({ item }: { item: ArquivoPaciente }) => {
    const jaBaixado = baixados[item.id];
    const estaBaixando = downloading === item.id;
    const ext = extensaoBadge(item.nome_original);

    return (
      <View style={styles.arquivoCard}>
        <View style={styles.arquivoIcone}>
          <Text style={styles.arquivoExt}>{ext}</Text>
        </View>

        <View style={styles.arquivoInfo}>
          <Text style={styles.arquivoNome} numberOfLines={2}>
            {item.nome_original}
          </Text>
          {item.size ? (
            <Text style={styles.arquivoTamanho}>
              {formatarTamanho(item.size)}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.btnDownload, jaBaixado && styles.btnAbrir]}
          onPress={() => handleDownload(item)}
          disabled={estaBaixando}
          activeOpacity={0.7}
        >
          {estaBaixando ? (
            <ActivityIndicator size="small" color={Colors.branco} />
          ) : (
            <>
              <Ionicons
                name={jaBaixado ? "open-outline" : "cloud-download-outline"}
                size={16}
                color={Colors.branco}
              />
              <Text style={styles.btnTexto}>
                {jaBaixado ? "Abrir" : "Baixar"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.solidPurple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Cabeçalho do paciente */}
      <View style={styles.header}>
        <View style={styles.avatarGrande}>
          <Text style={styles.avatarLetra}>
            {paciente?.nome.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <View>
          <Text style={styles.nomePaciente}>
            {paciente?.nome ?? "Paciente"}
          </Text>
          <Text style={styles.statusPaciente}>
            {paciente?.status === "ativo" ? "✅ Ativo" : "⛔ Inativo"}
          </Text>
        </View>
      </View>

      {/* Seção de Documentos */}
      <View style={styles.secaoTitulo}>
        <Ionicons
          name="document-attach-outline"
          size={20}
          color={Colors.solidPurple}
        />
        <Text style={styles.secaoTexto}>Documentos ({arquivos.length})</Text>
      </View>

      {arquivos.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="folder-open-outline"
            size={48}
            color={Colors.textoTerciario}
          />
          <Text style={styles.emptyText}>Nenhum documento disponível</Text>
        </View>
      ) : (
        <FlatList
          data={arquivos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderArquivo}
          contentContainerStyle={styles.lista}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bgPrincipal,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bordaFina,
  },
  avatarGrande: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.solidPurple,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetra: {
    color: Colors.branco,
    fontSize: 28,
    fontWeight: "bold",
  },
  nomePaciente: {
    color: Colors.textoPrimario,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statusPaciente: {
    color: Colors.textoSecundario,
    fontSize: 14,
  },
  secaoTitulo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bordaFina,
  },
  secaoTexto: {
    color: Colors.textoPrimario,
    fontSize: 16,
    fontWeight: "600",
  },
  lista: {
    padding: 16,
    gap: 10,
  },
  arquivoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.bordaFina,
    gap: 12,
  },
  arquivoIcone: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.bgSuperior,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.bordaFina,
  },
  arquivoExt: {
    color: Colors.solidPurple,
    fontSize: 11,
    fontWeight: "bold",
  },
  arquivoInfo: {
    flex: 1,
  },
  arquivoNome: {
    color: Colors.textoPrimario,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  arquivoTamanho: {
    color: Colors.textoTerciario,
    fontSize: 12,
  },
  btnDownload: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.solidPurple,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    minWidth: 80,
    justifyContent: "center",
  },
  btnAbrir: {
    backgroundColor: Colors.sucesso,
  },
  btnTexto: {
    color: Colors.branco,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: Colors.textoTerciario,
    fontSize: 16,
  },
});
