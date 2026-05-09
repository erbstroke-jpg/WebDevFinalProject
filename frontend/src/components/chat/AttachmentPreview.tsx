'use client';

import { Button } from '@/components/ui/button';
import { X, FileText, Music } from 'lucide-react';

interface PendingAttachment {
  file: File;
  previewUrl?: string; // для image/video — object URL
  kind: 'image' | 'video' | 'audio' | 'file';
}

interface Props {
  attachment: PendingAttachment;
  onRemove: () => void;
}

export function AttachmentPreview({ attachment, onRemove }: Props) {
  const { file, previewUrl, kind } = attachment;

  return (
    <div className="border-t bg-muted/30 px-3 py-2 flex items-center gap-3">
      <div className="shrink-0">
        {kind === 'image' && previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="w-14 h-14 object-cover rounded" />
        )}
        {kind === 'video' && previewUrl && (
          <video src={previewUrl} className="w-14 h-14 object-cover rounded" />
        )}
        {kind === 'audio' && (
          <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center">
            <Music className="w-6 h-6 text-primary" />
          </div>
        )}
        {kind === 'file' && (
          <div className="w-14 h-14 rounded bg-muted flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{file.name}</div>
        <div className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(1)} KB
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export type { PendingAttachment };