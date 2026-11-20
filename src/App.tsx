import { useState, type ReactNode } from 'react';
import { LifecyclePanel } from './panels/LifecyclePanel';
import { StrictModePanel } from './panels/StrictModePanel';
import { RacePanel } from './panels/RacePanel';
import { LoopPanel } from './panels/LoopPanel';
import { CodeBlock } from './components/CodeBlock';
import depsSource from './snippets/deps.ts?raw';

const NAV = [
  { id: 'mechanics', label: 'mechanics' },
  { id: 'deps', label: 'deps array' },
  { id: 'strict', label: 'StrictMode' },
  { id: 'cleanup', label: 'cleanup' },
  { id: 'wrong-tool', label: 'wrong tool' },
  { id: 'gotchas', label: 'gotchas' },
];

export function App() {
  return (
    <div className="min-h-dvh bg-white font-sans text-zinc-800 antialiased dark:bg-zinc-950 dark:text-zinc-200">
      <TopBar />
      <main className="mx-auto max-w-3xl px-5 pb-28">
        <Hero />

        <Section id="mechanics" n="01" title="Setup runs after the paint">
          <P>
            A function component is called to <em>render</em>: props plus state go in, JSX comes
            out. That phase must be pure — no sockets, no timers, no DOM writes. React then{' '}
            <em>commits</em> the result to the DOM and the browser paints it.
          </P>
          <P>
            An effect is the third phase. React calls your setup function <em>after</em> the paint,
            keeps whatever cleanup function it returned, and calls that cleanup when the effect is
            about to run again or when the component leaves the tree. So a slow effect never
            delays the first pixel; the user sees the UI, then the effect catches up.
          </P>
          <P>
            That ordering is why the API is called an escape hatch: it is the sanctioned way to
            leave React's pure world and touch something that lives outside it — a websocket, an
            interval, a browser API, an analytics call. <C>useLayoutEffect</C> is the same hook one
            step earlier, between the DOM write and the paint; you need it only when the user must
            not see the intermediate layout (measuring a tooltip, restoring scroll position).
          </P>

          <LifecyclePanel />

          <P>What to look for in that log:</P>
          <Bullets>
            <li>
              The first three rows are StrictMode's mount rehearsal — setup, cleanup, setup — §03
              takes them apart. After that, every change is a single pair.
            </li>
            <li>
              Change the room and you get <C>cleanup(old)</C> then <C>setup(new)</C> — never two
              setups side by side. React never lets two versions of the same effect coexist.
            </li>
            <li>
              Click the selected room again and nothing is logged. The dependency is unchanged, so
              the installed connection still matches the UI and React skips the pair entirely.
            </li>
            <li>
              Press <em>Unmount</em> and only cleanup runs. Unmounting is just the last time the
              effect is torn down.
            </li>
          </Bullets>
        </Section>

        <Section id="deps" n="02" title="The array is a comparison, not a trigger list">
          <P>
            <C>useEffect(setup, [a, b])</C> does not mean “run when <C>a</C> changes”. It means
            “<C>a</C> and <C>b</C> are the inputs of this effect”. React stores the array from the
            last run and compares it element by element with{' '}
            <C>Object.is</C>. All equal → the effect is already correct, skip. Any difference →
            run cleanup, then the new setup.
          </P>

          <Table
            head={['second argument', 'when setup + cleanup run']}
            rows={[
              [<C key="a">omitted</C>, 'after every render of the component (cleanup, then setup, every time)'],
              [<C key="b">[]</C>, 'once on mount — cleanup only on unmount'],
              [
                <C key="c">[a, b]</C>,
                'whenever a or b differs from the previous render under Object.is — cleanup first, then setup',
              ],
            ]}
          />

          <P>
            Two consequences follow. First, <C>Object.is</C> is identity for objects: a variable
            defined inside the component is recreated on every render, so an object, array or
            function in the list is “different” every time and the effect re-runs forever. Second,
            the length and order of the array cannot change between renders — that is the entire
            reason hooks may not be called conditionally.
          </P>

          <CodeBlock
            path="src/snippets/deps.ts"
            note="typechecked, not executed on the page"
            code={depsSource}
          />

          <P>
            The exhaustive-deps rule in <C>eslint-plugin-react-hooks</C> is not style advice: it
            lists every reactive value the setup reads. Props, state and anything derived from them
            are reactive. A ref is not — mutating <C>ref.current</C> changes nothing observable to
            React, so it never belongs in the array and never triggers a re-run.
          </P>
          <P>
            And a skipped dependency is not a performance trick, it is a bug postponed: the effect
            keeps reading the value from the render that created it.
          </P>
        </Section>

        <Section id="strict" n="03" title="Why it runs twice in development">
          <P>
            In development, <C>&lt;StrictMode&gt;</C> mounts the component, runs the setup,
            immediately runs the cleanup, then runs the setup again. Production strips the extra
            cycle out. This page is wrapped in <C>StrictMode</C> in <C>src/main.tsx</C>, exactly
            like a fresh Vite + React app — which is why the first mount of every panel on this
            page logs three rows where you expected one.
          </P>
          <P>
            It is a stress test, not a bug: an effect whose cleanup is incomplete looks perfect when
            mounted once and obviously broken when mounted twice. The bar is that{' '}
            <C>setup → cleanup → setup</C> must be indistinguishable from <C>setup</C>. React 19
            applies the same double invoke to renders (purity) and to ref callbacks.
          </P>

          <StrictModePanel />

          <P>
            Do not “fix” the double run with a <C>useRef</C> “already ran” flag. It silences the
            check while leaving the real leak in place — and it breaks the moment the component
            legitimately remounts, because a fresh mount gets a fresh ref.
          </P>
          <P>
            One placement detail that costs an afternoon if you get it wrong: StrictMode has to
            wrap what you hand to <C>createRoot</C>. A <C>&lt;StrictMode&gt;</C> buried deeper in an
            otherwise plain tree re-renders its children twice but does not double-invoke their
            effects, so nothing appears wrong.
          </P>
        </Section>

        <Section id="cleanup" n="04" title="Cleanup is not an unmount hook">
          <P>
            Cleanup runs before the <em>next</em> setup, not just on unmount. That is what makes it
            useful: it is the only place where you still know which request, subscription or timer
            you are about to invalidate. Also note that it closes over the values of the render
            that created it, which is why <C>return () =&gt; disconnect(roomId)</C> disconnects the
            old room and not the new one — no ref needed.
          </P>

          <RacePanel />

          <P>
            Two idioms cover most cases. A local <C>let ignore = false</C> flag flipped in cleanup
            is enough for any promise you cannot abort. For <C>fetch</C> there is{' '}
            <C>AbortController</C>: create it in setup, pass <C>signal</C>, call{' '}
            <C>controller.abort()</C> in cleanup, and the request is actually cancelled instead of
            merely ignored.
          </P>
        </Section>

        <Section id="wrong-tool" n="05" title="When the effect is the wrong tool">
          <P>
            “React re-rendered” is not a reason to run code. Before reaching for{' '}
            <C>useEffect</C>, ask what the value is for. Two of the three answers never need an
            effect.
          </P>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Decision
              title="Derived from props or state"
              verdict="compute in render"
              body="A pure transformation is not a side effect. Running it in an effect adds a state variable, one extra render, and a window where the UI shows the old value."
            />
            <Decision
              title="Caused by a click or submit"
              verdict="event handler"
              body="The handler knows what happened and which values were involved. An effect only knows that the screen changed — it cannot tell a click from a re-render from a remount."
            />
            <Decision
              tone="effect"
              title="Syncing with something outside React"
              verdict="useEffect"
              body="Sockets, timers, analytics, the DOM, a map library, a network request whose result must survive re-renders. Every one of them needs a matching teardown."
            />
          </div>

          <LoopPanel />
        </Section>

        <Section id="gotchas" n="06" title="Gotchas, answered">
          <Gotchas />
        </Section>

        <Sources />
      </main>
      <Footer />
    </div>
  );
}

/* ── chrome ─────────────────────────────────────────────────────────────── */

function TopBar() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('explain-me-theme', next ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/85 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/85">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
        <span className="font-mono text-[12px] text-zinc-400 dark:text-zinc-500">explain-me</span>
        <span className="font-mono text-[12px] font-medium text-zinc-800 dark:text-zinc-100">
          useEffect()
        </span>
        <nav className="ml-auto hidden items-center gap-4 md:flex">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="font-mono text-[11px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={toggle}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="ml-auto cursor-pointer rounded-lg border border-zinc-200 px-2 py-1 text-[12px] text-zinc-600 md:ml-4 dark:border-zinc-700 dark:text-zinc-300"
        >
          {dark ? '☾' : '☀'}
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="pt-14">
      <p className="font-mono text-[11px] tracking-[0.18em] text-indigo-500 uppercase dark:text-indigo-400">
        react · hooks
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
        useEffect()
      </h1>
      <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
        The escape hatch that runs <em>after</em> the browser has painted.
      </p>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-[15px] leading-7 text-zinc-700 dark:text-zinc-200">
          Keep one sentence and the rest of the API stops being surprising:
        </p>
        <p className="mt-2 text-[15px] leading-7 font-medium text-zinc-900 dark:text-white">
          An effect is a <span className="text-indigo-600 dark:text-indigo-400">synchronizer</span>{' '}
          — setup installs something for the current values, cleanup removes exactly that thing,
          and the dependency array declares which values make two setups equivalent.
        </p>
      </div>

      <p className="mt-6 text-[14px] leading-6 text-zinc-500 dark:text-zinc-400">
        Every listing on this page is imported from the file it names, and that same file runs in
        the panel above it. Nothing here is a paraphrase of the demo.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-10 dark:border-zinc-800">
      <div className="mx-auto max-w-3xl px-5 text-[12px] leading-6 text-zinc-400 dark:text-zinc-500">
        <p>
          Lesson from the{' '}
          <a
            className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700 dark:decoration-zinc-700 dark:hover:text-zinc-300"
            href="https://github.com/juaniquillo/explain-me-template"
          >
            explain-me template
          </a>
          . React semantics follow{' '}
          <a
            className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700 dark:decoration-zinc-700 dark:hover:text-zinc-300"
            href="https://react.dev/reference/react/useEffect"
          >
            react.dev/reference/react/useEffect
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

/* ── prose primitives ───────────────────────────────────────────────────── */

function Section({ id, n, title, children }: {
  id: string;
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-zinc-200 pt-10 first-of-type:border-0 dark:border-zinc-800">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
          {n}
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[15px] leading-7 text-zinc-600 dark:text-zinc-300">{children}</p>;
}

function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-100">
      {children}
    </code>
  );
}

function Bullets({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 space-y-2 text-[15px] leading-7 text-zinc-600 dark:text-zinc-300">
      {children}
    </ul>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-900/60">
            {head.map((cell) => (
              <th
                key={cell}
                className="px-4 py-2 font-mono text-[10.5px] font-medium tracking-[0.12em] text-zinc-500 uppercase dark:text-zinc-400"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 align-top leading-6 ${
                    j === 0 ? 'whitespace-nowrap' : 'text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Decision({ title, verdict, body, tone = 'neutral' }: {
  title: string;
  verdict: string;
  body: string;
  tone?: 'neutral' | 'effect';
}) {
  const accent =
    tone === 'effect'
      ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-500/10'
      : 'border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40';

  return (
    <div className={`rounded-xl border px-4 py-3 ${accent}`}>
      <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-100">{title}</p>
      <p className="mt-1 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
        → {verdict}
      </p>
      <p className="mt-2 text-[12.5px] leading-5 text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  );
}

function Ref({ file, lines }: { file: string; lines: string }) {
  return (
    <p className="mt-1 font-mono text-[11.5px] text-zinc-400 dark:text-zinc-500">
      {file}:{lines}
    </p>
  );
}

function Gotcha({ q, children }: { q: string; children: ReactNode }) {
  return (
    <li className="border-t border-zinc-200 pt-4 first:border-0 first:pt-0 dark:border-zinc-800">
      <p className="text-[14.5px] font-medium text-zinc-900 dark:text-white">{q}</p>
      <div className="mt-1 space-y-1.5 text-[14px] leading-6 text-zinc-600 dark:text-zinc-300">
        {children}
      </div>
    </li>
  );
}

function Gotchas() {
  return (
    <ul className="mt-5 space-y-4">
      <Gotcha q="Why does the effect run twice when the component mounts?">
        <p>
          StrictMode in development: setup, cleanup, setup. The second setup is the real one; the
          first is a mount/teardown rehearsal that exposes leaks. Production runs it once —{' '}
          <C>npm run build</C>, then try the panel on the built page.
        </p>
        <Ref file="src/main.tsx" lines="13-17" />
      </Gotcha>

      <Gotcha q="How does the dependency array actually decide when to run?">
        <p>
          Element-by-element <C>Object.is</C> against the previous render's array. All equal → skip,
          no cleanup. Any different → cleanup, then setup. Omitted → every render.
        </p>
        <Ref file="src/snippets/useRoomConnection.ts" lines="31" />
        <p>
          Objects and functions are compared by identity, so a value created during render is
          always “new” — that is the loop in the first hook of{' '}
          <C>src/snippets/deps.ts</C>.
        </p>
        <Ref file="src/snippets/deps.ts" lines="9-16" />
      </Gotcha>

      <Gotcha q="What is cleanup really for, if not unmount?">
        <p>
          It runs before the next setup, which is the only moment you still know what to invalidate.
          Unmount is just the final run.
        </p>
        <Ref file="src/snippets/useSlowQuote.ts" lines="74-77" />
      </Gotcha>

      <Gotcha q="Why does my effect see old props or state?">
        <p>
          Each render creates a new closure. The setup and the cleanup you return both belong to the
          render that produced them, so the cleanup sees the old room — by design. If the effect
          reads a value that changed and that value is not in the array, nothing re-runs and you
          keep reading the old closure.
        </p>
        <Ref file="src/snippets/useSlowQuote.ts" lines="44-50" />
      </Gotcha>

      <Gotcha q="Why does my effect cause an infinite loop?">
        <p>
          State written from an effect plus a dependency that is a new object each render. React
          cannot bail out because <C>{'{ a: 1 } !== { a: 1 }'}</C>. Fix the dependency, or drop the
          effect and derive the value during render.
        </p>
        <Ref file="src/snippets/useShout.ts" lines="21-24" />
      </Gotcha>

      <Gotcha q="When is useEffect simply the wrong tool?">
        <p>
          Derived values: compute during render. Interaction results: event handlers. Storage
          writes on every keystroke, “sync two pieces of state”, form validation — none of these are
          external systems.
        </p>
        <Ref file="src/snippets/useShout.ts" lines="33-35" />
      </Gotcha>
    </ul>
  );
}

function Sources() {
  return (
    <section className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="font-mono text-[11px] tracking-[0.18em] text-zinc-400 uppercase dark:text-zinc-500">
        Sources
      </h2>
      <ol className="mt-3 space-y-2 text-[13.5px] leading-6 text-zinc-600 dark:text-zinc-300">
        <li>
          1. This repo —{' '}
          <C>src/snippets/</C>, <C>src/panels/</C>: the code above is the code that runs.
        </li>
        <li>
          2. Origin —{' '}
          <a
            className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:decoration-zinc-700 dark:hover:text-white"
            href="https://react.dev/reference/react/useEffect"
          >
            react.dev · useEffect
          </a>{' '}
          (no external repo; self-driven lesson).
        </li>
        <li>
          3. Docs consulted —{' '}
          <a
            className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:decoration-zinc-700 dark:hover:text-white"
            href="https://react.dev/reference/react/StrictMode"
          >
            react.dev · StrictMode
          </a>
          ,{' '}
          <a
            className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:decoration-zinc-700 dark:hover:text-white"
            href="https://react.dev/learn/escape-hatches"
          >
            react.dev · Escape hatches
          </a>
          ,{' '}
          <a
            className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:decoration-zinc-700 dark:hover:text-white"
            href="https://react.dev/learn/removing-effect-dependencies"
          >
            react.dev · Removing effect dependencies
          </a>
          .
        </li>
      </ol>
    </section>
  );
}
