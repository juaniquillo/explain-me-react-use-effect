import { useEffect } from 'react';
import type { RecordEvent } from '../lib/events';

/**
 * The smallest possible effect. In StrictMode, development builds mount it,
 * tear it down and mount it again — setup, cleanup, setup — before you ever
 * touch the page. The built version of this page does it once.
 */
export function StrictProbe({ record }: { record: RecordEvent }) {
  useEffect(() => {
    record('setup', 'setup() — subscribe()');
    return () => record('cleanup', 'cleanup() — unsubscribe()');
  }, [record]);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
      <span className="size-2 rounded-full bg-emerald-500" />
      one component, one effect, one line of JSX
    </div>
  );
}
