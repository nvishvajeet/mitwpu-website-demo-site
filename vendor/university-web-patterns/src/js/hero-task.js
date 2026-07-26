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
      if (!value || value.charAt(0) !== "/") { return; }
      event.preventDefault();
      window.location.href = value;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.forEach.call(document.querySelectorAll("[data-uwp-jump]"), wire);
  });
})();
