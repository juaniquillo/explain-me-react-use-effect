import { useState } from 'react';
import { useEventLog } from '../lib/events';
import { StrictProbe } from '../snippets/StrictProbe';
import { Timeline } from '../components/Timeline';
import { Button, FieldLabel, Panel } from '../components/ui';
import { Callout, CodeBlock } from '../components/CodeBlock';
import source from '../snippets/StrictProbe.tsx?raw';

const isDev = import.meta.env.DEV;

export function StrictModePanel() {
  const [nonce, setNonce] = useState(0);
  const { events, record, reset } = useEventLog();

  return (
    <>
      <Panel label="live · development-only double invoke">
        <div className="flex flex-wrap items-center gap-2">
          <FieldLabel>probe</FieldLabel>
          <Button
            active
            onClick={() => {
              reset();
              setNonce((n) => n + 1);
            }}
          >
            Remount
          </Button>
          <span className="ml-auto font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase dark:text-zinc-500">
            {isDev ? 'dev server' : 'production build'}
          </span>
        </div>

        <div className="mt-4">
          <FieldLabel>mount point</FieldLabel>
          <div className="mt-1.5">
            <StrictProbe key={nonce} record={record} />
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>effect log</FieldLabel>
          <div className="mt-1.5">
            <Timeline
              events={events}
              empty="press Remount — one setup, or setup/cleanup/setup"
            />
          </div>
        </div>

        {isDev ? (
          <Callout>
            One mount, three rows. The middle cleanup and the second setup are the rehearsal;
            the last setup is the one that stays installed. Build the page and the same button
            logs a single setup.
          </Callout>
        ) : (
          <Callout tone="warn">
            This is a production build, so there is no rehearsal: one mount, one setup. Run{' '}
            <code className="font-mono">npm run dev</code> to watch the double invoke.
          </Callout>
        )}
      </Panel>

      <CodeBlock
        path="src/snippets/StrictProbe.tsx"
        note="this file runs in the panel above"
        code={source}
      />
    </>
  );
}
