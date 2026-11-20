import { useCallback, useRef, useState } from 'react';

export type EventKind = 'setup' | 'cleanup' | 'apply' | 'discard' | 'warn';

export type LogEvent = {
  id: number;
  kind: EventKind;
  detail: string;
  /** Milliseconds since the first entry of this log. */
  at: number;
};

export type RecordEvent = (kind: EventKind, detail: string) => void;

/**
 * The log lives *above* the component under test, so a cleanup entry still
 * lands after that component has unmounted.
 *
 * `record` is stable on purpose: the demo effects list it in their dependency
 * array, and an unstable callback would re-run those effects on every render.
 */
export function useEventLog() {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const nextId = useRef(0);
  const startedAt = useRef<number | null>(null);

  const record = useCallback<RecordEvent>((kind, detail) => {
    if (startedAt.current === null) startedAt.current = performance.now();
    const at = Math.round(performance.now() - startedAt.current);

    setEvents((prev) => [
      ...prev.slice(-40),
      { id: nextId.current++, kind, detail, at },
    ]);
  }, []);

  const reset = useCallback(() => {
    setEvents([]);
    nextId.current = 0;
    startedAt.current = null;
  }, []);

  return { events, record, reset };
}
