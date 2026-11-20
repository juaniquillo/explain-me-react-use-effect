import { useEffect, useState } from 'react';
import type { RecordEvent } from '../lib/events';

export type ConnectionStatus = 'idle' | 'connecting' | 'live';

/**
 * The whole lesson in one hook.
 *
 * setup()   installs a connection for the *current* roomId
 * cleanup() removes exactly the connection that setup just installed
 *
 * `[roomId, record]` is the input list: as long as both stay the same, the
 * installed connection still matches the UI, so React leaves it alone.
 */
export function useRoomConnection(roomId: string, record: RecordEvent) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');

  useEffect(() => {
    record('setup', `connect("${roomId}")`);
    setStatus('connecting');

    const timer = window.setTimeout(() => {
      setStatus('live');
      record('apply', `subscribed to "${roomId}"`);
    }, 600);

    return () => {
      window.clearTimeout(timer);
      record('cleanup', `disconnect("${roomId}")`);
    };
  }, [roomId, record]);

  return status;
}
