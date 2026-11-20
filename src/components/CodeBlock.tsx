import type { ReactNode } from 'react';
import { highlight } from '../lib/highlight';

type Props = {
  code: string;
  lang?: 'tsx' | 'ts' | 'bash';
  path: string;
  note?: string;
};

/**
 * The code shown is not a copy pasted into the page: `path` points at the real
 * file, the page imports it with Vite's `?raw` suffix, and the listing is
 * highlighted from that exact string. If the source changes, the listing does.
 */
export function CodeBlock({ code, lang = 'ts', path, note }: Props) {
  return (
    <figure className="mt-5 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">{path}</span>
        {note ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-emerald-700 uppercase dark:bg-emerald-500/10 dark:text-emerald-300">
            {note}
          </span>
        ) : null}
      </figcaption>
      <div
        className="shiki-wrap text-[12.5px]"
        // Shiki output is generated from local files only, never from user input.
        dangerouslySetInnerHTML={{ __html: highlight(code, lang) }}
      />
    </figure>
  );
}

export function Callout({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' }) {
  const tones = {
    neutral:
      'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300',
    warn: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  };
  return (
    <aside className={`mt-5 rounded-xl border px-4 py-3 text-[14px] leading-6 ${tones[tone]}`}>
      {children}
    </aside>
  );
}
