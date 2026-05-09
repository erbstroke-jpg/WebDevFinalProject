'use client';

import { create } from 'zustand';
import { Chat, Message } from '@/types';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  messagesByChat: Record<string, Message[]>;
  typingByChat: Record<string, Set<string>>;
  onlineUsers: Set<string>;

  setChats: (chats: Chat[]) => void;
  upsertChat: (chat: Chat) => void;
  setActiveChatId: (id: string | null) => void;

  setMessages: (chatId: string, messages: Message[]) => void;
  prependMessages: (chatId: string, messages: Message[]) => void;
  appendMessage: (message: Message) => void;

  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;

  setOnline: (userId: string, isOnline: boolean) => void;
  setOnlineUsers: (userIds: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  messagesByChat: {},
  typingByChat: {},
  onlineUsers: new Set(),

  setChats: (chats) => set({ chats }),

  upsertChat: (chat) =>
    set((state) => {
      const exists = state.chats.find((c) => c.id === chat.id);
      const next = exists
        ? state.chats.map((c) => (c.id === chat.id ? chat : c))
        : [chat, ...state.chats];
      return { chats: next };
    }),

  setActiveChatId: (id) => set({ activeChatId: id }),

  setMessages: (chatId, messages) =>
    set((state) => ({
      messagesByChat: { ...state.messagesByChat, [chatId]: messages },
    })),

  prependMessages: (chatId, messages) =>
    set((state) => {
      const existing = state.messagesByChat[chatId] || [];
      return {
        messagesByChat: { ...state.messagesByChat, [chatId]: [...messages, ...existing] },
      };
    }),

  appendMessage: (message) =>
    set((state) => {
      const existing = state.messagesByChat[message.chatId] || [];
      // защита от дублей
      if (existing.some((m) => m.id === message.id)) return {};
      const updatedChats = state.chats.map((c) =>
        c.id === message.chatId
          ? { ...c, lastMessage: message, updatedAt: message.createdAt }
          : c
      );
      // переместим этот чат наверх
      const sortedChats = [...updatedChats].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      return {
        messagesByChat: { ...state.messagesByChat, [message.chatId]: [...existing, message] },
        chats: sortedChats,
      };
    }),

  setTyping: (chatId, userId, isTyping) =>
    set((state) => {
      const set_ = new Set(state.typingByChat[chatId] || []);
      if (isTyping) set_.add(userId);
      else set_.delete(userId);
      return { typingByChat: { ...state.typingByChat, [chatId]: set_ } };
    }),

  setOnline: (userId, isOnline) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      if (isOnline) next.add(userId);
      else next.delete(userId);
      return { onlineUsers: next };
    }),

  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
}));