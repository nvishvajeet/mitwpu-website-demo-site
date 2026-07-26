/* Client-side filtering of a rendered directory. Enhancement only: the
   directory is a complete list in the markup and stays complete without this.

   Rows are hidden by setting the `hidden` property, which depends on the
   `[hidden] { display: none !important }` rule in patterns.css. Component
   rules set display: flex/grid on these same elements and out-specify a bare
   attribute selector, so a directory whose page loads this script without
   patterns.css filters nothing while cheerfully reporting a lower count.

   Facet values are read from data-* attributes the component's own
   `*_attributes` slot wrote, and compared lower-cased after splitting on
   commas, because a person legitimately belongs to several groups. The
   "query" field is the exception: it matches the row's whole text, which is
   what a visitor typing a surname expects and what makes it useless as a
   facet name — do not add a facet called query.

   Like every enhancement script here, it wires once at load and observes
   nothing after: rows inserted later are not filtered. */
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
