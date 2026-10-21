export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page courante (0-indexé)
  size: number;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path?: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  nomComplet: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  motDePasse: string;
}