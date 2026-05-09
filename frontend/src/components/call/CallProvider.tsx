'use client';

import { useCallSocketHandlers } from '@/hooks/useCall';
import { IncomingCallModal } from './IncomingCallModal';
import { CallWindow } from './CallWindow';

export function CallProvider() {
  useCallSocketHandlers(); // регистрирует socket-обработчики ОДИН РАЗ глобально

  return (
    <>
      <IncomingCallModal />
      <CallWindow />
    </>
  );
}