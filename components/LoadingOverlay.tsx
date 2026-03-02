import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/colors";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * Componente de overlay de carregamento reutilizável para todo o app.
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = "Carregando...",
}) => {
  if (!visible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={Colors.solidPurple} />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  loadingCard: {
    backgroundColor: "rgba(30, 30, 35, 0.95)",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    gap: 15,
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
