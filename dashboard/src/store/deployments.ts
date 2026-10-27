import { create } from 'zustand';
import type { Deployment } from '../types';
import { listDeployments, createDeployment, deleteDeployment } from '../api/client';

interface DeploymentStore {
  deployments: Deployment[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;

  fetchDeployments: () => Promise<void>;
  submitDeployment: (repoUrl: string) => Promise<void>;
  removeDeployment: (id: string) => Promise<void>;
  selectDeployment: (id: string | null) => void;
}

export const useDeploymentStore = create<DeploymentStore>((set) => ({
  deployments: [],
  selectedId: null,
  loading: false,
  error: null,

  fetchDeployments: async () => {
    set({ loading: true, error: null });
    try {
      const deployments = await listDeployments();
      set({ deployments, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  submitDeployment: async (repoUrl: string) => {
    set({ loading: true, error: null });
    try {
      const deployment = await createDeployment({ repo_url: repoUrl });
      set((state) => ({ deployments: [deployment, ...state.deployments], loading: false }));
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  removeDeployment: async (id: string) => {
    try {
      await deleteDeployment(id);
      set((state) => ({ deployments: state.deployments.filter((d) => d.id !== id) }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  selectDeployment: (id) => set({ selectedId: id }),
}));
