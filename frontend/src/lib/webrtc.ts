'use client';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const createPeerConnection = (): RTCPeerConnection => {
  return new RTCPeerConnection({ iceServers: ICE_SERVERS });
};

export const getUserMedia = async (type: 'audio' | 'video'): Promise<MediaStream> => {
  const constraints: MediaStreamConstraints =
    type === 'video'
      ? { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true }
      : { audio: true, video: false };

  return navigator.mediaDevices.getUserMedia(constraints);
};