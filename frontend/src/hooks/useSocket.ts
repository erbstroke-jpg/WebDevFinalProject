'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { Chat, Message } from '@/types';

export const useSocket = () => {
  const token = useAuthStore((s) => s.token);
  const { appendMessage, setTyping, setOnline, upsertChat } = useChatStore();

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

    socket.on('chat:created', (chat: Chat) => {
      upsertChat(chat);
      getSocket()?.emit('chat:join', { chatId: chat.id });
    });

    socket.on('chat:updated', (chat: Chat) => {
      upsertChat(chat);
    });

    socket.on('typing:start', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setTyping(chatId, userId, true);
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