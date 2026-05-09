'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { getSocket } from '@/lib/socket';

interface Props {
  chatId: string;
}

export function MessageInput({ chatId }: Props) {
  const [text, setText] = useState('');
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const isTyping = useRef(false);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('message:send', { chatId, content }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) console.error('send failed:', res?.error);
    });

    setText('');
    stopTyping();
  };

  const startTyping = () => {
    if (isTyping.current) return;
    isTyping.current = true;
    getSocket()?.emit('typing:start', { chatId });
  };

  const stopTyping = () => {
    if (!isTyping.current) return;
    isTyping.current = false;
    getSocket()?.emit('typing:stop', { chatId });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    startTyping();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2000);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t p-3 flex gap-2 items-end bg-card">
      <Textarea
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="resize-none min-h-[40px] max-h-32"
      />
      <Button onClick={send} size="icon" disabled={!text.trim()}>
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}