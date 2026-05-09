'use client';

import { Check, CheckCheck } from 'lucide-react';
import { Message, ChatMember } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  message: Message;
  members: ChatMember[];
  currentUserId: string;
}

export function ReadReceipt({ message, members, currentUserId }: Props) {
  // Только для своих сообщений
  if (message.senderId !== currentUserId) return null;

  // Список других участников
  const others = members.filter((m) => m.userId !== currentUserId);
  if (others.length === 0) return null;

  const reads = message.reads || [];
  // Прочитано если все остальные участники прочитали
  const allRead = others.every((m) => reads.some((r) => r.userId === m.userId));

  return (
    <span className="inline-flex">
      {allRead ? (
        <CheckCheck className={cn('w-3.5 h-3.5 text-blue-400')} />
      ) : (
        <CheckCheck className={cn('w-3.5 h-3.5 opacity-60')} />
      )}
    </span>
  );
}