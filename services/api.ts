import axios, { AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";

// ⚠️ Altere para a URL do seu servidor Laravel em produção
export const API_BASE_URL =
  "https://josuepachecodelima1771089880.2252045.meusitehostgator.com.br";

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor: injeta o token em todas as requisições autenticadas
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("psiflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function apiLogin(credential: string, password: string) {
  const response = await api.post("/mobile/login", { credential, password });
  return response.data; // { success, token, user }
}

export async function apiLogout() {
  const response = await api.post("/mobile/logout");
  return response.data;
}

export async function apiMe() {
  const response = await api.get("/mobile/me");
  return response.data;
}

// ─── Agendamentos ──────────────────────────────────────────────────────────

export async function apiFetchAgendamentos(since?: string | null) {
  const response = await api.get("/mobile/agendamentos", {
    params: { since },
  });
  return response.data; // { success, agendamentos, total }
}

export async function apiMarcarLembreteEnviado(id: number) {
  const response = await api.post(`/mobile/agendamentos/${id}/lembrete`);
  return response.data;
}

// ─── Pacientes ─────────────────────────────────────────────────────────────

export async function apiFetchPacientes(since?: string | null) {
  const response = await api.get("/mobile/pacientes", {
    params: { since },
  });
  return response.data; // { success, pacientes, total }
}

export default api;
