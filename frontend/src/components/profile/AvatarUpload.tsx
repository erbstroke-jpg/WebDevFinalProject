'use client';

import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { uploadFile, fileUrl, extractErrorMessage } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  currentUrl: string | null;
  fallback: string;
  size?: 'md' | 'lg';
  onUploaded: (url: string) => Promise<void> | void;
  editable?: boolean;
}

export function AvatarUpload({ currentUrl, fallback, size = 'lg', onUploaded, editable = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const sizes = size === 'lg' ? 'w-28 h-28' : 'w-16 h-16';

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile(file);
      await onUploaded(result.url);
      toast.success('Avatar updated');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className={sizes}>
        <AvatarImage src={currentUrl ? fileUrl(currentUrl) : undefined} />
        <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
      </Avatar>

      {editable && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              if (inputRef.current) inputRef.current.value = '';
            }}
          />
          <Button
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 rounded-full h-9 w-9 shadow-md"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </Button>
        </>
      )}
    </div>
  );
}