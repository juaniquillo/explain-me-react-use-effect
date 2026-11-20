import type { ReactNode } from 'react';

export function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/70 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/70">
        <span className="size-2 rounded-full bg-indigo-500" />
        <span className="font-mono text-[10.5px] tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400">
          {label}
        </span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

type ButtonProps = {
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
  title?: string;
};

export function Button({ onClick, active = false, children, title }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200'
          : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function Meter({ label, value, tone = 'zinc' }: {
  label: string;
  value: string;
  tone?: 'zinc' | 'emerald' | 'amber';
}) {
  const tones = {
    zinc: 'text-zinc-700 dark:text-zinc-200',
    emerald: 'text-emerald-700 dark:text-emerald-400',
    amber: 'text-amber-700 dark:text-amber-400',
  };
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase dark:text-zinc-500">
        {label}
      </div>
      <div className={`mt-0.5 font-mono text-[13px] ${tones[tone]}`}>{value}</div>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.12em] text-zinc-400 uppercase dark:text-zinc-500">
      {children}
    </span>
  );
}
