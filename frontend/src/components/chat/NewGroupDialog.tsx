'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Hash, X } from 'lucide-react';
import { api, extractErrorMessage } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { User, Chat } from '@/types';
import { toast } from 'sonner';

interface Props {
  trigger: React.ReactNode;
  onChatCreated: (id: string) => void;
}

export function NewGroupDialog({ trigger, onChatCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'GROUP' | 'SUPERGROUP'>('GROUP');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const upsertChat = useChatStore((s) => s.upsertChat);

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      const { data } = await api.get<User[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
      setResults(data.filter((u) => !selected.some((s) => s.id === u.id)));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const addUser = (u: User) => {
    setSelected((prev) => [...prev, u]);
    setResults((prev) => prev.filter((r) => r.id !== u.id));
    setQuery('');
  };

  const removeUser = (id: string) => {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  };

  const submit = async () => {
    if (!name.trim() || selected.length === 0) {
      toast.error('Provide a name and at least one member');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post<Chat>('/api/chats/group', {
        name: name.trim(),
        description: description.trim() || undefined,
        isSupergroup: tab === 'SUPERGROUP',
        memberIds: selected.map((u) => u.id),
      });
      upsertChat(data);
      onChatCreated(data.id);
      setOpen(false);
      // reset
      setName('');
      setDescription('');
      setSelected([]);
      setResults([]);
      setQuery('');
      toast.success(`${tab === 'SUPERGROUP' ? 'Supergroup' : 'Group'} created`);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create new chat</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'GROUP' | 'SUPERGROUP')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="GROUP">
              <Users className="w-4 h-4 mr-1" /> Group
            </TabsTrigger>
            <TabsTrigger value="SUPERGROUP">
              <Hash className="w-4 h-4 mr-1" /> Supergroup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="GROUP" className="text-xs text-muted-foreground pt-2">
            Simple group chat for a few people.
          </TabsContent>
          <TabsContent value="SUPERGROUP" className="text-xs text-muted-foreground pt-2">
            Group with topics, like a Slack channel.
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project Alpha" />
        </div>
        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Members</Label>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 bg-muted text-sm rounded-full px-2 py-1"
                >
                  {u.displayName}
                  <button onClick={() => removeUser(u.id)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => search(e.target.value)}
          />
          {results.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => addUser(u)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={u.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {u.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{u.displayName}</span>
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button onClick={submit} disabled={submitting} className="w-full">
          {submitting ? 'Creating...' : 'Create chat'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}