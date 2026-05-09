'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api, extractErrorMessage } from '@/lib/api';
import { AuthResponse, User } from '@/types';
import { toast } from 'sonner';

export const useAuth = () => {
  const router = useRouter();
  const { user, token, setAuth, logout: clearAuth } = useAuthStore();

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.displayName}!`);
      router.push('/chats');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const register = async (input: {
    email: string;
    username: string;
    password: string;
    displayName: string;
  }) => {
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/register', input);
      setAuth(data.user, data.token);
      toast.success(`Welcome, ${data.user.displayName}!`);
      router.push('/chats');
      return true;
    } catch (error) {
      toast.error(extractErrorMessage(error));
      return false;
    }
  };

  const logout = () => {
    clearAuth();
    toast.success('Logged out');
    router.push('/login');
  };

  const refreshMe = async () => {
    try {
      const { data } = await api.get<User>('/api/auth/me');
      useAuthStore.getState().setUser(data);
      return data;
    } catch {
      clearAuth();
      return null;
    }
  };

  return { user, token, login, register, logout, refreshMe };
};