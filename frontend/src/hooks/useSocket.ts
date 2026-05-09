'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { Message } from '@/types';

export const useSocket = () => {
  const token = useAuthStore((s) => s.token);
  const { appendMessage, setTyping, setOnline } = useChatStore();

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    socket.on('connect', () => {
      console.log('[socket] connected');
    });

    socket.on('disconnect', () => {
      console.log('[socket] disconnected');
    });

    socket.on('message:new', (message: Message) => {
      appendMessage(message);
    });

    socket.on('typing:start', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setTyping(chatId, userId, true);
      // Авто-сброс через 3 сек, если не пришло stop
      setTimeout(() => setTyping(chatId, userId, false), 3000);
    });

    socket.on('typing:stop', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setTyping(chatId, userId, false);
    });

    socket.on('user:online', ({ userId }: { userId: string }) => {
      setOnline(userId, true);
    });

    socket.on('user:offline', ({ userId }: { userId: string }) => {
      setOnline(userId, false);
    });

    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
};