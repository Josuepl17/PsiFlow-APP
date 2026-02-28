// Paleta de cores PsiFlow — baseada no sistema web
export const Colors = {
  // Gradiente principal (Usando "as const" para satisfazer requisito de tupla do expo-linear-gradient)
  gradientPurple: ["#312b9c", "#7c3aed", "#d946ef"] as const,
  solidPurple: "#7c3aed",

  // Fundos (dark mode padrão)
  bgPrincipal: "rgb(19, 19, 22)",
  bgPrincipalEscuro: "rgb(27, 24, 27)",
  bgSuperior: "rgb(37, 37, 42)",
  bgMaisSuperior: "rgb(39, 39, 42)",
  bgInputs: "rgb(55, 65, 81)",
  bgCard: "rgb(33, 30, 33)",

  // Textos
  textoPrimario: "#e5e7eb",
  textoSecundario: "#9ca3af",
  textoTerciario: "#6b7280",

  // Bordas
  bordaPadrao: "#3f3f46",
  bordaFina: "#27272a",
  bordaFoco: "#6366f1",
  bordaHeader: "rgba(124, 58, 237, 0.4)",

  // Status — badges
  statusSucessoBg: "rgba(34, 197, 94, 0.15)",
  statusSucessoTexto: "#86efac",

  statusPerigoBg: "rgba(239, 68, 68, 0.15)",
  statusPerigoTexto: "#fca5a5",

  statusAlertaBg: "rgba(245, 158, 11, 0.15)",
  statusAlertaTexto: "#f59e0b",

  statusInfoBg: "rgba(59, 130, 246, 0.15)",
  statusInfoTexto: "#3b82f6",

  statusPrincipalBg: "rgba(0, 94, 131, 0.4)",
  statusPrincipalTexto: "#ffffff",

  statusNeutroBg: "rgba(139, 92, 246, 0.15)",
  statusNeutroTexto: "#a78bfa",

  statusDestaqueBg: "rgba(6, 182, 212, 0.15)",
  statusDestaqueTexto: "#22d3ee",

  // Utilitários
  branco: "#ffffff",
  preto: "#000000",
  transparente: "transparent",
  placeholder: "#6b7280",
  perigo: "#ef4444",
  sucesso: "#22c55e",
};

/**
 * Retorna as cores do badge conforme o status do agendamento
 */
export function getStatusColors(status: string): { bg: string; text: string } {
  switch (status) {
    case "Concluido":
      return { bg: Colors.statusSucessoBg, text: Colors.statusSucessoTexto };
    case "Cancelado Pelo Paciente":
    case "Cancelado Pela Clinica":
    case "Falta":
      return { bg: Colors.statusPerigoBg, text: Colors.statusPerigoTexto };
    case "Agendado":
      return { bg: Colors.statusAlertaBg, text: Colors.statusAlertaTexto };
    case "Visualizado":
      return { bg: Colors.statusInfoBg, text: Colors.statusInfoTexto };
    case "Confirmado":
    case "Confirmação Enviada":
      return {
        bg: Colors.statusPrincipalBg,
        text: Colors.statusPrincipalTexto,
      };
    case "Reagendado":
      return { bg: Colors.statusNeutroBg, text: Colors.statusNeutroTexto };
    default:
      return { bg: Colors.statusAlertaBg, text: Colors.statusAlertaTexto };
  }
}
