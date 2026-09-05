// cashbook-detail.js - shows Cash In / Cash Out / Balance, lets owner add
// entries and invite collaborators via OTP.
const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000"
  ? "http://localhost:5000/api"
  : "/api";
// URL param first, localStorage as a fallback (in case a page reload from
// Live Server or similar drops the query string before this code runs)
const id = new URLSearchParams(location.search).get("id") || localStorage.getItem("lastCashbookId");

async function loadDetail() {
  const res = await fetch(`${API}/cashbooks/${id}`);
  if (!res.ok) {
    document.getElementById("title").textContent = "Cashbook not found";
    document.getElementById("cashIn").textContent = "-";
    document.getElementById("cashOut").textContent = "-";
    document.getElementById("balance").textContent = "-";
    return; // stop here instead of printing "undefined"
  }
  const cb = await res.json();
  document.getElementById("title").textContent = cb.name;
  document.getElementById("cashIn").textContent = "₹" + cb.cashIn;
  document.getElementById("cashOut").textContent = "₹" + cb.cashOut;
  document.getElementById("balance").textContent = "₹" + cb.balance;
}

async function addTransaction() {
  const type = document.getElementById("txnType").value;
  const amount = document.getElementById("txnAmount").value;
  const note = document.getElementById("txnNote").value;
  if (!amount) return;

  const res = await fetch(`${API}/cashbooks/${id}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, amount, note }),
  });
  if (!res.ok) {
    alert("Could not add entry, this cashbook was not found");
    return;
  }
  loadDetail(); // refresh totals
}

// --- collaborator flow: request OTP -> verify OTP + bank details -> add ---
async function requestOtp() {
  const email = document.getElementById("collabEmail").value;
  if (!email) return;
  await fetch(`${API}/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  // In production this code is emailed, not shown on screen.
  document.getElementById("otpStep").style.display = "block";
}

async function verifyAndAdd() {
  const collaboratorEmail = document.getElementById("collabEmail").value;
  const otp = document.getElementById("otpCode").value;
  const accountNumber = document.getElementById("accNum").value;
  const ifsc = document.getElementById("ifsc").value;

  const res = await fetch(`${API}/cashbooks/${id}/collaborators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collaboratorEmail, otp, accountNumber, ifsc }),
  });

  if (!res.ok) {
    document.getElementById("collabErr").textContent = "Incorrect OTP, try again";
    return;
  }
  alert("Collaborator added successfully");
  document.getElementById("otpStep").style.display = "none";
}

loadDetail();