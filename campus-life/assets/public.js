(() => {
  const root = document.documentElement;
  const toggle = document.querySelector("[data-theme-toggle]");
  const stored = localStorage.getItem("mitwpu-theme");

  if (stored === "light" || stored === "dark") root.dataset.theme = stored;

  toggle?.addEventListener("click", () => {
    const current =
      root.dataset.theme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("mitwpu-theme", next);
  });

  const back = document.querySelector("[data-context-back]");
  if (back && document.referrer) {
    const referrer = new URL(document.referrer);
    if (referrer.origin === window.location.origin && referrer.pathname !== window.location.pathname) {
      back.addEventListener("click", (event) => {
        event.preventDefault();
        history.back();
      });
      const label = referrer.pathname.startsWith("/academics/")
        ? " Back to academic unit"
        : " Back";
      back.lastChild.textContent = label;
    }
  }
})();
