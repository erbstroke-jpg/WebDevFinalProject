'use client';

import { create } from 'zustand';
import { Chat, Message, MessageRead, Topic } from '@/types';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  activeTopicId: string | null;
  messagesByChat: Record<string, Message[]>;
  topicsByChat: Record<string, Topic[]>;
  typingByChat: Record<string, Set<string>>;
  onlineUsers: Set<string>;

  setChats: (chats: Chat[]) => void;
  upsertChat: (chat: Chat) => void;
  setActiveChatId: (id: string | null) => void;
  setActiveTopicId: (id: string | null) => void;

  setMessages: (key: string, messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  markMessagesRead: (chatId: string, topicId: string | null, messageIds: string[], userId: string) => void;

  setTopics: (chatId: string, topics: Topic[]) => void;
  addTopic: (chatId: string, topic: Topic) => void;

  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;

  setOnline: (userId: string, isOnline: boolean) => void;

  resetUnread: (chatId: string) => void;
}

export const messageKey = (chatId: string, topicId: string | null) =>
  topicId ? `${chatId}:${topicId}` : chatId;

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  activeTopicId: null,
  messagesByChat: {},
  topicsByChat: {},
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

  setActiveChatId: (id) => set({ activeChatId: id, activeTopicId: null }),
  setActiveTopicId: (id) => set({ activeTopicId: id }),

  setMessages: (key, messages) =>
    set((state) => ({
      messagesByChat: { ...state.messagesByChat, [key]: messages },
    })),

  appendMessage: (message) =>
    set((state) => {
      const key = messageKey(message.chatId, message.topicId);
      const existing = state.messagesByChat[key] || [];
      if (existing.some((m) => m.id === message.id)) return {};

      // Увеличиваем unread если это не активный чат и сообщение не от меня
      const isActiveView =
        state.activeChatId === message.chatId &&
        (!message.topicId || state.activeTopicId === message.topicId);

      const updatedChats = state.chats.map((c) => {
        if (c.id !== message.chatId) return c;
        const incrementUnread = !isActiveView && message.type !== 'SYSTEM';
        return {
          ...c,
          lastMessage: message,
          updatedAt: message.createdAt,
          unreadCount: incrementUnread ? (c.unreadCount || 0) + 1 : c.unreadCount,
        };
      });

      const sortedChats = [...updatedChats].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return {
        messagesByChat: { ...state.messagesByChat, [key]: [...existing, message] },
        chats: sortedChats,
      };
    }),

  markMessagesRead: (chatId, topicId, messageIds, userId) =>
    set((state) => {
      const key = messageKey(chatId, topicId);
      const list = state.messagesByChat[key];
      if (!list) return {};
      const ids = new Set(messageIds);
      const newRead: MessageRead = { userId, readAt: new Date().toISOString() };
      const updated = list.map((m) => {
        if (!ids.has(m.id)) return m;
        if ((m.reads || []).some((r) => r.userId === userId)) return m;
        return { ...m, reads: [...(m.reads || []), newRead] };
      });
      return { messagesByChat: { ...state.messagesByChat, [key]: updated } };
    }),

  setTopics: (chatId, topics) =>
    set((state) => ({ topicsByChat: { ...state.topicsByChat, [chatId]: topics } })),

  addTopic: (chatId, topic) =>
    set((state) => {
      const existing = state.topicsByChat[chatId] || [];
      if (existing.some((t) => t.id === topic.id)) return {};
      return {
        topicsByChat: { ...state.topicsByChat, [chatId]: [...existing, topic] },
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

  resetUnread: (chatId) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
    })),
}));