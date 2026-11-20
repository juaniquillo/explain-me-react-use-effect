# explain-me-react-use-effect

How `useEffect` actually schedules setup and cleanup, and what its dependency array compares.

**Live demo:** not deployed yet — `cd src && npm run build`, then serve `src/dist/` (`npx vite preview`).

## What

`useEffect(setup, dependencies?)` is React's escape hatch from render purity. A component's render
function must stay a pure calculation (props + state → JSX), so anything that touches the world
outside React — a websocket, an interval, `document.title`, an analytics call, a request — has to
happen somewhere else. `useEffect` is that somewhere else.

You give React a **setup** function, and it may return a **cleanup** function. React runs the setup
after the browser has painted, and the cleanup immediately before the next setup and when the
component leaves the tree.

The sentence the rest of the API hangs off:

> An effect is a **synchronizer**: setup installs something for the current values, cleanup removes
> exactly that thing, and the dependency array declares which values make two setups equivalent.

That framing replaces the mental model most people start with — “on mount / on update / on unmount”.
There are no such callbacks in the hook API. There is one pair of functions and one list of inputs.

## Why

The hook exists because React needs to interleave three phases and only one of them is yours:

1. **Render** — call the component. Pure. May run twice in development, may be thrown away.
2. **Commit** — write the result into the DOM, then the browser paints.
3. **Effect** — only now does React run your setup, so a slow effect can never delay the first
   pixel.

Once effects run after paint, they also have to run *again* whenever the thing they installed no
longer matches the UI. Hence the pair: every setup must be reversible by its cleanup, because React
will call cleanup before re-running, not just on unmount.

Understanding that fixes a whole class of bugs at once — the double run in development (a deliberate
stress test of cleanup), the “late response overwrites fresh data” race (cleanup is the cancellation
window), and the infinite loop (a dependency that is a new object every render).

## How demo works

`src/` is a Vite + React 19 + TypeScript project. The page is a write-up with four live panels, and
each panel is driven by a file in `src/snippets/` that is **also shown on the page**: the page
imports the same module twice, once to run it and once with Vite's `?raw` suffix to highlight it.
Listings cannot drift from behaviour.

| Panel | What it proves |
| ----- | -------------- |
| `LifecyclePanel` | change `roomId` → `cleanup(old)` then `setup(new)`; unmount → cleanup only; same value → nothing |
| `StrictModePanel` | one mount logs `setup → cleanup → setup` on the dev server and a single setup in the build |
| `RacePanel` | missing cleanup lets a 2.4s response overwrite a 0.35s one; `let ignore` discards it |
| `LoopPanel` | state written from an effect on every render (capped at 25) versus the same value derived during render |

The page also keeps a **decision card** for “derived state / event handler / effect”, and a gotchas
section that answers the questions in `TOPIC.md`.

```sh
cd src
npm ci                 # installs from the committed lockfile
npm run dev            # primary run command → http://localhost:5173

# verification (the same lines used before calling this done)
npm run typecheck      # tsc --noEmit, strict
npm run build          # → src/dist/ (hashed CSS + JS, no CDN)
npx vite preview --port 4173
curl -s http://localhost:4173/ | head -20
```

- **Runtime:** Node 26 used here; Node ≥ 20 is enough. No `.env`, no environment variables, no API
  keys. Everything runs from local code.
- **Dependencies, and why each one is here:** `react@19` + `react-dom@19` (the subject),
  `vite@8` + `@vitejs/plugin-react@6` (dev server and static build), `typescript@5.9` (the
  typecheck gate), `tailwindcss@4` + `@tailwindcss/vite@4` (page styling, per `src/README.md`),
  `shiki@4` (syntax highlighting, light and dark themes in one pass, JavaScript regex engine so no
  `.wasm` fetch is needed).
- **Build output:** `src/dist/` is a servable, self-contained static bundle. `index.html` plus one
  CSS and one JS asset; no CDN, no font requests, no runtime fetches. Verified by serving `dist/`
  and grepping the assets for external URLs — the only `https://` strings left are anchor `href`s
  in the page itself and XML namespaces inside React.
- **Bundle note:** shiki is the whole cost of the build (~176 kB gzip). It is loaded before the
  first render on purpose, so code blocks never flash; a lesson page can afford it.
- **Deploy line:** provider — none yet; build `npm run build`; output `src/dist/`; env vars — none.

### Code walkthrough

The two files worth reading in order:

- `src/snippets/useRoomConnection.ts` — the smallest honest effect: setup opens a connection for
  the current `roomId`, schedules a `setTimeout`, and cleanup clears the timer and disconnects.
  `[roomId, record]` is the input list; `record` is a `useCallback`-stable logger from
  `src/lib/events.ts`, which is itself why it can sit in a dependency array.
- `src/lib/events.ts` — the log lives **above** the component under test, so a cleanup entry is
  still recorded after that component has unmounted. The timestamps are relative to the first entry,
  and the array keeps the last 40 rows.

Two implementation details worth knowing before reading the code:

- `src/main.tsx` wraps the app in `<StrictMode>`, which is why the first mount of every panel logs
  three rows. React's double-invoke pass is keyed to the root fiber; a `<StrictMode>` nested deeper
  in an otherwise plain tree double-renders its children but does not double-invoke their effects
  (measured on `react-dom` 19.3, `commitDoubleInvokeEffectsInDEV`).
- The page imports the highlighter with a top-level `await` before `createRoot`, so rendering is
  synchronous and no code block is ever unstyled.

## Gotchas

- **The double run is StrictMode, not a bug.** Development mounts the component, runs setup, runs
  cleanup, runs setup again; production runs it once. The bar is that
  `setup → cleanup → setup` is indistinguishable from `setup`. Do not guard it with a `useRef`
  “already ran” flag — that hides the leak the check exists for. `src/main.tsx:13-17`,
  `src/snippets/StrictProbe.tsx:10-13`
- **The dependency array is a comparison, not a trigger list.** React compares each element with
  `Object.is` against the previous render. All equal → skip, no cleanup. Any different → cleanup,
  then setup. Omitted → after every render; `[]` → setup once, cleanup at unmount.
  `src/snippets/useRoomConnection.ts:31`
- **A dependency created during render is new every render.** Objects, arrays and function literals
  are compared by identity, so the effect re-runs every time; `useMemo`/`useCallback`, a primitive,
  or moving the value inside the effect are the three fixes. `src/snippets/deps.ts:9-16`
- **Cleanup is not an unmount hook.** It runs before the *next* setup, which is the only moment you
  still know what to invalidate — and it closes over the values of the render that produced it, so
  `() => disconnect(roomId)` disconnects the old room, not the new one.
  `src/snippets/useSlowQuote.ts:74-77`
- **Late responses win when nothing cancels them.** Responses do not arrive in request order. Use a
  local `ignore` flag for any promise, or `AbortController` for `fetch`; both belong in cleanup.
  `src/snippets/useSlowQuote.ts:44-50`
- **“Why does it loop?” is almost always state + identity.** An effect that writes state on every
  render plus a dependency that is a fresh object each render cannot settle: React's bail-out
  (“same state”) never applies. `src/snippets/useShout.ts:21-24`
- **Most effects should not exist.** A value derived from props or state is computed during render;
  a result of a click belongs in the handler; only synchronization with something outside React
  needs an effect. `src/snippets/useShout.ts:33-35`
- **`useLayoutEffect` is the sibling that runs before paint.** Needed only when the user must not
  see the intermediate layout (measuring a tooltip, restoring scroll). Effects do not run during
  server rendering at all.

## Sources

1. This repo — `src/snippets/`, `src/panels/`, `src/lib/` (the code above is the code that runs).
2. Origin — n/a, self-driven lesson. The reference used as the origin is
   [react.dev · useEffect](https://react.dev/reference/react/useEffect).
3. Docs consulted — [react.dev · StrictMode](https://react.dev/reference/react/StrictMode),
   [react.dev · Escape hatches](https://react.dev/learn/escape-hatches),
   [react.dev · Removing effect dependencies](https://react.dev/learn/removing-effect-dependencies),
   plus the installed `react-dom@19.3` development source
   (`commitDoubleInvokeEffectsInDEV`) to confirm where the StrictMode gate lives.

Built from the [explain-me template](https://github.com/juaniquillo/explain-me-template).

### Template friction

Written by the agent that built this lesson, from the blank template, so this is one reading of the
rules rather than a maintained exemplar. What actually cost time:

- **No pattern for code that both runs and is displayed.** `src/README.md` blesses three shapes:
  checked-in copy, generating script, runtime fetch-and-render. The natural choice for a live demo —
  `import source from './x.ts?raw'`, i.e. a runtime *import* of the module the panel executes — is
  none of them as worded. Filed under (c) and explained; naming it explicitly would make the rule
  match the obvious implementation.
- **`Live demo:` has no pre-deploy story.** `AGENTS.md` requires the line for web lessons, but a
  fresh lesson has no URL and no deploy target. Used an honest placeholder; the rule could allow
  “not deployed — `<build command>`, serve `<output dir>`” as the canonical first form.
- **Two overlapping section specs.** The template `README.md` (“Explanation format”) and `AGENTS.md`
  (“README conformance”) describe the same section list with different names (What/Why/How demo works
  vs overall explanation/usage examples/walkthrough). Merging them was guesswork, and the title rule
  (`# explain-me-<topic>`) contradicts the template's own heading (`# explain-me-template`).
- **No slot for verification evidence.** The rules insist on verifying by execution, but the README
  structure has nowhere for the commands and their results, so they land inside “How demo works” and
  blur what the demo *is* with how it was *checked*. A short `## Verified` section would fix it.
- **“One concept only” versus the panels a concept needs.** This topic is one idea (“an effect
  synchronizes setup with cleanup”) but it needs four panels to answer the confusions `TOPIC.md`
  collects. The `src/README.md` rule reads as “one panel”, which would have forced three extra repos.
  Worth separating “one concept” from “one widget”.
- **Dev-only behaviour has no place in the structure.** `npm run dev` and `dist/` genuinely differ
  here (StrictMode's extra setup/cleanup cycle), yet the build-output rule implies parity between
  them. It had to be documented in the page, the README and `src/README.md` separately; a standard
  “dev-only behaviours:” line per lesson would be cheaper than rediscovering it.
- **No version policy.** `latest` at the time of writing was Vite 8, TypeScript 7 and React 19.3.
  Pinning TypeScript to 5.9 was a judgement call with nothing in the template to lean on; “pin what
  you tested and record it here” would settle it.

