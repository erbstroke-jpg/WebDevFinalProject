'use client';

import { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useChatStore } from '@/store/chatStore';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { NewGroupDialog } from '@/components/chat/NewGroupDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MessageSquare, Users, Hash } from 'lucide-react';

export default function ChatsPage() {
  useSocket();
  const { activeChatId, setActiveChatId } = useChatStore();
  const [, setTick] = useState(0);

  const handleSelect = (chatId: string) => {
    setActiveChatId(chatId);
    setTick((t) => t + 1);
  };

  // Triggers для двух диалогов через DropdownMenu
  const [newChatOpen, setNewChatOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <aside className="w-80 border-r flex flex-col bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold">Chats</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setNewChatOpen(true)}>
                <MessageSquare className="w-4 h-4 mr-2" /> Direct chat
              </DropdownMenuItem>
              <NewGroupDialog
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Users className="w-4 h-4 mr-2" /> New group / supergroup
                  </DropdownMenuItem>
                }
                onChatCreated={handleSelect}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          <NewChatDialog
            open={newChatOpen}
            setOpen={setNewChatOpen}
            onChatCreated={handleSelect}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatList onSelectChat={handleSelect} />
        </div>
      </aside>

      {activeChatId ? (
        <ChatWindow chatId={activeChatId} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a chat or start a new one
        </div>
      )}
    </div>
  );
}