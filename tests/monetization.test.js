// Run: npm test  (node --test, no dependencies)
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const KEY = "A1B2C3D4-E5F60718-9ABCDEF0-1234ABCD";
const PRODUCT = "test-product==";
const DAY = 24 * 60 * 60 * 1000;

let store, fetchCalls, fetchImpl, ctx;

function loadModules() {
  store = {};
  fetchCalls = [];
  const chrome = {
    storage: {
      local: {
        async get(k) { return k in store ? { [k]: structuredClone(store[k]) } : {}; },
        async set(obj) { for (const [k, v] of Object.entries(obj)) store[k] = structuredClone(v); },
        async remove(k) { delete store[k]; },
      },
    },
  };
  ctx = { chrome, URLSearchParams, AbortController, setTimeout, clearTimeout, Date, Promise, String, Number, Math };
  ctx.fetch = (url, opts) => { fetchCalls.push({ url, body: String(opts.body) }); return fetchImpl(url, opts); };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ["licensing.js", "usage.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "../extension/modules", f), "utf8"), ctx);
  }
  ctx.Licensing.PRODUCT_ID = PRODUCT;
}

const reply = (status, json) => async () => ({ status, json: async () => json });
const valid = (extra = {}) => reply(200, { success: true, uses: 1, purchase: { product_id: PRODUCT, refunded: false, chargebacked: false, disputed: false, ...extra } });

function setMonth(y, m) {
  ctx.Usage.now = () => new Date(y, m - 1, 15);
}

beforeEach(() => {
  loadModules();
  fetchImpl = valid();
  setMonth(2026, 9);
});

// --- Usage ---

test("counter increments 0 -> 1", async () => {
  const r = await ctx.Usage.tryConsume();
  assert.equal(r.allowed, true);
  assert.deepEqual(store.usage, { count: 1, month: "2026-09" });
});

test("49 -> 50 allowed, 50 -> blocked without incrementing", async () => {
  store.usage = { count: 49, month: "2026-09" };
  assert.equal((await ctx.Usage.tryConsume()).allowed, true);
  assert.equal(store.usage.count, 50);
  assert.equal((await ctx.Usage.tryConsume()).allowed, false);
  assert.equal(store.usage.count, 50);
});

test("new month resets the counter", async () => {
  store.usage = { count: 50, month: "2026-09" };
  setMonth(2026, 10);
  assert.deepEqual({ ...(await ctx.Usage.get()) }, { count: 0, month: "2026-10" });
  assert.equal((await ctx.Usage.tryConsume()).allowed, true);
  assert.deepEqual(store.usage, { count: 1, month: "2026-10" });
});

test("corrupted usage record is treated as 0", async () => {
  store.usage = { count: "abc", month: "2026-09" };
  assert.equal((await ctx.Usage.get()).count, 0);
});

test("simultaneous calculations cannot exceed the limit", async () => {
  store.usage = { count: 48, month: "2026-09" };
  const results = await Promise.all(Array.from({ length: 5 }, () => ctx.Usage.tryConsume()));
  assert.equal(results.filter(r => r.allowed).length, 2);
  assert.equal(store.usage.count, 50);
});

test("reading usage does not consume", async () => {
  await ctx.Usage.get();
  await ctx.Usage.get();
  assert.equal(store.usage, undefined);
});

// --- Licensing ---

test("key normalization: whitespace, case, empty, malformed", () => {
  const L = ctx.Licensing;
  assert.deepEqual({ ...L.normalizeKey(`  ${KEY.toLowerCase()}\n`) }, { key: KEY, error: null });
  assert.equal(L.normalizeKey("   ").error, "empty");
  assert.equal(L.normalizeKey("hello").error, "malformed");
  assert.equal(L.maskKey(KEY), "****-****-ABCD");
});

test("malformed key makes no request", async () => {
  const r = await ctx.Licensing.activate("nope");
  assert.equal(r.ok, false);
  assert.equal(fetchCalls.length, 0);
});

test("valid license activates Pro and unlimits usage", async () => {
  const r = await ctx.Licensing.activate(KEY);
  assert.equal(r.ok, true);
  assert.equal(ctx.Licensing.isProUser(), true);
  assert.match(fetchCalls[0].body, /increment_uses_count=true/);
  assert.match(fetchCalls[0].body, /product_id=test-product/);
  store.usage = { count: 50, month: "2026-09" };
  const u = await ctx.Usage.tryConsume();
  assert.equal(u.allowed, true);
  assert.equal(u.pro, true);
  assert.equal(store.usage.count, 50);
});

test("duplicate activation of the same key does not increment uses", async () => {
  await ctx.Licensing.activate(KEY);
  await ctx.Licensing.activate(KEY);
  assert.match(fetchCalls[1].body, /increment_uses_count=false/);
});

test("invalid license stays Free and is not stored", async () => {
  fetchImpl = reply(404, { success: false, message: "That license does not exist for the provided product." });
  const r = await ctx.Licensing.activate(KEY);
  assert.equal(r.ok, false);
  assert.match(r.message, /invalid/);
  assert.equal(ctx.Licensing.isProUser(), false);
  assert.equal(store.license, undefined);
});

test("license for another product is invalid", async () => {
  fetchImpl = valid({ product_id: "other" });
  assert.equal((await ctx.Licensing.activate(KEY)).ok, false);
});

test("refunded / chargebacked / disabled licenses are revoked", async () => {
  for (const impl of [valid({ refunded: true }), valid({ chargebacked: true }), valid({ disputed: true }),
    reply(404, { success: false, message: "This license key has been disabled." })]) {
    loadModules();
    await ctx.Licensing.activate(KEY);
    fetchImpl = impl;
    const r = await ctx.Licensing.refresh(true);
    assert.equal(r.ok, false);
    assert.equal(store.license.status, "revoked");
    assert.equal(ctx.Licensing.isProUser(), false);
    fetchImpl = valid();
  }
});

test("pro bypass: a plain stored flag does not grant Pro", async () => {
  store.pro = true;
  store.license = { status: "active" }; // no key, no validation timestamp
  await ctx.Licensing.load();
  assert.equal(ctx.Licensing.isProUser(), false);
});

test("cached validation: no request within 24h, request after", async () => {
  let t = 1_000_000_000_000;
  ctx.Licensing.now = () => t;
  await ctx.Licensing.activate(KEY);
  t += 23 * 60 * 60 * 1000;
  assert.equal((await ctx.Licensing.refresh(false)).skipped, true);
  assert.equal(fetchCalls.length, 1);
  t += 2 * 60 * 60 * 1000;
  await ctx.Licensing.refresh(false);
  assert.equal(fetchCalls.length, 2);
});

test("API error keeps Pro during grace period, drops it after", async () => {
  let t = 1_000_000_000_000;
  ctx.Licensing.now = () => t;
  await ctx.Licensing.activate(KEY);
  fetchImpl = async () => { throw new Error("network"); };
  t += 3 * DAY;
  const r = await ctx.Licensing.refresh(false);
  assert.match(r.message, /couldn't verify/);
  assert.equal(ctx.Licensing.isProUser(), true);
  fetchImpl = reply(503, null);
  t += 5 * DAY; // 8 days since last success
  await ctx.Licensing.refresh(false);
  assert.equal(ctx.Licensing.isProUser(), false);
  assert.equal(store.license.status, "error");
  fetchImpl = valid(); // Gumroad back -> Pro restored
  await ctx.Licensing.refresh(true);
  assert.equal(ctx.Licensing.isProUser(), true);
});

test("network error during activation does not replace an active license", async () => {
  await ctx.Licensing.activate(KEY);
  fetchImpl = async () => { throw new Error("timeout"); };
  const r = await ctx.Licensing.activate("FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFF");
  assert.equal(r.ok, false);
  assert.equal(store.license.key, KEY);
  assert.equal(ctx.Licensing.isProUser(), true);
});

test("malformed API response is treated as an error", async () => {
  fetchImpl = async () => ({ status: 200, json: async () => { throw new SyntaxError(); } });
  const r = await ctx.Licensing.activate(KEY);
  assert.match(r.message, /couldn't verify/);
});

test("clock moved far back makes a cached validation untrusted", async () => {
  let t = 1_000_000_000_000;
  ctx.Licensing.now = () => t;
  await ctx.Licensing.activate(KEY);
  t -= 3 * DAY;
  assert.equal(ctx.Licensing.isProUser(), false);
  await ctx.Licensing.refresh(false); // re-validates instead of trusting the cache
  assert.equal(fetchCalls.length, 2);
  assert.equal(ctx.Licensing.isProUser(), true);
});

test("state survives restart; reinstall starts Free and can re-activate", async () => {
  await ctx.Licensing.activate(KEY);
  const saved = structuredClone(store);
  loadModules(); // browser restart
  store = Object.assign(store, saved);
  await ctx.Licensing.load();
  assert.equal(ctx.Licensing.isProUser(), true);

  loadModules(); // reinstall: storage wiped
  await ctx.Licensing.load();
  assert.equal(ctx.Licensing.isProUser(), false);
  assert.equal((await ctx.Licensing.activate(KEY)).ok, true);
});

test("deactivate returns to Free", async () => {
  await ctx.Licensing.activate(KEY);
  await ctx.Licensing.deactivate();
  assert.equal(ctx.Licensing.isProUser(), false);
  assert.equal(store.license, undefined);
});
