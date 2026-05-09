'use client';

import { Button } from '@/components/ui/button';
import { Phone, Video } from 'lucide-react';
import { callActions } from '@/hooks/useCall';
import { useCallStore } from '@/store/callStore';
import { toast } from 'sonner';

interface Props {
  peerId: string;
  peerUsername: string;
}

export function CallButtons({ peerId, peerUsername }: Props) {
  const status = useCallStore((s) => s.status);

  const start = (type: 'audio' | 'video') => {
    if (status !== 'idle') {
      toast.error('You are already in a call');
      return;
    }
    callActions.callUser(peerId, peerUsername, type);
  };

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={() => start('audio')} title="Voice call">
        <Phone className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => start('video')} title="Video call">
        <Video className="w-4 h-4" />
      </Button>
    </div>
  );
}