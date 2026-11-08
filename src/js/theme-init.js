// Runs in <head> before the page paints, so the chosen theme never flashes.
(function () {
  var root = document.documentElement;
  var theme = null;
  try { theme = window.localStorage.getItem("theme"); } catch (e) { /* storage blocked */ }
  if (theme !== "dark" && theme !== "light") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  root.classList.add("theme-" + theme);
  // Entrance animations only for people who did not ask to reduce motion
  if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    root.classList.add("motion");
  }
})();
