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

test("open --init-script closes a running daemon first, once per script", () => {
  // agent-browser only registers init scripts when it launches the browser,
  // so the first open with one must relaunch; later opens with the same
  // script must not.
  const ab = createBrowser(process.cwd());
  const calls = [];
  ab.exec = (args) => {
    calls.push(args.join(" "));
    return { status: 0, stdout: "", stderr: "" };
  };
  ab.open("http://localhost:3000/");
  ab.open("http://localhost:3000/", { initScript: "/app/webmcp.init.js" });
  ab.open("http://localhost:3000/cart", { initScript: "/app/webmcp.init.js" });
  ab.open("http://localhost:3000/", { initScript: "/app/other.init.js" });
  assert.deepEqual(calls, [
    "open http://localhost:3000/",
    "close",
    "--init-script /app/webmcp.init.js open http://localhost:3000/",
    "--init-script /app/webmcp.init.js open http://localhost:3000/cart",
    "close",
    "--init-script /app/other.init.js open http://localhost:3000/",
  ]);
});
