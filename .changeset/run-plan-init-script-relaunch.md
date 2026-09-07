---
"@sightmap/next": patch
---

`sightmap-next run-plan --init-script` now works when an agent-browser daemon is already running. agent-browser only registers `--init-script` when it launches the browser and silently ignores the flag on a running daemon, so a plan run that followed any other `open` never saw the Sightkick runtime and timed out. The first `open` with an init script (or a switch to a different one) now closes the running daemon so the relaunch picks the script up; later opens in the same run reuse it.
