import { useState } from 'react';
import { RENDER_CAP, shouted, useShoutEffect } from '../snippets/useShout';
import { Button, FieldLabel, Meter, Panel } from '../components/ui';
import { Callout, CodeBlock } from '../components/CodeBlock';
import source from '../snippets/useShout.ts?raw';

const WORDS = ['react', 'effect', 'render'];

export function LoopPanel() {
  const [text, setText] = useState(WORDS[0]);
  const [nonce, setNonce] = useState(0);

  return (
    <>
      <Panel label="live · runaway renders, capped">
        <div className="flex flex-wrap items-center gap-2">
          <FieldLabel>text</FieldLabel>
          {WORDS.map((word) => (
            <Button key={word} active={text === word} onClick={() => setText(word)}>
              {word}
            </Button>
          ))}
          <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
          <Button onClick={() => setNonce((n) => n + 1)}>Reset counters</Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>state written from an effect</FieldLabel>
            <div className="mt-1.5">
              <EffectColumn key={`effect-${nonce}`} text={text} />
            </div>
          </div>
          <div>
            <FieldLabel>derived during render</FieldLabel>
            <div className="mt-1.5">
              <DerivedColumn key={`derived-${nonce}`} text={text} />
            </div>
          </div>
        </div>

        <Callout tone="warn">
          The left side only stops because this demo refuses to update after {RENDER_CAP}{' '}
          renders. Remove that cap and React throws{' '}
          <code className="font-mono">Maximum update depth exceeded</code> and unmounts the tree.
        </Callout>
      </Panel>

      <CodeBlock
        path="src/snippets/useShout.ts"
        note="both columns run in the panel above"
        code={source}
      />
    </>
  );
}

function EffectColumn({ text }: { text: string }) {
  const { value, renders } = useShoutEffect(text);

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/60 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/5">
      <div className="font-mono text-[13px] text-zinc-800 dark:text-zinc-100">{value.shout}</div>
      <div className="mt-2">
        <Meter
          label="renders for one keystroke"
          value={renders > RENDER_CAP ? `${RENDER_CAP}+ (capped)` : String(renders)}
          tone={renders > RENDER_CAP ? 'amber' : 'zinc'}
        />
      </div>
    </div>
  );
}

function DerivedColumn({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="font-mono text-[13px] text-zinc-800 dark:text-zinc-100">{shouted(text)}</div>
      <div className="mt-2">
        <Meter label="extra state" value="none" tone="emerald" />
      </div>
    </div>
  );
}
