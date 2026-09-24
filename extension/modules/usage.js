// Free-tier usage counter: 50 calculations per calendar month (chrome.storage.local)
window.Usage = {
  FREE_LIMIT: 50,
  HINT_AT: 40,
  STORAGE_KEY: "usage",
  _lock: Promise.resolve(),

  now() {
    return new Date();
  },

  currentMonth() {
    const d = this.now();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  },

  // Returns this month's usage; a different stored month (older or, after a clock change, newer) resets to 0
  async get() {
    const month = this.currentMonth();
    const data = await chrome.storage.local.get(this.STORAGE_KEY);
    const u = data[this.STORAGE_KEY];
    if (!u || u.month !== month || !Number.isFinite(u.count) || u.count < 0) {
      return { count: 0, month };
    }
    return { count: Math.floor(u.count), month };
  },

  // Consume one calculation. Serialized so rapid double clicks can't both pass the limit check.
  tryConsume() {
    const run = this._lock.then(async () => {
      if (window.Licensing.isProUser()) return { allowed: true, pro: true };
      const u = await this.get();
      if (u.count >= this.FREE_LIMIT) return { allowed: false, usage: u };
      const next = { count: u.count + 1, month: u.month };
      await chrome.storage.local.set({ [this.STORAGE_KEY]: next });
      return { allowed: true, usage: next };
    });
    this._lock = run.catch(() => {});
    return run;
  },
};
