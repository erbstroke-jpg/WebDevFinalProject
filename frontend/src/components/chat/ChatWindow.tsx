'use client';

import { useEffect, useRef } from 'react';
import { api, fileUrl } from '@/lib/api';
import { useChatStore, messageKey } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Message } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TopicSidebar } from './TopicSidebar';
import { ChatMenu } from './ChatMenu';
import { Hash, Users } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { CallButtons } from './CallButtons';

interface Props {
  chatId: string;
}

export function ChatWindow({ chatId }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const {
    chats,
    messagesByChat,
    typingByChat,
    onlineUsers,
    activeTopicId,
    topicsByChat,
    setMessages,
    resetUnread,
  } = useChatStore();

  const chat = chats.find((c) => c.id === chatId);
  const isSupergroup = chat?.isSupergroup;
  const effectiveTopicId = isSupergroup ? activeTopicId : null;
  const key = messageKey(chatId, effectiveTopicId);
  const messages = messagesByChat[key] || [];
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentTopic =
    isSupergroup && activeTopicId
      ? (topicsByChat[chatId] || []).find((t) => t.id === activeTopicId)
      : null;

  // Загрузка истории
  useEffect(() => {
    if (!chatId) return;
    if (isSupergroup && !activeTopicId) return;

    const url = effectiveTopicId
      ? `/api/chats/${chatId}/topics/${effectiveTopicId}/messages`
      : `/api/chats/${chatId}/messages`;

    api.get<Message[]>(url).then(({ data }) => {
      setMessages(key, data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, effectiveTopicId]);

  // Автоскролл вниз
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Маркируем последнее видимое сообщение как прочитанное при открытии чата / новых сообщениях
  useEffect(() => {
    if (!currentUserId || messages.length === 0) return;
    const lastIncoming = [...messages]
      .reverse()
      .find((m) => m.senderId !== currentUserId && m.type !== 'SYSTEM');
    if (!lastIncoming) return;

    // Уже прочитано?
    const alreadyRead = (lastIncoming.reads || []).some((r) => r.userId === currentUserId);
    if (alreadyRead) return;

    getSocket()?.emit('message:read', { chatId, messageId: lastIncoming.id });
    resetUnread(chatId);
  }, [chatId, messages, currentUserId, resetUnread]);

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

  const typingUsers = Array.from(typingByChat[chatId] || []).filter(
    (uid) => uid !== currentUserId
  );

  let subtitle = '';
  if (chat.type === 'DIRECT') subtitle = isOtherOnline ? 'online' : 'offline';
  else subtitle = `${chat.members.length} members`;

  let chatIcon = null;
  if (chat.type === 'SUPERGROUP') chatIcon = <Hash className="w-4 h-4" />;
  else if (chat.type === 'GROUP') chatIcon = <Users className="w-4 h-4" />;

  let placeholder = `Message ${chat.displayName}`;
  if (isSupergroup && currentTopic) {
    placeholder = `Message in ${currentTopic.iconEmoji || '#'} ${currentTopic.name}`;
  }

  return (
    <div className="flex-1 flex">
      {isSupergroup && <TopicSidebar chatId={chatId} />}

      <div className="flex-1 flex flex-col">
        <div className="border-b px-4 py-3 flex items-center gap-3 bg-card">
          <Avatar>
            <AvatarImage
              src={chat.displayAvatarUrl ? fileUrl(chat.displayAvatarUrl) : undefined}
            />
            <AvatarFallback>{chat.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-1">
              {chatIcon}
              {chat.displayName}
            </div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
          {chat.type === 'DIRECT' && otherMember && (
            <CallButtons
              peerId={otherMember.userId}
              peerUsername={otherMember.user.username}
            />
          )}
          <ChatMenu chat={chat} />
        </div>

        {isSupergroup && !activeTopicId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a topic from the left sidebar
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="py-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    No messages yet. Say hi 👋
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const prev = messages[idx - 1];
                    const showAvatar =
                      msg.type === 'SYSTEM' ||
                      !prev ||
                      prev.senderId !== msg.senderId ||
                      prev.type === 'SYSTEM';
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.senderId === currentUserId}
                        showAvatar={showAvatar}
                        members={chat.members}
                        currentUserId={currentUserId}
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

            <MessageInput
              chatId={chatId}
              topicId={effectiveTopicId}
              placeholder={placeholder}
            />
          </>
        )}
      </div>
    </div>
  );
}