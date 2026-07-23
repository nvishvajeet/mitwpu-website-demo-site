(() => {
  const form = document.querySelector("[data-sitemap-search]");
  const input = form?.querySelector('input[type="search"]');
  const status = document.querySelector("[data-sitemap-status]");
  const empty = document.querySelector("[data-sitemap-empty]");
  const groups = [...document.querySelectorAll(".sitemap-group")];

  if (!form || !input || !status || !empty || groups.length === 0) return;

  const initialOpen = new Map(groups.map((group) => [group, group.open]));
  const items = groups.flatMap((group) => [
    ...group.querySelectorAll("[data-sitemap-item]"),
  ]);

  function filter() {
    const query = input.value.trim().toLocaleLowerCase();
    let visibleTotal = 0;

    for (const group of groups) {
      let visibleInGroup = 0;
      for (const item of group.querySelectorAll("[data-sitemap-item]")) {
        const visible = !query || item.dataset.search.includes(query);
        item.hidden = !visible;
        if (visible) visibleInGroup += 1;
      }
      group.hidden = visibleInGroup === 0;
      group.open = query ? visibleInGroup > 0 : initialOpen.get(group);
      const count = group.querySelector("[data-group-count]");
      if (count) {
        count.textContent = query
          ? `${visibleInGroup.toLocaleString("en-IN")} matches`
          : `${group.querySelectorAll("[data-sitemap-item]").length.toLocaleString(
              "en-IN",
            )} pages`;
      }
      visibleTotal += visibleInGroup;
    }

    status.textContent = query
      ? `${visibleTotal.toLocaleString("en-IN")} matching ${
          visibleTotal === 1 ? "page" : "pages"
        }`
      : `${items.length.toLocaleString("en-IN")} pages`;
    empty.hidden = visibleTotal !== 0;
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  input.addEventListener("input", filter);
})();
