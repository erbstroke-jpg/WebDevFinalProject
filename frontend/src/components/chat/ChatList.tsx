'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Chat } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
        No chats yet. Start one with the search above.
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
                  <AvatarImage src={chat.displayAvatarUrl || undefined} />
                  <AvatarFallback>
                    {chat.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {chat.type === 'DIRECT' && isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium truncate">{chat.displayName}</span>
                  {chat.lastMessage && (
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatDistanceToNow(new Date(chat.lastMessage.createdAt), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}