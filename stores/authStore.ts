import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

export interface UserData {
  id: number;
  clinica_id: number | null;
  nome: string | null;
  foto: string | null;
  estado: string | null;
  email: string | null;
  cpf: string | null;
  cargo: string | null;
  crp: string | null;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  genero: string | null;
  status: string;
  primeiro_acesso: string;
  remember_token: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthState {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (token: string, user: UserData) => Promise<void>;
  loadAuth: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

const TOKEN_KEY = "psiflow_token";
const USER_KEY = "psiflow_user";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      if (token && userStr) {
        const user = JSON.parse(userStr) as UserData;
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
