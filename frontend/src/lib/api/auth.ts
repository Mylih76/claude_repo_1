import { apiClient } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from './types';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse, LoginRequest>('/auth/login', data, {
    skipAuth: true,
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiClient.post<AuthResponse, RegisterRequest>('/auth/register', data, {
    skipAuth: true,
  });
}

export async function getMe(): Promise<User> {
  return apiClient.get<User>('/auth/me');
}
