// Free/Pro UI: header badge, upgrade hint, limit modal, license section
window.MonetizationUI = {
  message: null, // { text, type: "success" | "error" }
  busy: false,

  el(id) {
    return document.getElementById(id);
  },

  openCheckout() {
    window.open(window.Licensing.CHECKOUT_URL, "_blank", "noopener");
  },

  async render() {
    const L = window.Licensing;
    const U = window.Usage;
    const pro = L.isProUser();
    const usage = await U.get();

    // Header badge
    const badge = this.el("plan-badge");
    badge.classList.toggle("pro", pro);
    badge.textContent = pro
      ? "✓ Pro · Lifetime"
      : `Free · ${usage.count}/${U.FREE_LIMIT} calculations`;

    // Unobtrusive hint once the free quota is running low
    const hint = this.el("upgrade-hint");
    const low = !pro && usage.count >= U.HINT_AT;
    hint.style.display = low ? "flex" : "none";
    if (low) {
      const left = Math.max(0, U.FREE_LIMIT - usage.count);
      this.el("upgrade-hint-text").textContent =
        `${usage.count} / ${U.FREE_LIMIT} free calculations used · ${left} left this month`;
    }

    this.renderLicense(pro);
  },

  renderLicense(pro) {
    const L = window.Licensing;
    const status = this.busy ? "validating" : L.getStatus();
    const box = this.el("license-body");
    box.innerHTML = "";

    const statusText = {
      not_activated: "Not activated",
      validating: "Validating…",
      active: pro ? "✓ Active" : "Needs verification",
      invalid: "Invalid",
      revoked: "No longer active",
      error: "Couldn't verify",
    }[status];

    if (status !== "not_activated") {
      const row = document.createElement("p");
      row.className = "license-status " + (pro ? "ok" : status === "validating" ? "" : "bad");
      row.textContent = `Status: ${statusText}`;
      box.appendChild(row);
    }

    if (pro && !this.busy) {
      const info = document.createElement("p");
      info.className = "license-info";
      info.innerHTML = `Lifetime access<br>License: <code></code>`;
      info.querySelector("code").textContent = L.maskKey(L.record.key);
      box.appendChild(info);
      box.appendChild(this.button("Refresh License", "secondary", () => this.run(() => L.refresh(true))));
      box.appendChild(this.button("Deactivate / Change License", "link", async () => {
        await L.deactivate();
        this.message = null;
        this.render();
      }));
    } else {
      // Key input (also shown for invalid/revoked/error so the user can retry or change the key)
      const input = document.createElement("input");
      input.type = "text";
      input.id = "license-input";
      input.placeholder = "XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.disabled = this.busy;
      box.appendChild(input);

      const actions = document.createElement("div");
      actions.className = "license-actions";
      actions.appendChild(this.button(this.busy ? "Validating…" : "Activate", "primary", () =>
        this.run(() => L.activate(input.value))
      ));
      if (L.record && L.record.key && status === "error") {
        actions.appendChild(this.button("Refresh License", "secondary", () => this.run(() => L.refresh(true))));
      }
      box.appendChild(actions);

      const buy = document.createElement("p");
      buy.className = "license-buy";
      buy.textContent = "Don't have a license? ";
      buy.appendChild(this.button(`Buy Pro — ${L.PRICE_LABEL}`, "link", () => this.openCheckout()));
      box.appendChild(buy);
    }

    if (this.message) {
      const msg = document.createElement("p");
      msg.className = `license-message ${this.message.type}`;
      msg.textContent = this.message.text;
      box.appendChild(msg);
    }
  },

  button(text, kind, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `mz-btn ${kind}`;
    b.textContent = text;
    b.disabled = this.busy;
    b.addEventListener("click", onClick);
    return b;
  },

  async run(action) {
    if (this.busy) return;
    this.busy = true;
    this.message = null;
    this.render();
    try {
      const res = await action();
      if (res && res.message) this.message = { text: res.message, type: res.ok ? "success" : "error" };
      if (res && res.ok) this.hideLimitModal();
    } finally {
      this.busy = false;
      this.render();
    }
  },

  showLimitModal() {
    this.el("limit-modal").style.display = "flex";
  },

  hideLimitModal() {
    this.el("limit-modal").style.display = "none";
  },

  focusLicense() {
    this.hideLimitModal();
    const section = this.el("license-section");
    section.scrollIntoView({ behavior: "smooth" });
    const input = this.el("license-input");
    if (input) input.focus();
  },

  init() {
    this.el("plan-badge").addEventListener("click", () => this.focusLicense());
    this.el("upgrade-hint-btn").addEventListener("click", () => this.openCheckout());
    this.el("modal-buy-btn").addEventListener("click", () => this.openCheckout());
    this.el("modal-license-btn").addEventListener("click", () => this.focusLicense());
    this.el("modal-close-btn").addEventListener("click", () => this.hideLimitModal());
    this.el("modal-buy-btn").textContent = `Unlock Pro — ${window.Licensing.PRICE_LABEL}`;
    this.el("upgrade-hint-btn").textContent = `Unlock Pro — ${window.Licensing.PRICE_LABEL}`;

    // Keep other open popup windows in sync (e.g. activation done in another window)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.license) window.Licensing.record = changes.license.newValue || null;
      if (changes.license || changes.usage) this.render();
    });
  },
};
