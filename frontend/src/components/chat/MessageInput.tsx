'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { uploadFile, extractErrorMessage } from '@/lib/api';
import { AttachmentPreview, PendingAttachment } from './AttachmentPreview';
import { AudioRecorder } from './AudioRecorder';
import { toast } from 'sonner';

interface Props {
  chatId: string;
  topicId?: string | null;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ chatId, topicId = null, disabled, placeholder }: Props) {
  const [text, setText] = useState('');
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const isTyping = useRef(false);

  const detectKind = (mime: string): PendingAttachment['kind'] => {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const handleFile = (file: File) => {
    const kind = detectKind(file.type);
    const previewUrl = ['image', 'video'].includes(kind) ? URL.createObjectURL(file) : undefined;
    setPending({ file, previewUrl, kind });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = () => {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
  };

  const send = async () => {
    const content = text.trim();
    if (!content && !pending) return;
    if (uploading) return;
    const socket = getSocket();
    if (!socket) return;

    let attachment;
    if (pending) {
      setUploading(true);
      try {
        const result = await uploadFile(pending.file);
        attachment = result;
      } catch (error) {
        toast.error(extractErrorMessage(error));
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    socket.emit(
      'message:send',
      { chatId, topicId, content: content || undefined, attachment },
      (res: { ok: boolean; error?: string }) => {
        if (!res?.ok) toast.error(res?.error || 'Failed to send');
      }
    );

    setText('');
    removeAttachment();
    stopTyping();
  };

  // Запись голосового
  const sendVoice = async (blob: Blob, durationMs: number) => {
    try {
      const result = await uploadFile(blob, `voice-${Date.now()}.webm`);
      const socket = getSocket();
      socket?.emit(
        'message:send',
        {
          chatId,
          topicId,
          content: `🎤 Voice (${Math.ceil(durationMs / 1000)}s)`,
          attachment: result,
        },
        (res: { ok: boolean; error?: string }) => {
          if (!res?.ok) toast.error(res?.error || 'Failed to send');
        }
      );
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  };

  const startTyping = () => {
    if (isTyping.current) return;
    isTyping.current = true;
    getSocket()?.emit('typing:start', { chatId, topicId });
  };

  const stopTyping = () => {
    if (!isTyping.current) return;
    isTyping.current = false;
    getSocket()?.emit('typing:stop', { chatId, topicId });
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

  // Drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      {pending && <AttachmentPreview attachment={pending} onRemove={removeAttachment} />}
      <div className="border-t p-3 flex gap-2 items-end bg-card">
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.zip,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        <Textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={uploading ? 'Uploading...' : placeholder || 'Type a message...'}
          rows={1}
          disabled={disabled || uploading}
          className="resize-none min-h-[40px] max-h-32"
        />

        {/* Если есть текст или вложение — показываем Send. Иначе — рекордер */}
        {text.trim() || pending ? (
          <Button onClick={send} size="icon" disabled={disabled || uploading}>
            <Send className="w-4 h-4" />
          </Button>
        ) : (
          <AudioRecorder onSend={sendVoice} />
        )}
      </div>
    </div>
  );
}