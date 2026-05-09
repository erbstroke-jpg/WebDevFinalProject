'use client';

import { useEffect, useState } from 'react';
import { api, extractErrorMessage } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { Topic } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  chatId: string;
}

export function TopicSidebar({ chatId }: Props) {
  const { topicsByChat, activeTopicId, setActiveTopicId, setTopics, addTopic } = useChatStore();
  const topics = topicsByChat[chatId] || [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    api.get<Topic[]>(`/api/chats/${chatId}/topics`).then(({ data }) => {
      setTopics(chatId, data);
      // Авто-выбор General
      if (data.length > 0 && !activeTopicId) {
        const general = data.find((t) => t.name === 'General') || data[0];
        setActiveTopicId(general.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const createTopic = async () => {
    if (!name.trim()) return;
    try {
      const { data } = await api.post<Topic>(`/api/chats/${chatId}/topics`, {
        name: name.trim(),
        iconEmoji: emoji.trim() || undefined,
      });
      addTopic(chatId, data);
      setActiveTopicId(data.id);
      setDialogOpen(false);
      setName('');
      setEmoji('');
      toast.success('Topic created');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  return (
    <aside className="w-56 border-r bg-card/50 flex flex-col">
      <div className="border-b px-3 py-2 flex items-center justify-between">
        <span className="text-xs uppercase font-semibold text-muted-foreground">Topics</span>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>New topic</DialogTitle>
            </DialogHeader>
            <Input placeholder="Emoji (optional)" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
            <Input
              placeholder="Topic name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Button onClick={createTopic} disabled={!name.trim()}>
              Create
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTopicId(t.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-muted/70 transition-colors',
              activeTopicId === t.id && 'bg-muted font-medium'
            )}
          >
            {t.iconEmoji ? (
              <span className="text-base">{t.iconEmoji}</span>
            ) : (
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="truncate">{t.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}