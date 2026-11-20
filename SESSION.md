# SESSION.md

Running session log. Append one entry per prompt/response round. This is the transcript; `LOG-ENTRY.md` is the one-row pointer.

## 2026-11-20 — round 1 (planning)

### Prompt

`Explain me React useEffect(). Follow prompt.md in this repo.`

### Response

`TOPIC.md` was still the blank template, so Step 0 applied: asked about delivery vehicle, which
slice of the hook to centre the demo on, and which confusions the Gotchas had to answer. Answers:
interactive delivery; lifecycle + cleanup + dependencies; all six listed confusions; no origin repo
(self-driven); `Live demo:` gets an honest placeholder because the repo has no deploy.

Read before planning: `AGENTS.md`, `src/README.md`, `prompt.md`, and react.dev's `useEffect` and
`StrictMode` pages (via Context7) for the React 19 behaviour.

### Next

Build the demo and the write-up.

## 2026-11-20 — round 2 (build)

### Prompt

`do it`

### Response

Filled `TOPIC.md`, built the `src/` project (Vite 8 + React 19 + TS 5.9 + Tailwind 4 + shiki 4) and
the page: four live panels, decision cards, gotchas, sources. Wrote `README.md`, `AGENTS.md`
overrides, `src/README.md` `## Run`, `.gitignore` Node lines.

Two findings worth keeping:

1. **StrictMode's double invoke is gated on the root fiber.** The first implementation toggled
   `<StrictMode>` inside a panel. Measured against `react-dom@19.3`: a nested StrictMode
   double-*renders* (renders=2) but never double-*invokes* effects (setups=1);
   `commitDoubleInvokeEffectsInDEV` reads `root.current.mode`. Fixed by wrapping the app root in
   `src/main.tsx`, which also makes the lesson's other logs show the real dev behaviour.
2. **The naive race demo lied about staleness.** Labelling every applied response “stale” was wrong
   for fresh responses; the hook now compares against a `latestRoom` ref purely so the log can name a
   late response, and the card carries the `stale` badge.

Verified by execution: `tsc --noEmit`, `vite build`, served `dist/` and curled it, drove both the dev
server (`:5174`) and the built page (`:4173`) in a browser — lifecycle pair ordering, unmount-only
cleanup, dev `setup → cleanup → setup` vs prod single setup, naive vs `ignore`-flag race, render cap,
theme toggle — with no console errors and no external asset URLs.

### Next

Template friction: the user delegated the call to me (“you should be the one suggesting the
friction”), so `README.md` now carries the agent's own list — code-that-runs-and-displays pattern,
the `Live demo:` placeholder, the two overlapping section specs, no verification slot, “one concept”
vs several panels, dev-only behaviour, version policy.
