'use client';

import { useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useChatStore } from '@/store/chatStore';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { NewChatDialog } from '@/components/chat/NewChatDialog';

export default function ChatsPage() {
  useSocket(); // подключаем сокет один раз
  const { activeChatId, setActiveChatId } = useChatStore();
  const [, setTick] = useState(0);

  const handleSelect = (chatId: string) => {
    setActiveChatId(chatId);
    setTick((t) => t + 1); // форс-ререндер
  };

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <aside className="w-80 border-r flex flex-col bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold">Chats</h2>
          <NewChatDialog onChatCreated={handleSelect} />
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatList onSelectChat={handleSelect} />
        </div>
      </aside>

      {/* Chat window */}
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