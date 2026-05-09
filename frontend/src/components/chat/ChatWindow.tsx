'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Message } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface Props {
  chatId: string;
}

export function ChatWindow({ chatId }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { chats, messagesByChat, typingByChat, onlineUsers, setMessages } = useChatStore();
  const chat = chats.find((c) => c.id === chatId);
  const messages = messagesByChat[chatId] || [];
  const bottomRef = useRef<HTMLDivElement>(null);

  // Загрузка истории при смене чата
  useEffect(() => {
    if (!chatId) return;
    api.get<Message[]>(`/api/chats/${chatId}/messages`).then(({ data }) => {
      setMessages(chatId, data);
    });
  }, [chatId, setMessages]);

  // Автоскролл вниз при новых сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Chat not found
      </div>
    );
  }

  const otherMember =
    chat.type === 'DIRECT' ? chat.members.find((m) => m.userId !== currentUserId) : null;
  const isOtherOnline = otherMember ? onlineUsers.has(otherMember.userId) : false;

  // Кто печатает (кроме нас самих)
  const typingUsers = Array.from(typingByChat[chatId] || []).filter(
    (uid) => uid !== currentUserId
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 bg-card">
        <Avatar>
          <AvatarImage src={chat.displayAvatarUrl || undefined} />
          <AvatarFallback>{chat.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">{chat.displayName}</div>
          <div className="text-xs text-muted-foreground">
            {chat.type === 'DIRECT'
              ? isOtherOnline
                ? 'online'
                : 'offline'
              : `${chat.members.length} members`}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="py-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No messages yet. Say hi 👋
            </div>
          ) : (
            messages.map((msg, idx) => {
              const prev = messages[idx - 1];
              const showAvatar = !prev || prev.senderId !== msg.senderId;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === currentUserId}
                  showAvatar={showAvatar}
                />
              );
            })
          )}
          {typingUsers.length > 0 && (
            <div className="text-xs text-muted-foreground px-4 mt-2 italic">
              typing...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <MessageInput chatId={chatId} />
    </div>
  );
}