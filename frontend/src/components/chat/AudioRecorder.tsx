'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onSend: (blob: Blob, durationMs: number) => Promise<void>;
}

export function AudioRecorder({ onSend }: Props) {
  const [recording, setRecording] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [sending, setSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setPreviewBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startedAtRef.current);
      }, 100);
    } catch (error) {
      console.error(error);
      toast.error('Microphone access denied');
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const cancel = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewBlob(null);
    setPreviewUrl(null);
    setElapsed(0);
  };

  const send = async () => {
    if (!previewBlob) return;
    setSending(true);
    try {
      await onSend(previewBlob, elapsed);
      cancel();
    } catch {
      // toast handled by parent
    } finally {
      setSending(false);
    }
  };

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)
      .toString()
      .padStart(1, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  // 1. Idle — показываем только кнопку микрофона
  if (!recording && !previewBlob) {
    return (
      <Button variant="ghost" size="icon" onClick={start} title="Record voice">
        <Mic className="w-4 h-4" />
      </Button>
    );
  }

  // 2. Recording — пульсирующий индикатор + Stop
  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs font-mono">{fmt(elapsed)}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={stop} title="Stop">
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </div>
    );
  }

  // 3. Preview — плеер + Cancel + Send
  return (
    <div className="flex items-center gap-2">
      {previewUrl && <audio src={previewUrl} controls className="h-8 max-w-[200px]" />}
      <Button variant="ghost" size="icon" onClick={cancel} title="Cancel" disabled={sending}>
        <Trash2 className="w-4 h-4" />
      </Button>
      <Button size="icon" onClick={send} disabled={sending} title="Send">
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}