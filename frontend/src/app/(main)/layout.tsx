'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, MessageSquare } from 'lucide-react';
import { fileUrl } from '@/lib/api';
import { CallProvider } from '@/components/call/CallProvider';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, isHydrated } = useAuthStore();
  const { logout, refreshMe } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, token]);

  if (!isHydrated || !token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-2 flex items-center justify-between bg-card">
        <Link href="/chats" className="font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Messenger
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-muted rounded-full pl-2 pr-1 py-1 transition-colors">
              <span className="text-sm hidden sm:inline">{user.displayName}</span>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl ? fileUrl(user.avatarUrl) : undefined} />
                <AvatarFallback className="text-xs">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => router.push('/profile')}>
              <UserIcon className="w-4 h-4 mr-2" /> My profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/chats')}>
              <MessageSquare className="w-4 h-4 mr-2" /> Chats
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1">{children}</main>

      {/* Глобальные модалки звонка */}
      <CallProvider />
    </div>
  );
}