import { useEffect, useMemo } from 'react';
import type { RecordEvent } from '../lib/events';

/**
 * ⚠️ The classic trap: `options` is a brand-new object on every render, so
 * Object.is(previousOptions, options) is false every time, so the effect tears
 * the connection down and installs it again on every render.
 */
export function useConnectionTrap(roomId: string, record: RecordEvent) {
  const options = { room: roomId, protocol: 'wss' };

  useEffect(() => {
    record('setup', `connect(${options.room}, ${options.protocol})`);
    return () => record('cleanup', `disconnect(${options.room})`);
  }, [options, record]);
}

/**
 * Fix 1 — list the primitives the effect actually needs. `roomId` is a string,
 * so it only changes when the room really changes.
 */
export function useConnectionPrimitive(roomId: string, record: RecordEvent) {
  useEffect(() => {
    record('setup', `connect(${roomId}, wss)`);
    return () => record('cleanup', `disconnect(${roomId})`);
  }, [roomId, record]);
}

/**
 * Fix 2 — keep the object, but give it a stable identity while its inputs hold.
 */
export function useConnectionOptions(roomId: string) {
  return useMemo(() => ({ room: roomId, protocol: 'wss' }), [roomId]);
}

/**
 * Fix 3 — if the value is only needed *inside* the effect, build it there and
 * it never has to be a dependency at all.
 */
export function useConnectionInline(roomId: string, record: RecordEvent) {
  useEffect(() => {
    const options = { room: roomId, protocol: 'wss' };
    record('setup', `connect(${options.room}, ${options.protocol})`);
    return () => record('cleanup', `disconnect(${options.room})`);
  }, [roomId, record]);
}
