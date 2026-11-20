import { useState } from 'react';
import { useEventLog, type RecordEvent } from '../lib/events';
import { useRoomConnection } from '../snippets/useRoomConnection';
import { Timeline } from '../components/Timeline';
import { Button, FieldLabel, Meter, Panel } from '../components/ui';
import { CodeBlock } from '../components/CodeBlock';
import source from '../snippets/useRoomConnection.ts?raw';

const ROOMS = ['general', 'random', 'help'];

export function LifecyclePanel() {
  const [room, setRoom] = useState(ROOMS[0]);
  const [mounted, setMounted] = useState(true);
  const [nonce, setNonce] = useState(0);
  const { events, record, reset } = useEventLog();

  return (
    <>
      <Panel label="live · setup → cleanup → setup">
        <div className="flex flex-wrap items-center gap-2">
          <FieldLabel>roomId</FieldLabel>
          {ROOMS.map((id) => (
            <Button key={id} active={room === id} onClick={() => setRoom(id)}>
              {id}
            </Button>
          ))}
          <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
          <Button active={!mounted} onClick={() => setMounted((v) => !v)}>
            {mounted ? 'Unmount' : 'Mount'}
          </Button>
          <Button
            onClick={() => {
              reset();
              setNonce((n) => n + 1);
              setMounted(true);
            }}
            title="Remount from scratch and clear the log"
          >
            Reset
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem]">
          <div>
            <FieldLabel>component</FieldLabel>
            <div className="mt-1.5">
              {mounted ? (
                <Room key={nonce} room={room} record={record} />
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-[13px] text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                  unmounted — nothing is subscribed, nothing will log again
                </div>
              )}
            </div>
          </div>
          <div>
            <FieldLabel>dependency</FieldLabel>
            <div className="mt-1.5">
              <Meter label="roomId" value={`"${room}"`} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>effect log</FieldLabel>
          <div className="mt-1.5">
            <Timeline events={events} />
          </div>
        </div>
      </Panel>

      <CodeBlock
        path="src/snippets/useRoomConnection.ts"
        note="this file runs in the panel above"
        code={source}
      />
    </>
  );
}

function Room({ room, record }: { room: string; record: RecordEvent }) {
  const status = useRoomConnection(room, record);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] dark:border-zinc-800 dark:bg-zinc-950">
      <span
        className={`size-2 rounded-full ${
          status === 'live'
            ? 'bg-emerald-500'
            : status === 'connecting'
              ? 'bg-amber-400'
              : 'bg-zinc-300 dark:bg-zinc-600'
        }`}
      />
      <span className="font-mono text-zinc-700 dark:text-zinc-200">#{room}</span>
      <span className="ml-auto text-zinc-400 dark:text-zinc-500">{status}</span>
    </div>
  );
}
