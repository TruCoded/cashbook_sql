const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";

async function signup() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errEl = document.getElementById("err");
  const btn = document.querySelector(".btn.full");

  if (!name || !email || !password) {
    if (errEl) errEl.textContent = "Please fill in all fields";
    return;
  }

  const originalBtnText = btn ? btn.textContent : "Sign Up";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Creating account...";
  }
  if (errEl) errEl.textContent = "";

  const slowTimer = setTimeout(() => {
    if (btn) btn.textContent = "Waking up server (free tier delay)...";
  }, 4000);

  try {
    const res = await fetch(`${API}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    clearTimeout(slowTimer);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (errEl) errEl.textContent = data.error || "Could not sign up";
      return;
    }

    window.location.href = "login.html"; // account created, sign in next
  } catch (err) {
    clearTimeout(slowTimer);
    console.error("Signup error:", err);
    if (errEl) errEl.textContent = "Cannot connect to server. If Render was sleeping, please wait a moment and try again.";
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalBtnText;
    }
  }
}

