/* Interaktion: språk, meny, filter, formulär och scroll-reveal. Kräver i18n.js. */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Språkbytare ---------- */
  $$(".lang button").forEach(btn => btn.addEventListener("click", () => setLang(btn.dataset.lang, true)));

  /* ---------- Mobilmeny ---------- */
  const burger = $(".burger");
  const menu = $("#menu");

  function setMenu(open) {
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  }
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && menu.classList.contains("open")) { setMenu(false); burger.focus(); }
  });
  window.matchMedia("(min-width: 1080px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

  /* ---------- Filter för tjänster ---------- */
  const chips = $$(".chip");
  const packages = $$(".package");
  const status = $("#filter-status");
  let activeFilter = "all";

  function applyFilter() {
    let shown = 0;
    packages.forEach(p => {
      const match = activeFilter === "all" || p.dataset.tags.split(" ").includes(activeFilter);
      p.hidden = !match;
      if (match) shown++;
    });
    chips.forEach(c => c.setAttribute("aria-pressed", String(c.dataset.filter === activeFilter)));
    status.textContent = shown === 1 ? t("filter.count1") : t("filter.countN", { n: shown });
  }
  chips.forEach(c => c.addEventListener("click", () => { activeFilter = c.dataset.filter; applyFilter(); }));

  /* ---------- Förval av tjänst från paketknapp ---------- */
  $$(".pick").forEach(a => a.addEventListener("click", () => { $("#f-package").value = a.dataset.package; }));

  /* ---------- Kontaktformulär ---------- */
  const form = $("#contact-form");
  const summary = $("#form-summary");
  const ok = $("#form-ok");
  const fields = {
    name: { input: $("#f-name"), error: $("#e-name"), key: "err.name", valid: v => v.trim().length >= 2 },
    email: { input: $("#f-email"), error: $("#e-email"), key: "err.email", valid: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
    message: { input: $("#f-message"), error: $("#e-message"), key: "err.message", valid: v => v.trim().length >= 10 }
  };
  // Vilka fält som just nu visar fel, så att texten kan översättas vid språkbyte
  const invalid = new Set();

  function showError(name) {
    const f = fields[name];
    f.input.setAttribute("aria-invalid", "true");
    f.error.textContent = t(f.key);
    f.error.hidden = false;
    invalid.add(name);
  }
  function clearError(name) {
    const f = fields[name];
    f.input.removeAttribute("aria-invalid");
    f.error.hidden = true;
    invalid.delete(name);
  }
  function renderSummary() {
    summary.hidden = invalid.size === 0;
    summary.textContent = invalid.size ? t("err.summary") : "";
  }

  Object.keys(fields).forEach(name => {
    // Validera när användaren lämnar fältet, och rensa fel så snart värdet blir giltigt
    fields[name].input.addEventListener("blur", () => {
      if (fields[name].input.value === "" && !invalid.has(name)) return;
      fields[name].valid(fields[name].input.value) ? clearError(name) : showError(name);
      renderSummary();
    });
    fields[name].input.addEventListener("input", () => {
      if (invalid.has(name) && fields[name].valid(fields[name].input.value)) { clearError(name); renderSummary(); }
    });
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    ok.hidden = true;
    let first = null;
    Object.keys(fields).forEach(name => {
      if (fields[name].valid(fields[name].input.value)) clearError(name);
      else { showError(name); first = first || fields[name].input; }
    });
    renderSummary();
    if (first) { first.focus(); return; }

    const pkgSelect = $("#f-package");
    const pkgLabel = pkgSelect.value ? pkgSelect.options[pkgSelect.selectedIndex].textContent : "";
    const body = [
      t("mail.name") + ": " + fields.name.input.value.trim(),
      t("mail.email") + ": " + fields.email.input.value.trim(),
      pkgLabel ? t("mail.package") + ": " + pkgLabel : "",
      "",
      fields.message.input.value.trim()
    ].filter((line, i) => line !== "" || i === 3).join("\n");

    ok.textContent = t("f.ok");
    ok.hidden = false;
    window.location.href = "mailto:hej@haconcept.se?subject=" + encodeURIComponent(t("mail.subject")) +
      "&body=" + encodeURIComponent(body);
  });

  /* ---------- Scroll-reveal ---------- */
  function initReveal() {
    const targets = $$(".hero-text, .hero-visual, .pillars li, .package, .steps li, .about > div, .contact-grid > *, .heading");
    targets.forEach(el => el.classList.add("reveal"));
    if (!("IntersectionObserver" in window)) { targets.forEach(el => el.classList.add("in")); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    targets.forEach(el => io.observe(el));
  }

  /* ---------- Start ---------- */
  document.addEventListener("langchange", () => {
    // Översätt synliga meddelanden och uppdatera filtrets statusrad
    invalid.forEach(name => { fields[name].error.textContent = t(fields[name].key); });
    renderSummary();
    if (!ok.hidden) ok.textContent = t("f.ok");
    applyFilter();
  });
  initLang();
  initReveal();
})();
