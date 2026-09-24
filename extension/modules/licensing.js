// Gumroad license activation / validation.
// Uses the public POST /v2/licenses/verify endpoint, which needs no OAuth token,
// so no secret is shipped with the extension.
window.Licensing = {
  // --- Configuration (fill in from your Gumroad product) ---
  PRODUCT_ID: "REPLACE_WITH_GUMROAD_PRODUCT_ID",
  CHECKOUT_URL: "https://REPLACE_ME.gumroad.com/l/area-calculator-pro",
  PRICE_LABEL: "$5.99",

  VERIFY_URL: "https://api.gumroad.com/v2/licenses/verify",
  REVALIDATE_MS: 24 * 60 * 60 * 1000, // re-check once a day
  GRACE_MS: 7 * 24 * 60 * 60 * 1000,  // keep Pro while Gumroad is unreachable
  CLOCK_SKEW_MS: 24 * 60 * 60 * 1000,
  TIMEOUT_MS: 10000,
  STORAGE_KEY: "license",

  MESSAGES: {
    empty: "Please enter a license key.",
    malformed: "This doesn't look like a license key. Please check the key and try again.",
    invalid: "This license key is invalid. Please check the key and try again.",
    revoked: "This license is no longer active.",
    error: "We couldn't verify your license right now. Please try again later.",
    activated: "Pro activated successfully. You now have unlimited calculations.",
    refreshed: "License verified.",
  },

  // In-memory copy of the stored record (loaded by load())
  record: null,

  now() {
    return Date.now();
  },

  // Strip whitespace/newlines, uppercase; returns null for malformed keys
  normalizeKey(raw) {
    const key = String(raw || "").replace(/\s+/g, "").toUpperCase();
    if (!key) return { key: "", error: "empty" };
    if (!/^[0-9A-F]{8}(-[0-9A-F]{8}){3}$/.test(key)) return { key, error: "malformed" };
    return { key, error: null };
  },

  maskKey(key) {
    return key ? `****-****-${key.slice(-4)}` : "";
  },

  async load() {
    const data = await chrome.storage.local.get(this.STORAGE_KEY);
    this.record = data[this.STORAGE_KEY] || null;
    return this.record;
  },

  async save(record) {
    this.record = record;
    await chrome.storage.local.set({ [this.STORAGE_KEY]: record });
  },

  getStatus() {
    return this.record ? this.record.status : "not_activated";
  },

  // Single source of truth for Pro access
  isProUser() {
    const r = this.record;
    if (!r || r.status !== "active" || !r.key || !r.lastValidatedAt) return false;
    const age = this.now() - r.lastValidatedAt;
    if (age < -this.CLOCK_SKEW_MS) return false; // validation "from the future": clock was changed
    return age < this.GRACE_MS;
  },

  // Calls Gumroad. Result: { result: "valid" | "invalid" | "revoked" | "error" }
  async verify(key, increment) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    try {
      const body = new URLSearchParams({
        product_id: this.PRODUCT_ID,
        license_key: key,
        increment_uses_count: increment ? "true" : "false",
      });
      const res = await fetch(this.VERIFY_URL, { method: "POST", body, signal: controller.signal });
      let json = null;
      try { json = await res.json(); } catch (_) { /* malformed body */ }

      if (res.status >= 500 || !json || typeof json.success !== "boolean") return { result: "error" };
      if (!json.success) {
        // Gumroad answers success:false for unknown keys and for keys the seller disabled
        const msg = String(json.message || "").toLowerCase();
        return { result: msg.includes("disabled") ? "revoked" : "invalid" };
      }
      const p = json.purchase || {};
      if (p.product_id && p.product_id !== this.PRODUCT_ID) return { result: "invalid" };
      if (p.refunded || p.chargebacked || (p.disputed && !p.dispute_won)) return { result: "revoked" };
      return { result: "valid" };
    } catch (_) {
      return { result: "error" }; // network failure or timeout
    } finally {
      clearTimeout(timer);
    }
  },

  // Manual activation from the license input
  async activate(rawKey) {
    const { key, error } = this.normalizeKey(rawKey);
    if (error) return { ok: false, message: this.MESSAGES[error] };

    // Same key already active: just re-check without counting another activation
    const sameKey = this.record && this.record.key === key && this.record.status === "active";
    const { result } = await this.verify(key, !sameKey);
    const t = this.now();

    if (result === "valid") {
      await this.save({ key, status: "active", lastValidatedAt: t, lastAttemptAt: t });
      return { ok: true, message: this.MESSAGES.activated };
    }
    if (result === "error") {
      // Do not overwrite an existing working license because of a network problem
      return { ok: false, message: this.MESSAGES.error };
    }
    // invalid/revoked keys are not stored; an active license stays untouched
    if (!sameKey) return { ok: false, message: this.MESSAGES[result] };
    await this.save({ ...this.record, status: result, lastAttemptAt: t });
    return { ok: false, message: this.MESSAGES[result] };
  },

  // Periodic re-check (on popup open or "Refresh License")
  async refresh(force) {
    await this.load();
    const r = this.record;
    if (!r || !r.key || r.status === "invalid" || r.status === "revoked") return { skipped: true };

    const t = this.now();
    const age = t - (r.lastValidatedAt || 0);
    const fresh = age >= 0 && age < this.REVALIDATE_MS;
    if (!force && fresh) return { skipped: true };

    const { result } = await this.verify(r.key, false);
    if (result === "valid") {
      await this.save({ ...r, status: "active", lastValidatedAt: t, lastAttemptAt: t });
      return { ok: true, message: this.MESSAGES.refreshed };
    }
    if (result === "error") {
      // Keep "active" while inside the grace period; isProUser() enforces the window
      const status = r.status === "active" && this.isProUser() ? "active" : "error";
      await this.save({ ...r, status, lastAttemptAt: t });
      return { ok: false, message: this.MESSAGES.error };
    }
    await this.save({ ...r, status: result, lastAttemptAt: t });
    return { ok: false, message: this.MESSAGES[result] };
  },

  async deactivate() {
    this.record = null;
    await chrome.storage.local.remove(this.STORAGE_KEY);
  },
};
