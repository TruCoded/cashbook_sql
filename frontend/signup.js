// signup.js - registers a new user, then sends them to log in
const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000"
  ? "http://localhost:5000/api"
  : "https://cashbook-sql.onrender.com/api";

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
  const res = await fetch(`${API}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: response.credential }),
  });
  if (!res.ok) {
    document.getElementById("err").textContent = "Google sign-in failed";
    return;
  }
  const user = await res.json();
  localStorage.setItem("user", JSON.stringify(user));
  window.location.href = "cashbooks.html"; // signed up AND logged in, straight to the app
}

async function signup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    document.getElementById("err").textContent = error || "Could not sign up";
    return;
  }

  window.location.href = "login.html"; // account created, sign in next
}
