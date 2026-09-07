# @sightmap/next

## 0.0.2

### Patch Changes

- 4e3738e: `sightmap-next run-plan --init-script` now works when an agent-browser daemon is already running. agent-browser only registers `--init-script` when it launches the browser and silently ignores the flag on a running daemon, so a plan run that followed any other `open` never saw the Sightkick runtime and timed out. The first `open` with an init script (or a switch to a different one) now closes the running daemon so the relaunch picks the script up; later opens in the same run reuse it.
- a1fceb9: `sightmap-next run-plan` no longer trusts an `open` that agent-browser accepted while its browser was still tearing down from a previous close. That race leaves the next command on an auto-launched blank tab, and the plan then times out waiting for a runtime that was never going to load. `open` now confirms a real page is there (any page counts, so redirects are fine) and re-opens when it finds `about:blank`. When the wait for the runtime does time out, the error now reports the page's URL, ready state, whether the boot script and runtime tag are present, and the page's own errors, so a CI failure is diagnosable from its log.
