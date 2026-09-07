#!/usr/bin/env node
// End-to-end test of @sightmap/next against this app, driven through
// agent-browser's native WebMCP path. Needs the app running (default
// http://localhost:3000, override with SIGHTMAP_BASE_URL) and Chrome for
// Testing 152+ installed via `npx agent-browser install`.
//
// What it proves, in order:
//   1. `sightmap-next build` wrote the artifacts, and Next serves them byte-for-byte
//   2. the compiled IR matches the corpus and carries the expected tools per view
//   3. <SightkickTools/> in fetch mode boots the runtime on a hard load and
//      registers on the browser's *native* document.modelContext
//   4. exactly the right tools register on each route (view scoping)
//   5. tools re-register on client-side navigation, without a reload
//   6. a result carries journey guidance
//   7. `webmcp.init.js` via `agent-browser --init-script` boots the same tools,
//      and the page's own <SightkickTools/> reuses it rather than registering twice
//   8. every stored plan replays green
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createBrowser, runPlan, unwrapInvoke } from "@sightmap/next/run-plan";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.SIGHTMAP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const PLANS = [
  "browse",
  "product",
  "cart",
  "coupon",
  "checkout",
  "checkout-validation",
].map((n) => join(ROOT, "plans", `${n}.plan.json`));

/** The contract: which tools each route must expose. Anything else is a scoping bug. */
const EXPECTED = {
  "/": [
    "filter_by_category",
    "list_products",
    "open_product",
    "quick_add_to_cart",
    "search_products",
    "sort_products",
    "view_cart",
  ],
  "/products/ethiopia-yirgacheffe": [
    "add_to_cart",
    "back_to_shop",
    "choose_option",
    "read_product",
    "set_quantity",
    "view_cart_from_product",
  ],
  "/cart": [
    "apply_coupon",
    "continue_shopping",
    "decrease_quantity",
    "increase_quantity",
    "proceed_to_checkout",
    "read_cart",
    "read_totals",
    "remove_from_cart",
  ],
  "/checkout": [
    "back_to_cart",
    "choose_shipping",
    "fill_shipping_details",
    "place_order",
    "read_checkout_totals",
    "read_form_errors",
    "read_order_summary",
  ],
  "/orders": ["list_orders", "open_order"],
  // The route matches even when the order does not exist in this tab (OrderMissing).
  "/orders/ORD-9999": [
    "continue_shopping_from_order",
    "list_order_items",
    "read_order",
    "view_order_history",
  ],
};

let failures = 0;
let checks = 0;
function check(name, cond, detail = "") {
  checks++;
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}
function section(title) {
  console.log(`\n${title}`);
}
const sameSet = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

async function text(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return { body: await r.text(), type: r.headers.get("content-type") ?? "" };
}

// ── 1. artifacts on disk and over HTTP ──────────────────────────────────────
section("1. sightmap-next build artifacts are served as-is");
const corpusDisk = readFileSync(join(ROOT, "public/.well-known/sightmap.json"), "utf8");
const irDisk = readFileSync(join(ROOT, "public/.well-known/sightkick.json"), "utf8");
const rtDisk = readFileSync(join(ROOT, "public/sightkick-runtime.js"), "utf8");
const initDisk = readFileSync(join(ROOT, "webmcp.init.js"), "utf8");
const corpusHttp = await text(`${BASE}/.well-known/sightmap.json`);
const irHttp = await text(`${BASE}/.well-known/sightkick.json`);
const rtHttp = await text(`${BASE}/sightkick-runtime.js`);
check("/.well-known/sightmap.json matches public/", corpusHttp.body === corpusDisk);
check("/.well-known/sightkick.json matches public/", irHttp.body === irDisk);
check("/.well-known/*.json served as JSON", /json/.test(corpusHttp.type) && /json/.test(irHttp.type), `${corpusHttp.type} / ${irHttp.type}`);
check("/sightkick-runtime.js matches public/", rtHttp.body === rtDisk);
check("/sightkick-runtime.js served as JavaScript", /javascript/.test(rtHttp.type), rtHttp.type);
check("webmcp.init.js embeds the runtime and the IR", initDisk.includes(rtDisk) && initDisk.includes(JSON.stringify(JSON.parse(irDisk))));

// ── 2. IR ↔ corpus ──────────────────────────────────────────────────────────
section("2. the compiled IR agrees with the corpus");
const corpus = JSON.parse(corpusDisk);
const ir = JSON.parse(irDisk);
const corpusViews = new Set((corpus.views ?? []).map((v) => v.name));
const irViews = new Set(ir.views.map((v) => v.name));
check("every IR view is a corpus view", [...irViews].every((v) => corpusViews.has(v)), `${[...irViews]}`);
check("IR has 6 views", irViews.size === 6, `${irViews.size}`);
check("IR has 34 tools", ir.tools.length === 34, `${ir.tools.length}`);
check("every tool has an ensureView", ir.tools.every((t) => t.ensureView?.view && irViews.has(t.ensureView.view)));
const allExpected = Object.values(EXPECTED).flat();
check("the per-route contract below covers every tool exactly once", sameSet(allExpected, ir.tools.map((t) => t.name)));
const guided = ir.tools.filter((t) => (t.guidance ?? []).length > 0).length;
check("journeys compiled into guidance on at least half the tools", guided * 2 >= ir.tools.length, `${guided}/${ir.tools.length}`);

// ── 3–6. live, through agent-browser ────────────────────────────────────────
const ab = createBrowser(ROOT, { session: process.env.AGENT_BROWSER_SESSION });
const listTools = () => {
  const r = ab.exec(["webmcp", "list", "--json"]);
  const env = JSON.parse(r.stdout || r.stderr);
  if (env.success === false) throw new Error(JSON.stringify(env.error));
  return env.data.tools.map((t) => t.name);
};
const evalJson = (expr) => {
  const r = ab.exec(["eval", `JSON.stringify(${expr})`]);
  const out = (r.stdout || "").trim();
  return JSON.parse(JSON.parse(out));
};

try {
  section("3. <SightkickTools/> (fetch mode) boots the runtime on the native WebMCP surface");
  ab.open(`${BASE}/`);
  ab.waitForTools();
  const boot = evalJson(`({
    bootTag: !!document.getElementById("sightkick-boot"),
    runtimeTag: !!document.querySelector('script[src="/sightkick-runtime.js"]'),
    inlinedIr: typeof window.__sightkick_ir,
    irLoaded: !!(window.__sightkick && window.__sightkick.ir),
    polyfilled: window.__sightkick && window.__sightkick.polyfilled,
    native: !!document.modelContext && String(document.modelContext.executeTool).includes("native code"),
  })`);
  check("the boot <script id=sightkick-boot> rendered", boot.bootTag);
  check("it appended /sightkick-runtime.js", boot.runtimeTag);
  check("no IR was inlined (fetch mode)", boot.inlinedIr === "undefined", boot.inlinedIr);
  check("the runtime fetched and loaded the IR", boot.irLoaded);
  check("registered on the native document.modelContext, not the polyfill", boot.native && boot.polyfilled === false, JSON.stringify(boot));

  section("4. exactly the expected tools register on each route (hard load)");
  for (const [route, expected] of Object.entries(EXPECTED)) {
    ab.open(`${BASE}${route}`);
    ab.waitForTools();
    const got = listTools();
    check(`${route} → ${expected.length} tool(s)`, sameSet(got, expected), `got ${JSON.stringify(got.sort())}`);
  }

  section("5. tools re-register on client-side navigation, no reload");
  ab.open(`${BASE}/`);
  ab.waitForTools();
  const nav0 = evalJson("performance.getEntriesByType('navigation').length");
  let r = ab.invoke("open_product", { name: "Sencha" });
  check("open_product ok", r.ok === true, JSON.stringify(r));
  check("Product tools now registered", sameSet(listTools(), EXPECTED["/products/ethiopia-yirgacheffe"]));
  check("URL is /products/sencha", evalJson("location.pathname") === "/products/sencha");
  r = ab.invoke("add_to_cart");
  check("add_to_cart returns the cart count 1", r.ok === true && r.value === "1", JSON.stringify(r));
  r = ab.invoke("view_cart_from_product");
  check("Cart tools now registered", r.ok === true && sameSet(listTools(), EXPECTED["/cart"]));
  r = ab.invoke("read_cart");
  check("the cart line survived the navigations", r.items?.length === 1 && r.items[0].name === "Sencha", JSON.stringify(r));
  check("still the same document (no full reload)", evalJson("performance.getEntriesByType('navigation').length") === nav0);

  section("6. results carry journey guidance");
  ab.open(`${BASE}/`);
  ab.waitForTools();
  r = ab.invoke("search_products", { query: "grinder" });
  check("search_products → guidance toward open_product", r.guidance?.some((g) => g.tool === "open_product"), JSON.stringify(r.guidance));
  r = ab.invoke("open_product", { name: "Hand grinder" });
  check("open_product → after_navigation guidance into the Product view", r.guidance?.some((g) => g.when === "after_navigation" && g.view === "Product"), JSON.stringify(r.guidance));
  r = ab.invoke("read_product");
  check("a tool with no journey successor has no guidance", !r.guidance, JSON.stringify(r));

  section("7. webmcp.init.js via --init-script boots the same tools, once");
  ab.open(`${BASE}/`, { initScript: join(ROOT, "webmcp.init.js") });
  ab.waitForTools();
  const init = evalJson(`({
    inlinedIr: typeof window.__sightkick_ir,
    runtimeTag: !!document.querySelector('script[src="/sightkick-runtime.js"]'),
    irTools: (window.__sightkick.ir.tools || []).length,
  })`);
  check("the init script inlined the IR before the page loaded", init.inlinedIr === "object", init.inlinedIr);
  check("<SightkickTools/> reused it and did not append the runtime again", init.runtimeTag === false);
  const initTools = listTools();
  check("Catalog tools registered exactly once", sameSet(initTools, EXPECTED["/"]) && initTools.length === EXPECTED["/"].length, JSON.stringify(initTools));
  r = ab.invoke("list_products");
  check("list_products works through the init-script runtime", r.ok === true && r.items?.length === 9, JSON.stringify(r).slice(0, 200));
  // Undo the init script for the plan runs: agent-browser keeps it for the session.
  ab.close();

  section("8. every stored plan replays green");
  const ab2 = createBrowser(ROOT, { session: process.env.AGENT_BROWSER_SESSION });
  try {
    for (const plan of PLANS) {
      const code = runPlan(plan, { browser: ab2, baseUrl: BASE, log: (m) => console.log(`   ${m}`) });
      check(`${plan.split("/").pop()} passed`, code === 0);
    }
  } finally {
    ab2.close();
  }
} finally {
  try {
    ab.close();
  } catch {
    // already closed
  }
}

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);

// Keep the import honest: unwrapInvoke is what ab.invoke uses under the hood.
void unwrapInvoke;
