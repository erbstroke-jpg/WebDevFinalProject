'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, UserPlus, LogOut, Users, Settings } from 'lucide-react';
import { Chat, User } from '@/types';
import { api, extractErrorMessage, fileUrl } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Props {
  chat: Chat;
}

export function ChatMenu({ chat }: Props) {
  const [membersOpen, setMembersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [name, setName] = useState(chat.name || '');
  const [description, setDescription] = useState(chat.description || '');
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const { upsertChat, setActiveChatId, setChats, chats } = useChatStore();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const onlineUsers = useChatStore((s) => s.onlineUsers);

  const isOwner = chat.ownerId === currentUserId;

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      const { data } = await api.get<User[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
      const existingIds = new Set(chat.members.map((m) => m.userId));
      setResults(data.filter((u) => !existingIds.has(u.id)));
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const addMember = async (userId: string) => {
    try {
      const { data } = await api.post<Chat>(`/api/chats/${chat.id}/members`, { userId });
      upsertChat(data);
      setAddOpen(false);
      setQuery('');
      setResults([]);
      toast.success('Member added');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const leaveChat = async () => {
    if (!confirm(`Leave "${chat.displayName}"?`)) return;
    try {
      await api.delete(`/api/chats/${chat.id}/leave`);
      setChats(chats.filter((c) => c.id !== chat.id));
      setActiveChatId(null);
      toast.success('Left the chat');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const saveChat = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch<Chat>(`/api/chats/${chat.id}`, {
        name: name.trim() || chat.name,
        description: description.trim() || null,
      });
      upsertChat(data);
      toast.success('Chat updated');
      setEditOpen(false);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const updateChatAvatar = async (url: string) => {
    const { data } = await api.patch<Chat>(`/api/chats/${chat.id}`, { avatarUrl: url });
    upsertChat(data);
  };

  const goToProfile = (userId: string) => {
    setMembersOpen(false);
    router.push(`/profile/${userId}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {chat.type !== 'DIRECT' && (
            <>
              <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
                <Users className="w-4 h-4 mr-2" /> Members ({chat.members.length})
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAddOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Add member
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" /> Edit chat
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={leaveChat} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Leave chat
              </DropdownMenuItem>
            </>
          )}
          {chat.type === 'DIRECT' && (
            <DropdownMenuItem
              onSelect={() => {
                const other = chat.members.find((m) => m.userId !== currentUserId);
                if (other) goToProfile(other.userId);
              }}
            >
              <Users className="w-4 h-4 mr-2" /> View profile
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Members dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Members ({chat.members.length})</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {chat.members.map((m) => {
              const isOnline = onlineUsers.has(m.userId);
              const isMe = m.userId === currentUserId;
              return (
                <button
                  key={m.id}
                  onClick={() => goToProfile(m.userId)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 rounded-md text-left transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={m.user.avatarUrl ? fileUrl(m.user.avatarUrl) : undefined} />
                      <AvatarFallback>
                        {m.user.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {m.user.displayName}
                      {isMe && <span className="text-muted-foreground"> (you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{m.user.username} · {m.role.toLowerCase()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => search(e.target.value)}
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => addMember(u.id)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-md text-left transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={u.avatarUrl ? fileUrl(u.avatarUrl) : undefined} />
                  <AvatarFallback className="text-xs">
                    {u.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{u.displayName}</div>
                  <div className="text-xs text-muted-foreground">@{u.username}</div>
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

      {/* Edit chat dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit chat</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-2">
            <AvatarUpload
              currentUrl={chat.avatarUrl}
              fallback={chat.displayName.slice(0, 2).toUpperCase()}
              onUploaded={updateChatAvatar}
              size="lg"
            />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this chat about?"
            />
          </div>
          <Button onClick={saveChat} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}