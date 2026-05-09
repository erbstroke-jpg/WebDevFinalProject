'use client';

import { useEffect } from 'react';
import { api, fileUrl } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Chat } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Hash, Users } from 'lucide-react';

interface Props {
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ onSelectChat }: Props) {
  const { chats, activeChatId, setChats, onlineUsers } = useChatStore();
  const currentUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    api.get<Chat[]>('/api/chats').then(({ data }) => setChats(data));
  }, [setChats]);

  if (!chats.length) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No chats yet. Use «+» above to start one.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {chats.map((chat) => {
          const otherMember =
            chat.type === 'DIRECT'
              ? chat.members.find((m) => m.userId !== currentUserId)
              : null;
          const isOnline = otherMember ? onlineUsers.has(otherMember.userId) : false;

          let icon = null;
          if (chat.type === 'SUPERGROUP') icon = <Hash className="w-3 h-3 mr-1 inline" />;
          else if (chat.type === 'GROUP') icon = <Users className="w-3 h-3 mr-1 inline" />;

          let lastMsgText = chat.lastMessage?.content || 'No messages yet';
          if (chat.lastMessage?.type === 'IMAGE') lastMsgText = '📷 Photo';
          else if (chat.lastMessage?.type === 'VIDEO') lastMsgText = '🎬 Video';
          else if (chat.lastMessage?.type === 'AUDIO') lastMsgText = '🎤 Voice message';
          else if (chat.lastMessage?.type === 'FILE') lastMsgText = `📎 ${chat.lastMessage.fileName || 'File'}`;

          if (chat.lastMessage && chat.lastMessage.type === 'SYSTEM') {
            lastMsgText = `${chat.lastMessage.sender.displayName} ${chat.lastMessage.content}`;
          } else if (chat.lastMessage && chat.type !== 'DIRECT' && chat.lastMessage.type !== 'SYSTEM') {
            lastMsgText = `${chat.lastMessage.sender.displayName}: ${lastMsgText}`;
          }

          const unread = chat.unreadCount || 0;

          return (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors',
                activeChatId === chat.id && 'bg-muted'
              )}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage
                    src={chat.displayAvatarUrl ? fileUrl(chat.displayAvatarUrl) : undefined}
                  />
                  <AvatarFallback>
                    {chat.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {chat.type === 'DIRECT' && isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-2">
                  <span className={cn('truncate flex items-center', unread > 0 ? 'font-semibold' : 'font-medium')}>
                    {icon}
                    {chat.displayName}
                  </span>
                  {chat.lastMessage && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(chat.lastMessage.createdAt), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className={cn('text-sm truncate', unread > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                    {lastMsgText}
                  </p>
                  {unread > 0 && (
                    <span className="shrink-0 bg-primary text-primary-foreground text-xs font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}