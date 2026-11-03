// Applies the colour scheme before the first paint (same rule as src/lib/theme.ts): a stored choice wins,
// otherwise the system setting, and dark when the browser cannot tell.
try {
  const saved = localStorage.getItem("nodestro-theme");
  const light = saved === "light" || (saved !== "dark" && window.matchMedia("(prefers-color-scheme: light)").matches);
  document.documentElement.dataset.theme = light ? "light" : "dark";
} catch (_) {
  document.documentElement.dataset.theme = "dark";
}
