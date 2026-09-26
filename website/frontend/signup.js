const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";


// ---- Google Sign-In (Gmail OAuth) ----
// Same Client ID as login.js - see README -> "Enabling Gmail Sign-In (Google OAuth)".
// Left as-is (not a real ID), the Google button below simply stays hidden and
// the normal name/email/password form keeps working exactly as before.
const GOOGLE_CLIENT_ID = "917414479648-g29oij57cklpb9kpuka4pgla7rnu6kkn.apps.googleusercontent.com";

window.onload = () => {
  if (!window.google || GOOGLE_CLIENT_ID.startsWith("YOUR_")) return; // not configured yet
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleSignIn });
  google.accounts.id.renderButton(document.getElementById("google-btn"), { theme: "outline", size: "large", width: 280 });
};

// One tap here both creates the account (first time) and logs in (every time
// after) - Google itself already verified the email, so no password is needed.
async function onGoogleSignIn(response) {
  const errEl = document.getElementById("err");
  if (errEl) errEl.textContent = "Verifying with Google...";
  try {
    const res = await fetch(`${API}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      document.getElementById("err").textContent = errData.error || "Google sign-in failed";
      return;
    }
    const user = await res.json();
    localStorage.setItem("user", JSON.stringify(user));
    window.location.href = "cashbooks.html"; // signed up AND logged in, straight to the app
  } catch (err) {
    console.error("Google signup error:", err);
    if (errEl) errEl.textContent = "Could not connect to server. Please wait ~30s if server was sleeping and retry.";
  }
}

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

