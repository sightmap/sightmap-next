// Resolve the sightmap / sightkick / agent-browser CLIs: the nearest
// node_modules/.bin above the app dir (they're normally devDependencies), then PATH.
import { existsSync } from "node:fs";
import { join, dirname, delimiter } from "node:path";
import { spawnSync } from "node:child_process";

export function resolveBin(name, root = process.cwd()) {
  const file = process.platform === "win32" ? `${name}.cmd` : name;
  // Walk up from the app dir: npm workspaces hoist bins to an ancestor node_modules/.bin.
  for (let dir = root; ; dir = dirname(dir)) {
    const local = join(dir, "node_modules", ".bin", file);
    if (existsSync(local)) return local;
    if (dirname(dir) === dir) break;
  }
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    const p = join(dir, process.platform === "win32" ? `${name}.cmd` : name);
    if (dir && existsSync(p)) return p;
  }
  return null;
}

export function run(bin, args, { cwd, input, quiet = false } = {}) {
  const res = spawnSync(bin, args, {
    cwd,
    input,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === "win32",
  });
  if (res.error) throw new Error(`${bin}: ${res.error.message}`);
  if (res.status !== 0 && !quiet) {
    throw new Error(
      `${[bin, ...args].join(" ")} exited ${res.status}\n${res.stderr || res.stdout}`,
    );
  }
  return res;
}

export function requireBin(name, root, hint) {
  const bin = resolveBin(name, root);
  if (!bin)
    throw new Error(
      `"${name}" not found on PATH or in node_modules/.bin. ${hint}`,
    );
  return bin;
}
