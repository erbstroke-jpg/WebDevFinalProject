'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api, extractErrorMessage } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { User, Chat } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  onChatCreated: (id: string) => void;
}

export function NewChatDialog({ open, setOpen, onChatCreated }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const upsertChat = useChatStore((s) => s.upsertChat);

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      const { data } = await api.get<User[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const startChat = async (userId: string) => {
    try {
      const { data } = await api.post<Chat>('/api/chats/direct', { userId });
      upsertChat(data);
      onChatCreated(data.id);
      setOpen(false);
      setQuery('');
      setResults([]);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a direct chat</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search by username or name..."
          value={query}
          onChange={(e) => search(e.target.value)}
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => startChat(user.id)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-md text-left transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{user.displayName}</div>
                <div className="text-xs text-muted-foreground">@{user.username}</div>
              </div>
            </button>
          ))}
          {query.length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}