'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/store/callStore';
import { callActions } from '@/hooks/useCall';
import { Phone, PhoneOff, Video } from 'lucide-react';

export function IncomingCallModal() {
  const { status, type, peer } = useCallStore();

  if (status !== 'ringing' || !peer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4">
          <AvatarImage src={peer.avatarUrl || undefined} />
          <AvatarFallback className="text-2xl">
            {peer.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold">{peer.username}</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6 flex items-center justify-center gap-1">
          {type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          incoming {type} call...
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            variant="destructive"
            className="rounded-full h-14 w-14 p-0"
            onClick={callActions.declineCall}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 p-0 bg-green-600 hover:bg-green-700"
            onClick={callActions.acceptCall}
          >
            <Phone className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}