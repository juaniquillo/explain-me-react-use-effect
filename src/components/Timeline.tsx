import { useEffect, useRef } from 'react';
import type { EventKind, LogEvent } from '../lib/events';

const STYLES: Record<EventKind, { label: string; dot: string; text: string }> = {
  setup: { label: 'setup', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  cleanup: { label: 'cleanup', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
  apply: { label: 'apply', dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400' },
  discard: { label: 'discard', dot: 'bg-zinc-400', text: 'text-zinc-500 dark:text-zinc-400' },
  warn: { label: 'stale', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
};

function stamp(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

export function Timeline({ events, empty = 'nothing yet — interact with the panel above' }: {
  events: LogEvent[];
  empty?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  // A legitimate effect: the scroll position is an external system that has to
  // follow state. No cleanup is needed, because nothing is being installed.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <div
      ref={scroller}
      className="h-44 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-[11.5px] leading-6 dark:border-zinc-800 dark:bg-zinc-950"
      aria-live="polite"
    >
      {events.length === 0 ? (
        <p className="px-3 py-2 text-zinc-400 dark:text-zinc-500">{empty}</p>
      ) : (
        events.map((event) => {
          const style = STYLES[event.kind];
          return (
            <div
              key={event.id}
              className="flex items-baseline gap-3 border-b border-zinc-100 px-3 py-0.5 last:border-0 dark:border-zinc-900"
            >
              <span className="w-12 shrink-0 text-right text-zinc-400 tabular-nums dark:text-zinc-500">
                {stamp(event.at)}
              </span>
              <span className={`flex w-[4.75rem] shrink-0 items-center gap-1.5 ${style.text}`}>
                <span className={`size-1.5 rounded-full ${style.dot}`} />
                {style.label}
              </span>
              <span className="text-zinc-600 dark:text-zinc-300">{event.detail}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
