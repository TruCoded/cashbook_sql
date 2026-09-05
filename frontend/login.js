const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000"
  ? "http://localhost:5000/api"
  : "https://cashbook-sql.onrender.com/api";

// ---- Google Sign-In (Gmail OAuth) ----
// Paste your OAuth Client ID here (Google Cloud Console -> Credentials).
// Must match the GOOGLE_CLIENT_ID set in backend/.env. See README ->
// "Enabling Gmail Sign-In (Google OAuth)" for the full setup steps.
// Left as-is (not a real ID), the Google button below simply stays hidden
// and the normal email/password form keeps working exactly as before.
const GOOGLE_CLIENT_ID = "917414479648-g29oij57cklpb9kpuka4pgla7rnu6kkn.apps.googleusercontent.com";

window.onload = () => {
  if (!window.google || GOOGLE_CLIENT_ID.startsWith("YOUR_")) return; // not configured yet
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleSignIn });
  google.accounts.id.renderButton(document.getElementById("google-btn"), { theme: "outline", size: "large", width: 280 });
};

// Google calls this with a signed token proving which Gmail account was picked.
// We hand that straight to the backend - any real Gmail address works, even one
// that has never signed up before (the backend creates the account on the spot).
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
  window.location.href = "cashbooks.html";
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    document.getElementById("err").textContent = "Invalid email or password";
    return;
  }

  const user = await res.json(); // { id, name, email }
  localStorage.setItem("user", JSON.stringify(user)); // "Apna naam ana chahiye" -> used on next page
  window.location.href = "cashbooks.html";
}
