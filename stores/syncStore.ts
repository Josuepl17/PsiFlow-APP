import { create } from "zustand";

interface SyncState {
  isInitialSyncing: boolean;
  setIsInitialSyncing: (status: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isInitialSyncing: false,
  setIsInitialSyncing: (status) => set({ isInitialSyncing: status }),
}));
