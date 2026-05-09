'use client';

import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/store/callStore';
import { callActions } from '@/hooks/useCall';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
} from 'lucide-react';

export function CallWindow() {
  const {
    status, type, peer, localStream, remoteStream, muted, cameraOff,
    toggleMute, toggleCamera,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (type === 'video' && remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (type === 'audio' && remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, type]);

  if (status === 'idle' || status === 'ringing' || !peer) return null;

  const statusText =
    status === 'calling' ? 'Calling...' :
    status === 'connecting' ? 'Connecting...' :
    'Connected';

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{peer.username}</h2>
          <p className="text-xs text-neutral-400">{statusText}</p>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {type === 'video' ? (
          <>
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-black"
              />
            ) : (
              <div className="flex flex-col items-center">
                <Avatar className="w-32 h-32 mb-4">
                  <AvatarImage src={peer.avatarUrl || undefined} />
                  <AvatarFallback className="text-3xl">
                    {peer.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-neutral-400">{statusText}</p>
              </div>
            )}

            {localStream && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-40 h-30 rounded-lg object-cover border-2 border-white/20 bg-black"
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Avatar className="w-40 h-40 mb-6">
              <AvatarImage src={peer.avatarUrl || undefined} />
              <AvatarFallback className="text-4xl">
                {peer.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-semibold">{peer.username}</h2>
            <p className="text-neutral-400 mt-2">{statusText}</p>
            <audio ref={remoteAudioRef} autoPlay />
          </div>
        )}
      </div>

      <div className="px-6 py-6 flex items-center justify-center gap-4 bg-black/40">
        <Button
          size="lg"
          variant="secondary"
          className="rounded-full h-14 w-14 p-0"
          onClick={toggleMute}
        >
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        {type === 'video' && (
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full h-14 w-14 p-0"
            onClick={toggleCamera}
          >
            {cameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>
        )}

        <Button
          size="lg"
          variant="destructive"
          className="rounded-full h-14 w-14 p-0"
          onClick={callActions.endCall}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}