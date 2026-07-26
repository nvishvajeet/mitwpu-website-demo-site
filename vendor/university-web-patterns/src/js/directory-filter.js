(() => {
  for (const form of document.querySelectorAll("[data-uwp-filter-form]")) {
    const targetId = form.dataset.uwpFilterTarget;
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) continue;
    const items = [...target.querySelectorAll("[data-uwp-filter-item]")];
    const status = form.querySelector("[data-uwp-filter-status]");

    const apply = () => {
      const values = [...new FormData(form).entries()]
        .map(([name, value]) => [name, String(value).trim().toLocaleLowerCase()])
        .filter(([, value]) => value);
      let visible = 0;

      for (const item of items) {
        const matches = values.every(([name, value]) => {
          if (name === "query") {
            return item.textContent.toLocaleLowerCase().includes(value);
          }
          return String(item.dataset[name] || "")
            .toLocaleLowerCase()
            .split(/\s*,\s*/)
            .includes(value);
        });
        item.hidden = !matches;
        if (matches) visible += 1;
      }
      if (status) status.textContent = `${visible} results`;
    };

    form.addEventListener("input", apply);
    form.addEventListener("reset", () => window.setTimeout(apply));
    apply();
  }
})();
