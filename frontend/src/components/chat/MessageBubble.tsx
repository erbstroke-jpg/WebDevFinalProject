'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fileUrl } from '@/lib/api';
import { FileText, Download } from 'lucide-react';

interface Props {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const formatBytes = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const renderAttachment = (message: Message, isOwn: boolean) => {
  if (!message.fileUrl) return null;
  const fileUrlResult = fileUrl(message.fileUrl);
  const url = typeof fileUrlResult === 'object' ? fileUrlResult.url : fileUrlResult;

  if (message.type === 'IMAGE') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={message.fileName || ''}
          className="rounded-lg max-w-full max-h-80 object-cover"
        />
      </a>
    );
  }

  if (message.type === 'VIDEO') {
    return <video src={url} controls className="rounded-lg max-w-full max-h-80" />;
  }

  if (message.type === 'AUDIO') {
    return <audio src={url} controls className="max-w-full" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download={message.fileName || undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors',
        isOwn
          ? 'bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20'
          : 'bg-background hover:bg-muted'
      )}
    >
      <FileText className="w-8 h-8 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{message.fileName}</div>
        <div className="text-xs opacity-70">{formatBytes(message.fileSize)}</div>
      </div>
      <Download className="w-4 h-4 shrink-0" />
    </a>
  );
};

export function MessageBubble({ message, isOwn, showAvatar }: Props) {
  const router = useRouter();

  if (message.type === 'SYSTEM') {
    return (
      <div className="text-center text-xs text-muted-foreground my-2">
        <span className="bg-muted/50 px-3 py-1 rounded-full">
          {message.sender.displayName} {message.content}
        </span>
      </div>
    );
  }

  const hasAttachment = !!message.fileUrl;
  const isMediaOnly =
    hasAttachment &&
    !message.content &&
    (message.type === 'IMAGE' || message.type === 'VIDEO' || message.type === 'AUDIO');

  const goToProfile = () => router.push(`/profile/${message.sender.id}`);

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
          <button onClick={goToProfile}>
            <Avatar className="w-8 h-8 hover:opacity-80 transition-opacity">
              <AvatarImage
                src={message.sender.avatarUrl ? fileUrl(message.sender.avatarUrl) : undefined}
              />
              <AvatarFallback className="text-xs">
                {message.sender.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </div>
      <div className={cn('max-w-[70%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {showAvatar && !isOwn && (
          <button
            onClick={goToProfile}
            className="text-xs text-muted-foreground mb-1 px-3 hover:underline"
          >
            {message.sender.displayName}
          </button>
        )}

        <div
          className={cn(
            'rounded-2xl text-sm whitespace-pre-wrap break-words space-y-2',
            isMediaOnly
              ? 'p-1 bg-transparent'
              : cn('px-3 py-2', isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted')
          )}
        >
          {hasAttachment && renderAttachment(message, isOwn)}
          {message.content && !isMediaOnly && <div>{message.content}</div>}
          {message.content && isMediaOnly && (
            <div
              className={cn(
                'px-3 py-1 rounded-2xl text-sm mt-1',
                isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              {message.content}
            </div>
          )}
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