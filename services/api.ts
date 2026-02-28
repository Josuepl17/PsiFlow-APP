import axios, { AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";

// ⚠️ Altere para a URL do seu servidor Laravel em produção
export const API_BASE_URL = "https://cronosdev.com.br"; // Servidor de produção

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

export async function apiFetchAgendamentos() {
  const response = await api.get("/mobile/agendamentos");
  return response.data; // { success, agendamentos, total }
}

// ─── Pacientes ─────────────────────────────────────────────────────────────

export async function apiFetchPacientes() {
  const response = await api.get("/mobile/pacientes");
  return response.data; // { success, pacientes, total }
}

export default api;
