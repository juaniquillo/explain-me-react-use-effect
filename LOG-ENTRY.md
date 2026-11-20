# LOG-ENTRY.md

Copy this row into your central log (set location here: <!-- e.g. `explain-me-log/README.md` -->). One row per lesson.

| Date | Repo | Topic | Summary |
| ---- | ---- | ----- | ------- |
| 2026-11-20 | `explain-me-react-use-effect` | React `useEffect()` | `useEffect` is a synchronizer, not mount/update/unmount callbacks: setup runs after paint, cleanup runs before the next setup, and the deps array is an `Object.is` comparison of the effect's inputs. The dev double invoke is StrictMode stress-testing cleanup, not a bug — and cleanup is the cancellation window that stops a slow response from overwriting fresh data. |
