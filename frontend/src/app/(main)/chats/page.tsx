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
import { Plus, MessageSquare, Users, Hash, MessagesSquare } from 'lucide-react';

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
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MessagesSquare className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to Messenger</h2>
            <p className="text-sm text-muted-foreground">
              Select a chat from the sidebar or start a new conversation. You can create direct chats, groups, or supergroups with topics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}