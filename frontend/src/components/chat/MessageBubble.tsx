'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

export function MessageBubble({ message, isOwn, showAvatar }: Props) {
  return (
    <div
      className={cn(
        'flex gap-2 px-4',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        showAvatar ? 'mt-3' : 'mt-1'
      )}
    >
      <div className="w-8 shrink-0">
        {showAvatar && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.sender.avatarUrl || undefined} />
            <AvatarFallback className="text-xs">
              {message.sender.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className={cn('max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {showAvatar && !isOwn && (
          <div className="text-xs text-muted-foreground mb-1 px-3">
            {message.sender.displayName}
          </div>
        )}
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          {message.content}
        </div>
        <div
          className={cn(
            'text-[10px] text-muted-foreground mt-0.5 px-3',
            isOwn ? 'text-right' : 'text-left'
          )}
        >
          {format(new Date(message.createdAt), 'HH:mm')}
        </div>
      </div>
    </div>
  );
}