(function () {
  "use strict";

  const collator = new Intl.Collator("en-IN", {
    sensitivity: "base",
    numeric: true
  });

  function normalized(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("en-IN")
      .replace(/[&/(),.-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function surname(person) {
    const parts = normalized(person && person.name)
      .replace(/^(professor|prof|doctor|dr|mr|mrs|ms)\s+/, "")
      .split(" ")
      .filter(Boolean);
    return parts.at(-1) || "";
  }

  function academicRank(person) {
    const title = normalized(`${person && person.designation} ${person && person.role}`);
    if (/\b(dean|vice chancellor|pro vice chancellor)\b/.test(title)) return 0;
    if (/\b(head of department|department head|hod)\b/.test(title)) return 1;
    if (/\b(programme|program) director\b/.test(title)) return 2;
    if (/\b(programme|program) (coordinator|head)\b/.test(title)) return 3;
    if (/\bdirector\b/.test(title)) return 3;
    if (/\b(distinguished professor|professor emeritus|emeritus professor)\b/.test(title)) return 4;
    if (/\bprofessor of practice\b/.test(title)) return 6;
    if (/\bassociate professor\b/.test(title)) return 7;
    if (/\bassistant professor\b/.test(title)) return 8;
    if (/\bprofessor\b/.test(title)) return 5;
    if (/\b(adjunct|visiting)\b/.test(title)) return 9;
    if (/\b(lecturer|instructor)\b/.test(title)) return 10;
    return 11;
  }

  function displayName(person) {
    const source = String(person && person.name || "").trim();
    const preferred = String(person && person.preferredDisplayName || "").trim();
    const displaySource = preferred || source;
    const bareName = displaySource
      .replace(/^(?:prof(?:essor)?\.?\s+dr\.?|prof(?:essor)?|dr|mr|mrs|ms)\.?\s+/i, "")
      .trim();
    if (!bareName) return source;
    if (/^vishwanath\s+(?:d\.?\s+)?karad$/i.test(bareName)) {
      return `Prof. Dr. ${bareName}`;
    }

    const role = normalized(`${person && person.designation} ${person && person.role}`);
    const academicRole = /\b(professor|lecturer|instructor|faculty|dean|vice chancellor)\b/.test(role);
    const education = Array.isArray(person && person.education) ? person.education : [];
    const qualifications = Array.isArray(person && person.qualifications) ? person.qualifications : [];
    const degreeEvidence = [source, ...education, ...qualifications].join(" ");
    if (
      /^(?:prof(?:essor)?\.?\s+)?dr\.?\s+/i.test(source)
      || /\b(?:ph\.?\s*d\.?|d\.?\s*phil\.?|doctor(?:ate|al))\b/i.test(degreeEvidence)
    ) {
      return `Dr. ${bareName}`;
    }
    if (academicRole || /^prof(?:essor)?\.?\s+/i.test(displaySource)) {
      return `Prof. ${bareName}`;
    }
    const staffTitle = displaySource.match(/^(mr|mrs|ms)\.?\s+/i)?.[1];
    return staffTitle
      ? `${staffTitle.charAt(0).toUpperCase()}${staffTitle.slice(1).toLowerCase()}. ${bareName}`
      : bareName;
  }

  function groupRank(person) {
    const role = normalized(person && (person.groupRole || person.role));
    if (/\bprincipal investigator\b/.test(role) && !/\bco principal\b/.test(role)) return 0;
    if (/\b(co principal investigator|co pi)\b/.test(role)) return 1;
    if (/\b(group|research) (lead|director|head)\b/.test(role)) return 2;
    if (/\b(administrative|institutional advisor|administration)\b/.test(role)) return 50;
    if (/\bmember faculty\b/.test(role) || person.memberType === "faculty") return 10;
    if (person.memberType === "postdoctoral-researcher") return 20;
    if (person.memberType === "doctoral-researcher") return 30;
    if (person.memberType === "technical-staff") return 40;
    if (person.memberType === "student") return 60;
    return 55;
  }

  function bySurname(a, b) {
    return collator.compare(surname(a), surname(b))
      || collator.compare(normalized(a && a.name), normalized(b && b.name));
  }

  function faculty(a, b) {
    return academicRank(a) - academicRank(b) || bySurname(a, b);
  }

  function groupMembers(a, b) {
    const explicitA = Number(a && a.groupOrder);
    const explicitB = Number(b && b.groupOrder);
    if (Number.isFinite(explicitA) || Number.isFinite(explicitB)) {
      const rankA = Number.isFinite(explicitA) ? explicitA : groupRank(a);
      const rankB = Number.isFinite(explicitB) ? explicitB : groupRank(b);
      if (rankA !== rankB) return rankA - rankB;
    }

    return groupRank(a) - groupRank(b)
      || academicRank(a) - academicRank(b)
      || bySurname(a, b);
  }

  window.MITWPU_PEOPLE_ORDER = {
    academicRank,
    bySurname,
    displayName,
    faculty,
    groupMembers,
    groupRank,
    surname
  };
})();
