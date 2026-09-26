const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";
// URL param first, localStorage as a fallback
const id = new URLSearchParams(location.search).get("id") || localStorage.getItem("lastCashbookId");

// Render cache instantly
const detailCacheKey = `cb_detail_${id}`;
const cachedDetail = sessionStorage.getItem(detailCacheKey);
if (cachedDetail) {
  try {
    const cb = JSON.parse(cachedDetail);
    document.getElementById("title").textContent = cb.name || "Cashbook";
    document.getElementById("cashIn").textContent = "₹" + (cb.cashIn || 0);
    document.getElementById("cashOut").textContent = "₹" + (cb.cashOut || 0);
    document.getElementById("balance").textContent = "₹" + (cb.balance || 0);
  } catch (e) {}
}

async function loadDetail() {
  if (!id) {
    document.getElementById("title").textContent = "No Cashbook Selected";
    return;
  }
  try {
    const res = await fetch(`${API}/cashbooks/${encodeURIComponent(id)}`);
    if (!res.ok) {
      document.getElementById("title").textContent = "Cashbook not found";
      document.getElementById("cashIn").textContent = "-";
      document.getElementById("cashOut").textContent = "-";
      document.getElementById("balance").textContent = "-";
      return;
    }
    const cb = await res.json();
    sessionStorage.setItem(detailCacheKey, JSON.stringify(cb));
    document.getElementById("title").textContent = cb.name;
    document.getElementById("cashIn").textContent = "₹" + (cb.cashIn || 0);
    document.getElementById("cashOut").textContent = "₹" + (cb.cashOut || 0);
    document.getElementById("balance").textContent = "₹" + (cb.balance || 0);
  } catch (err) {
    console.error("Failed to load cashbook detail:", err);
    if (!cachedDetail) {
      document.getElementById("title").textContent = "Error loading cashbook (connecting...)";
    }
  }
}

// Instant optimistic update
async function addTransaction() {
  const type = document.getElementById("txnType").value;
  const amount = document.getElementById("txnAmount").value;
  const note = document.getElementById("txnNote").value;
  if (!amount || isNaN(Number(amount))) {
    alert("Please enter a valid amount");
    return;
  }

  // Clear inputs immediately
  document.getElementById("txnAmount").value = "";
  document.getElementById("txnNote").value = "";

  try {
    const res = await fetch(`${API}/cashbooks/${encodeURIComponent(id)}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount, note }),
    });
    if (!res.ok) {
      alert("Could not add entry. Please check connection and try again.");
      loadDetail();
      return;
    }
    const data = await res.json();
    if (data.success && data.balance !== undefined) {
      // Instant DOM update with exact server calculation (0ms second fetch!)
      document.getElementById("cashIn").textContent = "₹" + data.cashIn;
      document.getElementById("cashOut").textContent = "₹" + data.cashOut;
      document.getElementById("balance").textContent = "₹" + data.balance;
      
      const cached = sessionStorage.getItem(detailCacheKey);
      if (cached) {
        try {
          const cb = JSON.parse(cached);
          cb.cashIn = data.cashIn;
          cb.cashOut = data.cashOut;
          cb.balance = data.balance;
          sessionStorage.setItem(detailCacheKey, JSON.stringify(cb));
        } catch (e) {}
      }
    } else {
      loadDetail();
    }
  } catch (err) {
    console.error("Add transaction error:", err);
    alert("Connection error. If Render is waking up, please retry in a few seconds.");
  }
}


// --- collaborator flow: request OTP -> verify OTP + bank details -> add ---
let invitation = null;
let sendingOtp = false;
let verifyingOtp = false;
function invitationHeaders() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return { "Content-Type": "application/json", Authorization: `Bearer ${user.token || ""}` };
}
document.getElementById("collabEmail").addEventListener("input", () => {
  invitation = null;
  document.getElementById("otpCode").value = "";
  document.getElementById("otpStep").style.display = "none";
  document.getElementById("otpStatus").textContent = "";
  document.getElementById("collabErr").textContent = "";
});
async function requestOtp() {
  if (sendingOtp || verifyingOtp) return;
  const input = document.getElementById("collabEmail");
  const email = input.value.trim().toLowerCase();
  const error = document.getElementById("collabErr");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !input.checkValidity()) {
    error.textContent = "Enter a valid email address, for example name@gmail.com.";
    return;
  }
  sendingOtp = true;
  invitation = null;
  input.disabled = true;
  document.getElementById("sendOtpBtn").disabled = true;
  document.getElementById("otpStep").style.display = "none";
  document.getElementById("otpCode").value = "";
  document.getElementById("otpStatus").textContent = "Sending invitation...";
  error.textContent = "";
  try {
    const res = await fetch(`${API}/otp/request`, {
      method: "POST",
      headers: invitationHeaders(),
      body: JSON.stringify({ email, cashbookId: id }),
    });
    const data = await res.json();
    if (!res.ok || data.sent !== true || !data.invitationId) throw new Error(data.error || "The invitation could not be sent.");
    invitation = { email: data.email, id: data.invitationId };
    input.value = data.email;
    document.getElementById("otpStatus").textContent = `Invitation sent to ${data.email}. The code expires in 10 minutes. Check Spam if needed. You can resend after 60 seconds.`;
    document.getElementById("sendOtpBtn").textContent = "Resend invitation & OTP";
    document.getElementById("otpStep").style.display = "block";
    document.getElementById("otpCode").focus();
  } catch (err) {
    document.getElementById("otpStatus").textContent = "";
    error.textContent = err.message || "Connection error sending invitation. Please retry.";
  } finally {
    sendingOtp = false;
    input.disabled = false;
    document.getElementById("sendOtpBtn").disabled = false;
  }
}

async function verifyAndAdd() {
  if (verifyingOtp || sendingOtp) return;
  const collaboratorEmail = document.getElementById("collabEmail").value.trim().toLowerCase();
  const otp = document.getElementById("otpCode").value.trim();
  const accountNumber = document.getElementById("accNum").value.trim();
  const ifsc = document.getElementById("ifsc").value.trim();

  if (!invitation || invitation.email !== collaboratorEmail || !/^\d{6}$/.test(otp)) {
    document.getElementById("collabErr").textContent = "Request an invitation for this email and enter its six-digit code.";
    return;
  }
  verifyingOtp = true;
  document.getElementById("verifyOtpBtn").disabled = true;
  document.getElementById("collabEmail").disabled = true;
  try {
    const res = await fetch(`${API}/cashbooks/${encodeURIComponent(id)}/collaborators`, {
      method: "POST",
      headers: invitationHeaders(),
      body: JSON.stringify({ collaboratorEmail, otp, invitationId: invitation.id, accountNumber, ifsc }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      document.getElementById("collabErr").textContent = errData.error || "Incorrect OTP, try again";
      return;
    }
    alert("Collaborator added successfully");
    invitation = null;
    document.getElementById("otpStatus").textContent = "Collaborator verified and added.";
    document.getElementById("collabErr").textContent = "";
    document.getElementById("otpStep").style.display = "none";
    document.getElementById("collabEmail").value = "";
    document.getElementById("otpCode").value = "";
    document.getElementById("accNum").value = "";
    document.getElementById("ifsc").value = "";
  } catch (err) {
    console.error("Verify collaborator error:", err);
    document.getElementById("collabErr").textContent = "Connection error. Please try again.";
  } finally {
    verifyingOtp = false;
    document.getElementById("verifyOtpBtn").disabled = false;
    document.getElementById("collabEmail").disabled = false;
  }
}

loadDetail();
