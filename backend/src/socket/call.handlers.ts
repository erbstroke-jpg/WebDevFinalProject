import { Server } from 'socket.io';
import { AuthedSocket } from './auth.socket';
import { logger } from '../utils/logger';

interface CallInvitePayload {
  toUserId: string;
  callId: string;
  type: 'audio' | 'video';
}

interface CallSignalPayload {
  toUserId: string;
  callId: string;
  signal: unknown; // SDP offer/answer or ICE candidate
}

export const registerCallHandlers = (io: Server, socket: AuthedSocket) => {
  const { userId, username } = socket.data;

  // Звонящий приглашает
  socket.on('call:invite', ({ toUserId, callId, type }: CallInvitePayload) => {
    logger.info(`call:invite ${username} -> ${toUserId} (${type})`);
    io.to(`user:${toUserId}`).emit('call:incoming', {
      callId,
      type,
      from: { id: userId, username },
    });
  });

  // Получатель принял
  socket.on('call:accept', ({ toUserId, callId }: { toUserId: string; callId: string }) => {
    logger.info(`call:accept ${username} -> ${toUserId}`);
    io.to(`user:${toUserId}`).emit('call:accepted', { callId, from: userId });
  });

  // Получатель отклонил
  socket.on('call:decline', ({ toUserId, callId }: { toUserId: string; callId: string }) => {
    logger.info(`call:decline ${username} -> ${toUserId}`);
    io.to(`user:${toUserId}`).emit('call:declined', { callId, from: userId });
  });

  // Любая сторона завершила
  socket.on('call:end', ({ toUserId, callId }: { toUserId: string; callId: string }) => {
    logger.info(`call:end ${username} -> ${toUserId}`);
    io.to(`user:${toUserId}`).emit('call:ended', { callId, from: userId });
  });

  // SDP offer от инициатора
  socket.on('call:offer', ({ toUserId, callId, signal }: CallSignalPayload) => {
    io.to(`user:${toUserId}`).emit('call:offer', { callId, from: userId, signal });
  });

  // SDP answer от получателя
  socket.on('call:answer', ({ toUserId, callId, signal }: CallSignalPayload) => {
    io.to(`user:${toUserId}`).emit('call:answer', { callId, from: userId, signal });
  });

  // ICE candidate (обе стороны шлют друг другу)
  socket.on('call:ice', ({ toUserId, callId, signal }: CallSignalPayload) => {
    io.to(`user:${toUserId}`).emit('call:ice', { callId, from: userId, signal });
  });
};