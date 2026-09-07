import { test } from "node:test";
import assert from "node:assert/strict";
import { checkExpect, unwrapInvoke, createBrowser } from "../src/run-plan.mjs";

test("checkExpect: ok, value, and list vocabulary", () => {
  assert.equal(checkExpect({ ok: true }, undefined).pass, true);
  assert.equal(checkExpect({ ok: false }, { ok: true }).pass, false);
  assert.equal(checkExpect({ ok: false, message: "x" }, { ok: false }).pass, true);
  assert.equal(checkExpect({ ok: true, value: "$60.00" }, { ok: true, value: { equals: "$60.00" } }).pass, true);
  assert.equal(checkExpect({ ok: true, value: "SAVE10 applied" }, { value: { contains: "applied" } }).pass, true);
  assert.equal(checkExpect({ ok: true }, { value: { absent: true } }).pass, true);
  assert.equal(checkExpect({ ok: true, value: "" }, { value: { absent: true } }).pass, true);
  assert.equal(checkExpect({ ok: true, value: "x" }, { value: { absent: true } }).pass, false);
  const items = [
    { name: "Earl Grey", quantity: "2" },
    { name: "Sencha", quantity: "1" },
  ];
  assert.equal(checkExpect({ ok: true, items }, { list: { length: 2 } }).pass, true);
  assert.equal(checkExpect({ ok: true, items }, { list: { length: 1 } }).pass, false);
  assert.equal(checkExpect({ ok: true, items }, { list: { contains: { name: "Sencha", quantity: "1" } } }).pass, true);
  assert.equal(checkExpect({ ok: true, items }, { list: { contains: { name: "Sencha", quantity: "3" } } }).pass, false);
  assert.equal(checkExpect({ ok: true, items }, { list: { excludes: { name: "Chamomile" } } }).pass, true);
  assert.equal(checkExpect({ ok: true, items }, { list: { excludes: { name: "Sencha" } } }).pass, false);
  assert.equal(checkExpect({ ok: true }, { list: { length: 0 } }).pass, true);
});

test("unwrapInvoke: agent-browser envelope down to a ToolResult", () => {
  const tool = { ok: true, items: [{ name: "Sencha" }], guidance: [] };
  const env = {
    success: true,
    data: { output: { content: [{ type: "text", text: JSON.stringify(tool) }], isError: false } },
  };
  assert.deepEqual(unwrapInvoke(JSON.stringify(env)), tool);
  assert.deepEqual(
    unwrapInvoke(JSON.stringify({ success: false, error: { message: "no such tool" } })),
    { ok: false, message: "no such tool" },
  );
  assert.deepEqual(
    unwrapInvoke(JSON.stringify({ success: true, data: { output: { content: [{ type: "text", text: "plain" }] } } })),
    { ok: true, value: "plain" },
  );
  assert.throws(() => unwrapInvoke("not json"), /did not print JSON/);
});

/** A fake agent-browser: records calls, answers `eval location.href` from a script of pages. */
function fakeBrowser(pages = []) {
  const ab = createBrowser(process.cwd());
  const calls = [];
  let opened = "";
  ab.exec = (args) => {
    calls.push(args.join(" "));
    if (args[0] === "open" || args[1] === "open") opened = args[args.length - 1];
    if (args[0] === "eval") {
      const href = pages.length ? pages.shift() : opened;
      // agent-browser prints eval results as a JSON string literal.
      return { status: 0, stdout: JSON.stringify(JSON.stringify(href)), stderr: "" };
    }
    return { status: 0, stdout: "", stderr: "" };
  };
  return { ab, calls };
}

test("open --init-script closes a running daemon first, once per script", () => {
  // agent-browser only registers init scripts when it launches the browser,
  // so the first open with one must relaunch; later opens with the same
  // script must not.
  const { ab, calls } = fakeBrowser();
  ab.open("http://localhost:3000/");
  ab.open("http://localhost:3000/", { initScript: "/app/webmcp.init.js" });
  ab.open("http://localhost:3000/cart", { initScript: "/app/webmcp.init.js" });
  ab.open("http://localhost:3000/", { initScript: "/app/other.init.js" });
  assert.deepEqual(
    calls.filter((c) => !c.startsWith("eval ")),
    [
      "open http://localhost:3000/",
      "close",
      "--init-script /app/webmcp.init.js open http://localhost:3000/",
      "--init-script /app/webmcp.init.js open http://localhost:3000/cart",
      "close",
      "--init-script /app/other.init.js open http://localhost:3000/",
    ],
  );
});

test("open retries when the daemon answered with a blank tab", () => {
  // A browser mid-shutdown can accept `open` and vanish; the next command then
  // auto-launches about:blank. The runner must notice and open again.
  const { ab, calls } = fakeBrowser(["about:blank"]);
  ab.open("http://localhost:3000/cart");
  assert.deepEqual(calls, [
    "open http://localhost:3000/cart",
    "eval JSON.stringify(location.href)",
    "open http://localhost:3000/cart",
    "eval JSON.stringify(location.href)",
  ]);
});

test("open accepts a redirect as a real page", () => {
  const { ab, calls } = fakeBrowser(["http://localhost:3000/home"]);
  ab.open("http://localhost:3000/");
  assert.equal(calls.filter((c) => c.startsWith("open ")).length, 1);
});
