'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, login as apiLogin, register as apiRegister } from '@/lib/api/auth';
import { tokenStorage } from '@/lib/api/client';
import type { LoginRequest, RegisterRequest, User } from '@/lib/api/types';
import { queryKeys } from '@/lib/hooks/query-keys';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if we have a token on mount
  const hasToken = typeof window !== 'undefined' && !!tokenStorage.get();

  // Fetch current user
  const {
    data: user,
    isLoading: isUserLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getMe,
    enabled: hasToken && isInitialized,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Initialize on mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Handle auth errors
  useEffect(() => {
    if (error) {
      tokenStorage.remove();
      queryClient.setQueryData(queryKeys.auth.me, null);
    }
  }, [error, queryClient]);

  const login = useCallback(
    async (data: LoginRequest) => {
      const response = await apiLogin(data);
      tokenStorage.set(response.accessToken);
      queryClient.setQueryData(queryKeys.auth.me, response.user);
      router.push('/dashboard');
    },
    [queryClient, router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const response = await apiRegister(data);
      tokenStorage.set(response.accessToken);
      queryClient.setQueryData(queryKeys.auth.me, response.user);
      router.push('/dashboard');
    },
    [queryClient, router]
  );

  const logout = useCallback(() => {
    tokenStorage.remove();
    queryClient.clear();
    router.push('/login');
  }, [queryClient, router]);

  const isLoading = !isInitialized || (hasToken && isUserLoading);
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
