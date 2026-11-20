import { useState } from 'react';
import { useEventLog, type RecordEvent } from '../lib/events';
import {
  NETWORK_MS,
  delayFor,
  useQuoteNoCleanup,
  useQuoteWithCleanup,
  type Quote,
} from '../snippets/useSlowQuote';
import { Timeline } from '../components/Timeline';
import { Button, FieldLabel, Panel } from '../components/ui';
import { Callout, CodeBlock } from '../components/CodeBlock';
import source from '../snippets/useSlowQuote.ts?raw';

const ROOMS = Object.keys(NETWORK_MS);

export function RacePanel() {
  const [mode, setMode] = useState<'naive' | 'cleanup'>('naive');
  const [room, setRoom] = useState(ROOMS[0]);
  const { events, record, reset } = useEventLog();

  return (
    <>
      <Panel label="live · out-of-order responses">
        <div className="flex flex-wrap items-center gap-2">
          <FieldLabel>cleanup</FieldLabel>
          <Button active={mode === 'naive'} onClick={() => { reset(); setMode('naive'); }}>
            missing
          </Button>
          <Button active={mode === 'cleanup'} onClick={() => { reset(); setMode('cleanup'); }}>
            ignore flag
          </Button>
          <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
          <Button onClick={reset}>Clear log</Button>
        </div>

        <p className="mt-3 text-[13px] text-zinc-500 dark:text-zinc-400">
          Click <span className="font-mono text-zinc-700 dark:text-zinc-200">general</span> (2.4s),
          then immediately <span className="font-mono text-zinc-700 dark:text-zinc-200">random</span>{' '}
          (0.35s).
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FieldLabel>roomId</FieldLabel>
          {ROOMS.map((id) => (
            <Button key={id} active={room === id} onClick={() => setRoom(id)}>
              {id}
              <span className="ml-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                {(delayFor(id) / 1000).toFixed(2)}s
              </span>
            </Button>
          ))}
        </div>

        <div className="mt-4">
          <FieldLabel>component</FieldLabel>
          <div className="mt-1.5">
            {mode === 'naive' ? (
              <NaiveProbe key="naive" room={room} record={record} />
            ) : (
              <SafeProbe key="cleanup" room={room} record={record} />
            )}
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>effect log</FieldLabel>
          <div className="mt-1.5">
            <Timeline events={events} />
          </div>
        </div>

        {mode === 'naive' ? (
          <Callout tone="warn">
            The card can end up showing <code className="font-mono">general</code> while the
            selected room is <code className="font-mono">random</code>. Nothing in this version
            can tell the difference between a fresh response and a late one.
          </Callout>
        ) : null}
      </Panel>

      <CodeBlock
        path="src/snippets/useSlowQuote.ts"
        note="both versions run in the panel above"
        code={source}
      />
    </>
  );
}

function QuoteCard({ quote, room }: { quote: Quote | null; room: string }) {
  const stale = quote !== null && quote.room !== room;

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-[13px] ${
        stale
          ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'
      }`}
    >
      {quote === null ? (
        <span className="text-zinc-400 dark:text-zinc-500">loading…</span>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
            quote({quote.room})
          </span>
          <span className="text-zinc-700 dark:text-zinc-200">“{quote.line}”</span>
          {stale ? (
            <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
              stale
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function NaiveProbe({ room, record }: { room: string; record: RecordEvent }) {
  const quote = useQuoteNoCleanup(room, record);
  return <QuoteCard quote={quote} room={room} />;
}

function SafeProbe({ room, record }: { room: string; record: RecordEvent }) {
  const quote = useQuoteWithCleanup(room, record);
  return <QuoteCard quote={quote} room={room} />;
}
