import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { error?: string; details?: Array<{ message: string }> };
    if (data?.details?.length) {
      return data.details.map((d) => d.message).join(', ');
    }
    return data?.error || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
};

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  messageType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
}

export const uploadFile = async (
  file: File | Blob,
  fileName?: string
): Promise<UploadResult> => {
  const formData = new FormData();
  // Если это Blob (например запись голосового) — нужно дать имя
  if (file instanceof File) {
    formData.append('file', file);
  } else {
    formData.append('file', file, fileName || 'recording.webm');
  }

  const { data } = await api.post<UploadResult>('/api/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
};

// Хелпер для построения полного URL к файлу
export const fileUrl = (relativeUrl: string | null | undefined): string => {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http')) return relativeUrl;
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${base}${relativeUrl}`;
};