const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errEl = document.getElementById("err");
  const btn = document.querySelector(".btn.full");

  if (!email || !password) {
    if (errEl) errEl.textContent = "Please enter both email and password";
    return;
  }

  const originalBtnText = btn ? btn.textContent : "Sign In";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Connecting to server...";
  }
  if (errEl) errEl.textContent = "";

  const slowTimer = setTimeout(() => {
    if (btn) btn.textContent = "Waking up server (free tier delay)...";
  }, 4000);

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    clearTimeout(slowTimer);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (errEl) errEl.textContent = data.error || "Invalid email or password";
      return;
    }

    const user = await res.json(); // { id, name, email }
    localStorage.setItem("user", JSON.stringify(user));
    window.location.href = "cashbooks.html";
  } catch (err) {
    clearTimeout(slowTimer);
    console.error("Login fetch error:", err);
    if (errEl) errEl.textContent = "Cannot connect to backend server. If Render was sleeping, please wait a moment and try again.";
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalBtnText;
    }
  }
}

