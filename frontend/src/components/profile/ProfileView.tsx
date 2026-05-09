'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, extractErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { AvatarUpload } from './AvatarUpload';
import { User, Chat } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MessageSquare, ArrowLeft } from 'lucide-react';

interface Props {
  userId: string;
}

export function ProfileView({ userId }: Props) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const upsertChat = useChatStore((s) => s.upsertChat);
  const setActiveChatId = useChatStore((s) => s.setActiveChatId);

  const [user, setLocalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Поля редактирования
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [statusText, setStatusText] = useState('');

  const isMe = currentUser?.id === userId;

  useEffect(() => {
    setLoading(true);
    api
      .get<User>(`/api/users/${userId}`)
      .then(({ data }) => {
        setLocalUser(data);
        setDisplayName(data.displayName);
        setBio(data.bio || '');
        setStatusText(data.status || '');
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [userId]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch<User>('/api/users/me', {
        displayName,
        bio: bio || null,
        status: statusText || null,
      });
      setLocalUser(data);
      setUser(data);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const updateAvatar = async (url: string) => {
    const { data } = await api.patch<User>('/api/users/me', { avatarUrl: url });
    setLocalUser(data);
    setUser(data);
  };

  const startDirectChat = async () => {
    try {
      const { data } = await api.post<Chat>('/api/chats/direct', { userId });
      upsertChat(data);
      setActiveChatId(data.id);
      router.push('/chats');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-start gap-6">
            <div className="w-28 h-28 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 pt-2 space-y-3">
              <div className="h-7 bg-muted animate-pulse rounded w-2/3" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-9 bg-muted animate-pulse rounded w-32 mt-3" />
            </div>
          </div>
          <hr className="my-6" />
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
            <div className="h-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-6 text-muted-foreground">User not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-start gap-6">
          <AvatarUpload
            currentUrl={user.avatarUrl}
            fallback={user.displayName.slice(0, 2).toUpperCase()}
            onUploaded={updateAvatar}
            editable={isMe}
          />
          <div className="flex-1 pt-2">
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
            {!isMe && (
              <p className="text-xs text-muted-foreground mt-1">
                {user.lastSeenAt
                  ? `Last seen ${format(new Date(user.lastSeenAt), 'PPp')}`
                  : ''}
              </p>
            )}
            {!isMe && (
              <Button size="sm" onClick={startDirectChat} className="mt-3">
                <MessageSquare className="w-4 h-4 mr-2" /> Send message
              </Button>
            )}
          </div>
        </div>

        <hr className="my-6" />

        {isMe ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell something about yourself"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Custom status</Label>
              <Input
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="🚀 Working on the messenger"
                maxLength={50}
              />
            </div>

            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {user.bio && (
              <div>
                <Label className="text-muted-foreground">About</Label>
                <p className="whitespace-pre-wrap">{user.bio}</p>
              </div>
            )}
            {user.status && (
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p>{user.status}</p>
              </div>
            )}
            {!user.bio && !user.status && (
              <p className="text-sm text-muted-foreground italic">
                No bio or status yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}