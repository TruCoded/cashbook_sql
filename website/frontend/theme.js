// theme.js - Manages Dark Mode (Default) and Light Mode
(function () {
  const savedTheme = localStorage.getItem("cashbook_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("cashbook_theme", next);
    updateThemeIcon(next);
  };

  function updateThemeIcon(theme) {
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.innerHTML = theme === "dark" ? "☀️" : "🌙";
      btn.setAttribute("title", theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode");
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    updateThemeIcon(current);
  });
})();
