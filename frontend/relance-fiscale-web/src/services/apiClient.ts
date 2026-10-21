import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/types/api.types';

// Par défaut via le proxy Vite (/api → :8080) pour éviter les soucis CORS quel que soit le port
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Injecte le JWT sur chaque requête sortante
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('relance_fiscale_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Déconnecte automatiquement en cas de 401 (token expiré/invalide), sauf sur le login
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const url = error.config?.url ?? '';
    const estExempt = url.includes('/auth/login') || url.includes('/public/');
    if (error.response?.status === 401 && !estExempt) {
      localStorage.removeItem('relance_fiscale_token');
      localStorage.removeItem('relance_fiscale_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function extraireMessageErreur(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      return "Impossible de joindre le serveur. Vérifiez que l'API est démarrée.";
    }
    return error.response.data?.message ?? "Une erreur inattendue s'est produite";
  }
  return "Une erreur inattendue s'est produite";
}