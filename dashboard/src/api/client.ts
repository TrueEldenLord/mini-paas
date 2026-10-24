import axios from 'axios';
import type { Deployment, CreateDeploymentPayload, AuthTokens, User } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (email: string, username: string, password: string): Promise<User> =>
  api.post('/auth/register', { email, username, password }).then((r) => r.data);

export const login = (email: string, password: string): Promise<AuthTokens> =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

// Deployments
export const listDeployments = (): Promise<Deployment[]> =>
  api.get('/deployments').then((r) => r.data);

export const getDeployment = (id: string): Promise<Deployment> =>
  api.get(`/deployments/${id}`).then((r) => r.data);

export const createDeployment = (payload: CreateDeploymentPayload): Promise<Deployment> =>
  api.post('/deployments', payload).then((r) => r.data);

export const deleteDeployment = (id: string): Promise<void> =>
  api.delete(`/deployments/${id}`).then((r) => r.data);
