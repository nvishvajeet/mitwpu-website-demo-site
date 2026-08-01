(function () {
  "use strict";

  // Where the RAG service lives. Production default is the Caddy-routed mini
  // endpoint: the static page fetches the answer cross-origin and the mini's
  // rag_server sends the CORS headers locked to this site's origin. For local
  // development, override it by defining
  // window.__RAG_ENDPOINT__ = "http://127.0.0.1:8787" before this script loads
  // (see the comment in index.html).
  var RAG_ENDPOINT = String(window.__RAG_ENDPOINT__ || "https://ask.vishwanathgrid.org")
    .replace(/\/+$/, "");

  var form = document.getElementById("ask-form");
  var input = document.getElementById("ask-query");
  var button = document.getElementById("ask-submit");
  var status = document.getElementById("ask-status");
  var skeleton = document.getElementById("ask-skeleton");
  var answer = document.getElementById("ask-answer");
  var answerText = document.getElementById("ask-answer-text");
  var sources = document.getElementById("ask-sources");
  var sourcesList = document.getElementById("ask-sources-list");
  var errorBox = document.getElementById("ask-error");

  var inFlight = null;

  function setBusy(busy) {
    button.disabled = busy;
    button.setAttribute("aria-busy", busy ? "true" : "false");
    status.setAttribute("data-busy", busy ? "true" : "false");
  }

  function clearResults() {
    answer.hidden = true;
    errorBox.hidden = true;
    sources.hidden = true;
    if (skeleton) skeleton.hidden = true;
    sourcesList.replaceChildren();
    answerText.textContent = "";
  }

  function renderSources(list) {
    sourcesList.replaceChildren();
    (list || []).forEach(function (source) {
      if (!source || !source.route) return;
      var li = document.createElement("li");
      var link = document.createElement("a");
      // Routes come from the index (server side), so they are always real
      // pages — never parsed from the model's prose. Render them verbatim.
      link.href = source.route;
      link.textContent = source.title || source.route;
      li.append(link);
      sourcesList.append(li);
    });
    sources.hidden = sourcesList.childElementCount === 0;
  }

  function renderAnswer(data) {
    clearResults();
    answerText.textContent = data.answer || "";
    renderSources(data.sources);
    answer.hidden = false;

    var count = (data.sources || []).length;
    if (data.matched) {
      status.textContent = count === 1 ? "1 source" : count + " sources";
    } else {
      status.textContent = "No matching page — see the sitemap";
    }
    // Move focus to the answer so assistive tech lands on the result.
    answer.focus({ preventScroll: false });
  }

  function ask(query) {
    if (inFlight) inFlight.abort();
    var controller = new AbortController();
    inFlight = controller;

    setBusy(true);
    clearResults();
    // Draw the answer card's shape while the service thinks, so the wait reads
    // as the answer arriving rather than as nothing happening.
    if (skeleton) skeleton.hidden = false;
    status.textContent = "Searching the website";

    fetch(RAG_ENDPOINT + "/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query }),
      signal: controller.signal
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Service returned " + response.status);
        return response.json();
      })
      .then(function (data) {
        renderAnswer(data);
      })
      .catch(function (err) {
        if (err && err.name === "AbortError") return;
        console.error(err);
        clearResults();
        status.textContent = "The assistant is unavailable";
        errorBox.hidden = false;
      })
      .finally(function () {
        if (inFlight === controller) inFlight = null;
        setBusy(false);
      });
  }

  function submitQuery(query) {
    var trimmed = String(query || "").trim();
    if (!trimmed) {
      input.focus();
      return;
    }
    input.value = trimmed;
    ask(trimmed);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    submitQuery(input.value);
  });

  document.querySelectorAll(".ask-example").forEach(function (chip) {
    chip.addEventListener("click", function () {
      submitQuery(chip.textContent);
    });
  });
})();
