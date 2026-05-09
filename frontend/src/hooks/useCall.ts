'use client';

import { useEffect, useRef } from 'react';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { createPeerConnection, getUserMedia } from '@/lib/webrtc';
import { toast } from 'sonner';

// Глобальные ссылки на текущий peer connection и pending ICE — один на всё приложение
const callRefs = {
  pc: null as RTCPeerConnection | null,
  pendingIce: [] as RTCIceCandidateInit[],
};

const setupPeerConnection = async (): Promise<RTCPeerConnection> => {
  const current = useCallStore.getState();
  const pc = createPeerConnection();
  callRefs.pc = pc;

  const stream = await getUserMedia(current.type);
  useCallStore.getState().setLocalStream(stream);
  stream.getTracks().forEach((t) => pc.addTrack(t, stream));

  pc.ontrack = (e) => {
    const [remote] = e.streams;
    useCallStore.getState().setRemoteStream(remote);
    useCallStore.getState().setStatus('connected');
  };

  pc.onicecandidate = (e) => {
    const st = useCallStore.getState();
    if (e.candidate && st.peer && st.callId) {
      getSocket()?.emit('call:ice', {
        toUserId: st.peer.id,
        callId: st.callId,
        signal: e.candidate.toJSON(),
      });
    }
  };

  return pc;
};

const cleanupCall = () => {
  if (callRefs.pc) {
    callRefs.pc.close();
    callRefs.pc = null;
  }
  callRefs.pendingIce = [];
  useCallStore.getState().reset();
};

const startPeerAsInitiator = async () => {
  const pc = await setupPeerConnection();
  const current = useCallStore.getState();
  if (!current.peer || !current.callId) return;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  getSocket()?.emit('call:offer', {
    toUserId: current.peer.id,
    callId: current.callId,
    signal: offer,
  });
};

// ============= Public actions (без хука, можно дёргать откуда угодно) =============

export const callActions = {
  callUser(peerId: string, peerUsername: string, type: 'audio' | 'video') {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    const callId = `${currentUser.id}-${peerId}-${Date.now()}`;
    useCallStore.getState().startOutgoing({ id: peerId, username: peerUsername }, type, callId);
    getSocket()?.emit('call:invite', { toUserId: peerId, callId, type });
  },

  async acceptCall() {
    const current = useCallStore.getState();
    if (!current.peer || !current.callId) return;
    useCallStore.getState().setStatus('connecting');
    await setupPeerConnection();
    getSocket()?.emit('call:accept', {
      toUserId: current.peer.id,
      callId: current.callId,
    });
  },

  declineCall() {
    const current = useCallStore.getState();
    if (!current.peer || !current.callId) return;
    getSocket()?.emit('call:decline', {
      toUserId: current.peer.id,
      callId: current.callId,
    });
    cleanupCall();
  },

  endCall() {
    const current = useCallStore.getState();
    if (current.peer && current.callId) {
      getSocket()?.emit('call:end', {
        toUserId: current.peer.id,
        callId: current.callId,
      });
    }
    cleanupCall();
  },
};

// ============= Хук, регистрирующий слушатели — ВЫЗЫВАТЬ ТОЛЬКО ОДИН РАЗ =============

export const useCallSocketHandlers = () => {
  const currentUser = useAuthStore((s) => s.user);
  const registered = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !currentUser) return;
    if (registered.current) return;
    registered.current = true;

    const onIncoming = ({
      callId,
      type,
      from,
    }: {
      callId: string;
      type: 'audio' | 'video';
      from: { id: string; username: string };
    }) => {
      const current = useCallStore.getState();
      if (current.status !== 'idle') {
        getSocket()?.emit('call:decline', { toUserId: from.id, callId });
        return;
      }
      useCallStore.getState().startIncoming(from, type, callId);
    };

    const onAccepted = async ({ callId: cid }: { callId: string }) => {
      const current = useCallStore.getState();
      if (current.callId !== cid || !current.isInitiator) return;
      useCallStore.getState().setStatus('connecting');
      await startPeerAsInitiator();
    };

    const onDeclined = ({ callId: cid }: { callId: string }) => {
      const current = useCallStore.getState();
      if (current.callId !== cid) return;
      toast.info('Call declined');
      cleanupCall();
    };

    const onEnded = ({ callId: cid }: { callId: string }) => {
      const current = useCallStore.getState();
      if (current.callId !== cid) return;
      toast.info('Call ended');
      cleanupCall();
    };

    const onOffer = async ({
      callId: cid,
      signal,
    }: {
      callId: string;
      signal: RTCSessionDescriptionInit;
    }) => {
      const current = useCallStore.getState();
      if (current.callId !== cid || current.isInitiator) return;
      const pc = callRefs.pc;
      if (!pc) {
        console.error('[call] onOffer but no pc');
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      for (const ice of callRefs.pendingIce) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(ice));
        } catch (e) {
          console.error('addIceCandidate failed', e);
        }
      }
      callRefs.pendingIce = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const peerId = current.peer?.id;
      if (peerId) {
        getSocket()?.emit('call:answer', {
          toUserId: peerId,
          callId: cid,
          signal: answer,
        });
      }
    };

    const onAnswer = async ({
      callId: cid,
      signal,
    }: {
      callId: string;
      signal: RTCSessionDescriptionInit;
    }) => {
      const current = useCallStore.getState();
      if (current.callId !== cid || !current.isInitiator) return;
      const pc = callRefs.pc;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      for (const ice of callRefs.pendingIce) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(ice));
        } catch (e) {
          console.error('addIceCandidate failed', e);
        }
      }
      callRefs.pendingIce = [];
    };

    const onIce = async ({
      callId: cid,
      signal,
    }: {
      callId: string;
      signal: RTCIceCandidateInit;
    }) => {
      const current = useCallStore.getState();
      if (current.callId !== cid) return;
      const pc = callRefs.pc;
      if (!pc || !pc.remoteDescription) {
        callRefs.pendingIce.push(signal);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal));
      } catch (e) {
        console.error('addIceCandidate failed', e);
      }
    };

    socket.on('call:incoming', onIncoming);
    socket.on('call:accepted', onAccepted);
    socket.on('call:declined', onDeclined);
    socket.on('call:ended', onEnded);
    socket.on('call:offer', onOffer);
    socket.on('call:answer', onAnswer);
    socket.on('call:ice', onIce);

    return () => {
      registered.current = false;
      socket.off('call:incoming', onIncoming);
      socket.off('call:accepted', onAccepted);
      socket.off('call:declined', onDeclined);
      socket.off('call:ended', onEnded);
      socket.off('call:offer', onOffer);
      socket.off('call:answer', onAnswer);
      socket.off('call:ice', onIce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);
};