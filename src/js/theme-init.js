// Runs in <head> before the page paints, so the chosen theme never flashes.
(function () {
  var theme = null;
  try { theme = window.localStorage.getItem("theme"); } catch (e) { /* storage blocked */ }
  if (theme !== "dark" && theme !== "light") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.classList.add("theme-" + theme);
})();
