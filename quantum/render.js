/* Turn quantum/data.js into the page bodies, using university-web-patterns.
 *
 * The page shell (skip link, institution bar, masthead, breadcrumbs, footer)
 * is not rendered here — quantum/shell.mjs writes it into the HTML at build
 * time from the same package. This file fills the parts of the page that only
 * exist once the data is in hand.
 *
 * Load order, all classic deferred scripts, which run after parsing in
 * document order:
 *
 *     ../vendor/university-web-patterns/src/js/render.js   defines uwp
 *     patterns.templates.js                                registers templates
 *     data.js                                              window.QUANTUM_GROUP
 *     render.js                                            this file
 *
 * Templates are never fetched (PROPAGATION_MODEL §2); patterns.templates.js is
 * emitted from the vendored copy at build time. See quantum/shell.mjs for the
 * command and the list of ids.
 */
(function () {
  "use strict";

  const uwp = window.uwp;
  if (!uwp || typeof uwp.render !== "function") {
    throw new Error(
      "university-web-patterns render.js and patterns.templates.js must load " +
        "before quantum/render.js",
    );
  }

  const group = window.RESEARCH_GROUP || window.QUANTUM_GROUP || {
    meta: {},
    people: [],
    researchAreas: []
  };
  const groupMeta = {
    name: group.meta?.name || "Quantum Science & Technology Group",
    shortName: group.meta?.shortName || "Quantum group"
  };
  const peopleOrder = window.MITWPU_PEOPLE_ORDER || {
    groupMembers: (a, b) => String(a.name).localeCompare(String(b.name), "en-IN"),
    displayName: (person) => String(person.name || "")
  };
  const orderedPeople = group.people.slice().sort(peopleOrder.groupMembers);
  const peopleLabels = {
    faculty: "Faculty",
    "postdoctoral-researcher": "Postdoctoral researcher",
    "doctoral-researcher": "PhD scholar",
    student: "Student",
    "technical-staff": "Technical staff"
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    })[character]);
  }

  function safeUrl(value) {
    if (typeof value !== "string" || value.trim() === "") return "";
    try {
      const url = new URL(value.trim(), window.location.href);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function profileUrl(person) {
    const slug = String(person.profileSlug || "");
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return `../people/${encodeURIComponent(slug)}/`;
    }
    return "../people/";
  }

  function initials(name) {
    const ignored = new Set(["dr", "prof", "mr", "mrs", "ms"]);
    return String(name).replace(/[.]/g, "").split(/\s+/)
      .filter((part) => part && !ignored.has(part.toLowerCase()))
      .slice(0, 2).map((part) => part[0].toUpperCase()).join("");
  }

  /* -- package components ------------------------------------------------ */

  /* portrait.html renders the photograph or, when there is none, the lettered
   * tile that occupies the same box — which is what this site hand-wrote as
   * .member-portrait and .portrait-placeholder. Note the alt text: the package
   * leaves it empty in both forms, because the person's name is always beside
   * the picture. This site used alt="{name}", so screen-reader users heard
   * every name twice on the people page. */
  function portrait(person, size) {
    return uwp.render("portrait", {
      portrait: {
        src: safeUrl(person.photo),
        initials: initials(peopleOrder.displayName(person)),
        /* --md is 126x126, which is the size .member-portrait was; --lg is
         * 192x240 for the record page. At most one of the two, per the
         * template's own note. */
        medium: size === "medium",
        large: size === "large"
      },
      portrait_loading: uwp.markup(' loading="lazy"')
    });
  }

  function specificRole(person) {
    return /^(?:faculty|member faculty|group member)$/i.test(person.groupRole || "")
      ? ""
      : person.groupRole;
  }

  function tagRow(items, className) {
    if (!items || items.length === 0) return "";
    return uwp.markup(
      `<div class="${className}">`
      + items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")
      + "</div>"
    );
  }

  function personCard(person) {
    return uwp.render("person-card", {
      person: {
        display_name: peopleOrder.displayName(person),
        url: profileUrl(person),
        flair: [peopleLabels[person.memberType] || "Group member"],
        role: specificRole(person),
        unit: [person.designation, person.affiliation].filter(Boolean).join(" · "),
        summary: tagRow((person.interests || []).slice(0, 3), "tag-row")
      },
      person_portrait: portrait(person, "medium")
    });
  }

  const linkLabels = {
    website: "Website",
    profile: "Official profile",
    research: "Research profile",
    scholar: "Google Scholar",
    scopus: "Scopus",
    orcid: "ORCID",
    dblp: "DBLP",
    publication: "Selected publication"
  };

  const linkIcons = {
    website: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.7 5.7 3.7 9S14.5 18.3 12 21c-2.5-2.7-3.7-5.7-3.7-9S9.5 5.7 12 3Z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-4.2 3.2-6.3 7.5-6.3s6.8 2.1 7.5 6.3"/></svg>`,
    research: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 3h6M10 3v6l-5.2 9A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7.2 16h9.6"/></svg>`,
    scholar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 12.2V17c2.8 2.2 7.2 2.2 10 0v-4.8M21 9v6"/></svg>`,
    scopus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
    orcid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="8" r=".8" fill="currentColor" stroke="none"/><path d="M9 11v6M12 17v-6h1.5c2 0 3.5 1.1 3.5 3s-1.5 3-3.5 3H12Z"/></svg>`,
    dblp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 5h6v14H5zM13 8h6v11h-6z"/></svg>`,
    publication: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 12h6M9 16h6"/></svg>`
  };

  function profileLinkItems(person) {
    return Object.entries(person.links || {}).map(([key, value]) => {
      const href = safeUrl(value);
      if (!href || !linkLabels[key]) return null;
      return { key, href, label: linkLabels[key], external: true };
    }).filter(Boolean);
  }

  /* The icons are this site's own, and profile-links.html has no slot for
   * them: `items` is {label, href, external} and the label is escaped text.
   * They stay in the local markup below rather than being forced through the
   * package, which is the right side of PROPAGATION_MODEL §7 — but it does
   * mean the publications page keeps a hand-written link row. */
  function profileLinkRow(person) {
    const items = profileLinkItems(person);
    if (items.length === 0) return "";
    return uwp.markup(
      '<div class="profile-link-row">'
      + items.map((item) =>
        `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">`
        + `${linkIcons[item.key] || linkIcons.website}<span>${escapeHtml(item.label)}</span></a>`
      ).join("")
      + "</div>"
    );
  }

  function publicationItem(publication) {
    if (typeof publication === "string") return `<li>${escapeHtml(publication)}</li>`;
    const href = safeUrl(publication?.url || "");
    const title = escapeHtml(publication?.title || "");
    /* uwp-publications__meta is the one class publication-list asks a client
     * to write; the citation itself stays the client's to format. */
    const citation = publication?.citation
      ? `<span class="uwp-publications__meta publication-meta">${escapeHtml(publication.citation)}</span>`
      : "";
    return `<li>${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${title}</a>` : title}${citation}</li>`;
  }

  function publicationItems(items) {
    return uwp.markup((items || []).map(publicationItem).join(""));
  }

  /* -- page bodies ------------------------------------------------------- */

  /* No package component covers a numbered research theme: project-card is
   * about a piece of funded work with people and dates on it, and
   * research-group-card is a card for a whole group. These stay local. */
  function researchCard(area) {
    return `<article class="theme-card">
      <span class="theme-number">${escapeHtml(area.number)}</span>
      <h3>${escapeHtml(area.title)}</h3>
      <p>${escapeHtml(area.summary)}</p>
    </article>`;
  }

  function renderResearch() {
    const summaryTarget = document.getElementById("research-areas");
    if (summaryTarget) {
      summaryTarget.innerHTML = group.researchAreas.map(researchCard).join("");
    }
    const listTarget = document.getElementById("research-list");
    if (listTarget) {
      listTarget.innerHTML = group.researchAreas.map((area) => `
        <article class="research-block">
          <div class="research-index">${escapeHtml(area.number)}</div>
          <div class="research-copy">
            <h2>${escapeHtml(area.title)}</h2>
            <p>${escapeHtml(area.summary)}</p>
            <ul class="topic-list topic-list-wide">${(area.topics || []).map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")}</ul>
          </div>
        </article>`).join("");
    }
  }

  function renderFeaturedMembers() {
    const target = document.getElementById("featured-members");
    if (target) {
      target.innerHTML = uwp.join(orderedPeople.slice(0, 3).map(personCard));
    }
  }

  function renderPeople() {
    const target = document.getElementById("people-list");
    if (!target) return;
    target.innerHTML = uwp.join(orderedPeople.map(personCard));
    const count = document.getElementById("people-count");
    if (count) count.textContent = `${orderedPeople.length} ${orderedPeople.length === 1 ? "member" : "members"}`;
  }

  function profileSection(id, title, options) {
    const settings = options || {};
    const hasBody = settings.body && String(settings.body).length > 0;
    const hasProse = (settings.paragraphs || []).length > 0;
    if (!hasBody && !hasProse) return "";
    return uwp.render("profile-section", {
      section: { title, heading_id: id, paragraphs: settings.paragraphs || [] },
      section_body: settings.body || ""
    });
  }

  function renderMember() {
    const target = document.getElementById("member-profile");
    if (!target) return;
    const id = new URLSearchParams(window.location.search).get("id");
    const person = group.people.find((item) => item.id === id);
    if (!person) {
      /* not-found.html is the whole <main> region, so it cannot be dropped
       * into a container that already sits inside one. This stays local. */
      target.innerHTML = `<section class="section"><div class="shell empty-state"><p class="eyebrow">Profile not found</p><h1>We could not find that group member.</h1><a class="button button-primary" href="people.html">Return to people</a></div></section>`;
      return;
    }

    const name = peopleOrder.displayName(person);
    document.title = `${name} · ${groupMeta.name} · MIT-WPU`;

    const sections = [
      profileSection("profile-bio", "Profile", {
        paragraphs: person.bio ? [person.bio] : []
      }),
      profileSection("profile-interests", "Research interests", {
        body: tagRow(person.interests, "tag-row tag-row-large")
      }),
      profileSection("profile-education", "Education", {
        body: (person.qualifications || []).length
          ? uwp.render("profile-detail-list", {
            details: { items: person.qualifications }
          })
          : ""
      }),
      profileSection("profile-background", "Selected background", {
        body: (person.highlights || []).length
          ? uwp.render("profile-detail-list", { details: { items: person.highlights } })
          : ""
      }),
      (person.publications || []).length
        ? uwp.render("publication-list", {
          publications: {
            title: person.publicationHeading || "Selected publications",
            heading_id: "profile-publications"
          },
          publication_items: publicationItems(person.publications)
        })
        : ""
    ];

    const contactItems = [];
    if (person.email) {
      contactItems.push({ label: person.email, href: `mailto:${person.email}` });
    }
    const sidebar = [
      contactItems.length
        ? uwp.render("profile-links", {
          links: {
            title: "Contact",
            heading_id: "profile-contact",
            items: contactItems
          }
        })
        : "",
      profileLinkItems(person).length
        ? uwp.render("profile-links", {
          links: {
            title: "Profiles",
            heading_id: "profile-external",
            items: profileLinkItems(person)
          }
        })
        : ""
    ];

    target.innerHTML = uwp.render("profile", {
      person: {
        display_name: name,
        role: [person.designation, person.affiliation].filter(Boolean).join(" · ")
      },
      profile: { panel: true },
      person_portrait: portrait(person, "large"),
      profile_sections: uwp.join(sections),
      profile_sidebar: uwp.join(sidebar)
    });
  }

  /* Not migrated. publication-group.html carries {title, url, meta} and the
   * two citation slots, and nothing else: there is no slot in the person
   * column for the author's external research profiles. On this page those
   * links are the entire reason a person with no selected publications
   * appears at all, so routing this through the package would either drop
   * them or move them below the citations. Reported rather than forced. */
  function renderPublications() {
    const target = document.getElementById("publications-list");
    if (!target) return;
    const scholarlyProfiles = ["scholar", "scopus", "orcid", "research", "publication"];
    target.innerHTML = group.people
      .filter((person) =>
        (person.publications || []).length
        || scholarlyProfiles.some((key) => person.links?.[key]))
      .map((person) => {
        const hasSelectedPublications = (person.publications || []).length > 0;
        return `<section class="publication-group">
        <div class="publication-person">
          <p class="eyebrow">${escapeHtml(
            hasSelectedPublications
              ? (person.publicationHeading || "Selected publications")
              : "Research profiles",
          )}</p>
          <h2><a href="${profileUrl(person)}">${escapeHtml(peopleOrder.displayName(person))}</a></h2>
          ${profileLinkRow(person)}
        </div>
        ${hasSelectedPublications
          ? `<ol class="publication-list numbered">${(person.publications || []).map(publicationItem).join("")}</ol>`
          : ""}
      </section>`;
      }).join("");
  }

  function renderContacts() {
    const target = document.getElementById("contact-list");
    if (!target) return;
    const contacts = group.people.filter((person) => person.email);
    const visiblePeople = contacts.length ? contacts : group.people;
    target.innerHTML = uwp.join(visiblePeople.map((person) => uwp.render("person-card", {
      person: {
        display_name: peopleOrder.displayName(person),
        url: profileUrl(person),
        role: [person.groupRole, person.designation].filter(Boolean).join(" · "),
        summary: uwp.markup(person.email
          ? `<p><a href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.email)}</a></p>`
          : `<p><a href="${profileUrl(person)}">View university profile</a></p>`)
      },
      /* No photograph on this page by design: the lettered tile is the whole
       * treatment, which portrait.html renders when src is absent. */
      person_portrait: uwp.render("portrait", {
        portrait: { initials: initials(peopleOrder.displayName(person)) }
      })
    })));
  }

  function initialize() {
    /* aria-current on the primary navigation is set by shell.mjs at build
     * time now, through nav-item's own slot, so there is nothing to mark up
     * here and nothing that depends on JavaScript being on. */
    document.querySelectorAll("[data-current-year]").forEach((node) => {
      node.textContent = new Date().getFullYear();
    });
    renderResearch();
    renderFeaturedMembers();
    renderPeople();
    renderMember();
    renderPublications();
    renderContacts();
    if (window.location.hash) {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) {
        window.requestAnimationFrame(() => {
          target.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "start"
          });
        });
      }
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
