'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { Chat, Message } from '@/types';
import { toast } from 'sonner';

// Простой синтез звука без файла — короткий бип через Web Audio
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  } catch {
    // ignore
  }
};

export const useSocket = () => {
  const token = useAuthStore((s) => s.token);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { appendMessage, setTyping, setOnline, upsertChat, markMessagesRead } = useChatStore();
  const handlersBound = useRef(false);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    if (handlersBound.current) return;
    handlersBound.current = true;

    socket.on('connect', () => console.log('[socket] connected'));
    socket.on('disconnect', () => console.log('[socket] disconnected'));

    socket.on('message:new', (message: Message) => {
      appendMessage(message);

      // Уведомление если сообщение НЕ от меня и НЕ активный чат
      const state = useChatStore.getState();
      const isActiveView =
        state.activeChatId === message.chatId &&
        (!message.topicId || state.activeTopicId === message.topicId);

      if (
        message.senderId !== currentUserId &&
        message.type !== 'SYSTEM' &&
        !isActiveView
      ) {
        const chat = state.chats.find((c) => c.id === message.chatId);
        let preview = message.content || '';
        if (message.type === 'IMAGE') preview = '📷 Photo';
        else if (message.type === 'VIDEO') preview = '🎬 Video';
        else if (message.type === 'AUDIO') preview = '🎤 Voice message';
        else if (message.type === 'FILE') preview = `📎 ${message.fileName || 'File'}`;

        const title = chat?.displayName || message.sender.displayName;
        toast.message(title, {
          description: `${chat && chat.type !== 'DIRECT' ? message.sender.displayName + ': ' : ''}${preview}`,
        });
        playNotificationSound();
      }
    });

    socket.on('chat:created', (chat: Chat) => {
      upsertChat(chat);
      getSocket()?.emit('chat:join', { chatId: chat.id });
    });

    socket.on('chat:updated', (chat: Chat) => {
      upsertChat(chat);
    });

    socket.on(
      'message:read',
      ({
        chatId,
        topicId,
        userId,
        messageIds,
      }: {
        chatId: string;
        topicId: string | null;
        userId: string;
        messageIds: string[];
      }) => {
        markMessagesRead(chatId, topicId, messageIds, userId);
      }
    );

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
      handlersBound.current = false;
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Обновление заголовка вкладки с количеством непрочитанных
  const chats = useChatStore((s) => s.chats);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const total = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    document.title = total > 0 ? `(${total}) Messenger` : 'Messenger';
  }, [chats]);
};