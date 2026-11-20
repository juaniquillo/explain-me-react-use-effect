import { useEffect, useRef, useState } from 'react';

/** Without a cap this loop runs until React throws "Maximum update depth exceeded". */
export const RENDER_CAP = 25;

/**
 * The infinite-loop shape, on purpose:
 *
 *  - the effect writes state on every render (no dependency array), and
 *  - the state it writes is a brand-new object, so React can never bail out
 *    ("same state, skip the render") — `{ shout } !== { shout }`.
 *
 * Capping at RENDER_CAP keeps the demo page alive; the comment above is what
 * really happens in an uncapped app.
 */
export function useShoutEffect(text: string) {
  const [value, setValue] = useState({ shout: text.toUpperCase() });
  const renders = useRef(0);
  renders.current += 1;

  useEffect(() => {
    if (renders.current > RENDER_CAP) return;
    setValue({ shout: text.toUpperCase() });
  });

  return { value, renders: renders.current };
}

/**
 * The same result with no effect and no extra state: derived during render.
 * Pure computation from props is not a side effect, so it needs no escape hatch.
 */
export function shouted(text: string) {
  return text.toUpperCase();
}
