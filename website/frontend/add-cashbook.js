const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "login.html";

async function createCashbook() {
  const name = document.getElementById("name").value.trim();
  const partnerName = document.getElementById("partnerName").value.trim();
  const partnerEmail = document.getElementById("partnerEmail").value.trim();
  const errEl = document.getElementById("err");
  const btn = document.querySelector(".btn.full");

  if (!name) {
    if (errEl) errEl.textContent = "Please enter a cashbook name";
    return;
  }

  const originalBtnText = btn ? btn.textContent : "Create Cashbook";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Creating cashbook...";
  }
  if (errEl) errEl.textContent = "";

  try {
    const res = await fetch(`${API}/cashbooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, partnerName, partnerEmail, ownerId: user.id }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (errEl) errEl.textContent = errData.error || "Could not create cashbook";
      return;
    }

    // Invalidate local list cache so new cashbook shows immediately
    sessionStorage.removeItem(`cashbooks_${user.id}`);
    window.location.href = "cashbooks.html"; // done -> back to the list
  } catch (err) {

    console.error("Create cashbook error:", err);
    if (errEl) errEl.textContent = "Could not connect to server. Please try again in a moment.";
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalBtnText;
    }
  }
}

