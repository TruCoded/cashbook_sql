// theme.js - Manages Dark Mode (Default) and Light Mode
(function () {
  const savedTheme = localStorage.getItem("cashbook_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("cashbook_theme", next);
    updateThemeIcons(next);
    updateLogos(next);
  };

  function updateThemeIcons(theme) {
    const buttons = document.querySelectorAll(".theme-toggle-btn");
    buttons.forEach((btn) => {
      btn.innerHTML = theme === "dark" ? "☀️" : "🌙";
      btn.setAttribute("title", theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode");
    });
  }

  function updateLogos(theme) {
    const logos = document.querySelectorAll(".brand-logo-img, .logo-img");
    const targetSrc = theme === "dark" ? "logo-dark.png" : "logo.png";
    logos.forEach((img) => {
      if (!img.src.endsWith(targetSrc)) {
        img.src = targetSrc;
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    updateThemeIcons(current);
    updateLogos(current);
  });
})();
