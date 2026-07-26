/* Upgrade a task-first hero control into a direct jump.

   The form works without this file: it submits to a listing page that can
   filter on the submitted value. With scripting, the chosen value is treated
   as a destination and the visitor skips the intermediate page. */
(function () {
  "use strict";

  function wire(form) {
    var select = form.querySelector("select");
    if (!select) { return; }
    form.addEventListener("submit", function (event) {
      var value = select.value;
      // Root-relative destinations only. The option values come from the
      // client's own data, but this assigns to location.href, so accepting
      // anything else would turn a mis-modelled or externally sourced record
      // into an open redirect off the institution's domain. A value that
      // fails the test is not an error: the form submits normally and the
      // listing page handles it, which is the no-JS path anyway.
      if (!value || value.charAt(0) !== "/") { return; }
      event.preventDefault();
      window.location.href = value;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll("[data-uwp-jump]"), wire);
  });
})();
