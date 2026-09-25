const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";

function switchAuthTab(tab) {
  const pwdSection = document.getElementById("password-signup-section");
  const otpSection = document.getElementById("otp-signup-section");
  const tabPwd = document.getElementById("tab-password");
  const tabOtp = document.getElementById("tab-otp");

  if (tab === "otp") {
    pwdSection.style.display = "none";
    otpSection.style.display = "block";
    tabPwd.className = "btn secondary";
    tabOtp.className = "btn";
  } else {
    pwdSection.style.display = "block";
    otpSection.style.display = "none";
    tabPwd.className = "btn";
    tabOtp.className = "btn secondary";
  }
}

async function requestSignupOtp() {
  const email = document.getElementById("otpEmail").value.trim();
  const errEl = document.getElementById("otpErr");
  const btn = document.getElementById("btnSendOtp");

  if (!email) {
    if (errEl) errEl.textContent = "Please enter your Gmail address";
    return;
  }
  if (errEl) errEl.textContent = "";

  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Sending code to Gmail...";

  try {
    const res = await fetch(`${API}/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (errEl) errEl.textContent = data.error || "Failed to send OTP";
      return;
    }

    document.getElementById("otpInputStep").style.display = "block";
    if (data.demoCode) {
      alert(`[OTP Code]: ${data.demoCode}\n\nEnter this code below to create account!`);
      document.getElementById("signupOtpCode").value = data.demoCode;
    } else {
      alert(`A 6-digit OTP code has been sent to ${email}. Please check your inbox.`);
    }
  } catch (err) {
    console.error("OTP send error:", err);
    if (errEl) errEl.textContent = "Connection error. Please try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

async function verifyOtpAndSignup() {
  const name = document.getElementById("otpName").value.trim();
  const email = document.getElementById("otpEmail").value.trim();
  const otp = document.getElementById("signupOtpCode").value.trim();
  const errEl = document.getElementById("otpErr");

  if (!email || !otp) {
    if (errEl) errEl.textContent = "Please enter both Gmail and the 6-digit OTP";
    return;
  }
  if (errEl) errEl.textContent = "";

  try {
    const res = await fetch(`${API}/auth/otp-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, name: name || email.split("@")[0] }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (errEl) errEl.textContent = data.error || "Incorrect or expired OTP";
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));
    window.location.href = "cashbooks.html";
  } catch (err) {
    console.error("OTP verify error:", err);
    if (errEl) errEl.textContent = "Connection error. Please try again.";
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

