import { useEffect, useRef, useState } from 'react';
import type { RecordEvent } from '../lib/events';

export type Quote = { room: string; line: string };

/**
 * Deliberately uneven latencies. Switching rooms quickly guarantees that the
 * responses arrive out of order — exactly what a slow network does in real life.
 */
export const NETWORK_MS: Record<string, number> = { general: 2400, random: 350, help: 1200 };

const LINES = [
  'deploy on friday, it will be fine',
  'it works on my machine',
  'we can refactor it later',
  'this is a temporary workaround',
];

export function delayFor(room: string) {
  return NETWORK_MS[room] ?? 900;
}

function fetchQuote(room: string): Promise<Quote> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve({ room, line: LINES[room.length % LINES.length] });
    }, delayFor(room));
  });
}

/**
 * Naive version: the response is applied whenever it lands. A request that
 * started earlier can finish later and overwrite fresher data.
 *
 * The ref below is not a fix — it only lets the log *name* a late response.
 * It reads the latest room without re-running the effect, because a ref is not
 * a dependency.
 */
export function useQuoteNoCleanup(room: string, record: RecordEvent) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const latestRoom = useRef(room);
  latestRoom.current = room;

  useEffect(() => {
    fetchQuote(room).then((next) => {
      setQuote(next);
      const late = next.room !== latestRoom.current;
      record(late ? 'warn' : 'apply', `applied response from "${next.room}"`);
    });
  }, [room, record]);

  return quote;
}

/**
 * Fixed version: cleanup marks the previous request as irrelevant. The promise
 * still resolves, but its result is discarded instead of written to state.
 */
export function useQuoteWithCleanup(room: string, record: RecordEvent) {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchQuote(room).then((next) => {
      if (ignore) {
        record('discard', `dropped late response from "${next.room}"`);
        return;
      }
      setQuote(next);
      record('apply', `applied response from "${next.room}"`);
    });

    return () => {
      ignore = true;
      record('cleanup', `cancelled the request for "${room}"`);
    };
  }, [room, record]);

  return quote;
}
