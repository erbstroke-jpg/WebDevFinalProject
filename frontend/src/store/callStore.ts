'use client';

import { create } from 'zustand';

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected';

interface PeerInfo {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

interface CallState {
  status: CallStatus;
  type: CallType;
  callId: string | null;
  peer: PeerInfo | null;
  isInitiator: boolean; // мы ли позвонили (true) или нам (false)
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;

  startOutgoing: (peer: PeerInfo, type: CallType, callId: string) => void;
  startIncoming: (peer: PeerInfo, type: CallType, callId: string) => void;
  setStatus: (s: CallStatus) => void;
  setLocalStream: (s: MediaStream | null) => void;
  setRemoteStream: (s: MediaStream | null) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  status: 'idle',
  type: 'audio',
  callId: null,
  peer: null,
  isInitiator: false,
  localStream: null,
  remoteStream: null,
  muted: false,
  cameraOff: false,

  startOutgoing: (peer, type, callId) =>
    set({
      status: 'calling',
      type,
      callId,
      peer,
      isInitiator: true,
      muted: false,
      cameraOff: false,
    }),

  startIncoming: (peer, type, callId) =>
    set({
      status: 'ringing',
      type,
      callId,
      peer,
      isInitiator: false,
      muted: false,
      cameraOff: false,
    }),

  setStatus: (s) => set({ status: s }),
  setLocalStream: (s) => set({ localStream: s }),
  setRemoteStream: (s) => set({ remoteStream: s }),

  toggleMute: () =>
    set((state) => {
      if (state.localStream) {
        state.localStream.getAudioTracks().forEach((t) => (t.enabled = state.muted));
      }
      return { muted: !state.muted };
    }),

  toggleCamera: () =>
    set((state) => {
      if (state.localStream) {
        state.localStream.getVideoTracks().forEach((t) => (t.enabled = state.cameraOff));
      }
      return { cameraOff: !state.cameraOff };
    }),

  reset: () =>
    set((state) => {
      state.localStream?.getTracks().forEach((t) => t.stop());
      return {
        status: 'idle',
        type: 'audio',
        callId: null,
        peer: null,
        isInitiator: false,
        localStream: null,
        remoteStream: null,
        muted: false,
        cameraOff: false,
      };
    }),
}));