const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";
const id = new URLSearchParams(location.search).get("id") || localStorage.getItem("lastCashbookId");

const detailCacheKey = `cb_detail_${id}`;

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setEntryType(type) {
  document.getElementById("txnType").value = type;
  const btnIn = document.getElementById("btnTypeIn");
  const btnOut = document.getElementById("btnTypeOut");

  if (type === "in") {
    btnIn.className = "btn";
    btnIn.style.background = "var(--accent-green-bg)";
    btnIn.style.color = "var(--accent-green)";
    btnIn.style.border = "1px solid rgba(16,185,129,0.3)";
    btnIn.style.boxShadow = "none";

    btnOut.className = "btn secondary";
    btnOut.style.background = "";
    btnOut.style.color = "";
    btnOut.style.border = "";
    btnOut.style.boxShadow = "";
  } else {
    btnOut.className = "btn";
    btnOut.style.background = "var(--accent-red-bg)";
    btnOut.style.color = "var(--accent-red)";
    btnOut.style.border = "1px solid rgba(244,63,94,0.3)";
    btnOut.style.boxShadow = "none";

    btnIn.className = "btn secondary";
    btnIn.style.background = "";
    btnIn.style.color = "";
    btnIn.style.border = "";
    btnIn.style.boxShadow = "";
  }
}

function renderTransactions(txns) {
  const listEl = document.getElementById("txnList");
  const countBadge = document.getElementById("txnCountBadge");
  if (!listEl) return;

  if (!txns || txns.length === 0) {
    listEl.innerHTML = `<div class="card" style="text-align:center;color:var(--text-secondary);padding:24px;">No transactions recorded yet.</div>`;
    if (countBadge) countBadge.textContent = "0 entries";
    return;
  }

  if (countBadge) countBadge.textContent = `${txns.length} entries`;

  // Sort newest first
  const reversed = [...txns].reverse();

  listEl.innerHTML = reversed
    .map((t) => {
      const isIn = t.type === "in";
      const icon = isIn ? "↓" : "↑";
      const sign = isIn ? "+" : "-";
      const title = t.note ? escapeHtml(t.note) : (isIn ? "Cash Inflow" : "Cash Outflow");
      const dateStr = t.date ? new Date(t.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent";

      return `
      <div class="txn-row">
        <div class="txn-left">
          <div class="txn-icon ${isIn ? 'in' : 'out'}">${icon}</div>
          <div class="txn-info">
            <div class="txn-title">${title}</div>
            <div class="txn-time">${dateStr}</div>
          </div>
        </div>
        <div class="txn-amount ${isIn ? 'in' : 'out'}">
          ${sign} ${formatCurrency(t.amount)}
        </div>
      </div>`;
    })
    .join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function updateUI(cb) {
  if (!cb) return;
  document.getElementById("title").textContent = cb.name || "Cashbook";
  document.getElementById("cashIn").textContent = formatCurrency(cb.cashIn);
  document.getElementById("cashOut").textContent = formatCurrency(cb.cashOut);
  document.getElementById("balance").textContent = formatCurrency(cb.balance);

  const partnerBadge = document.getElementById("partnerBadge");
  if (partnerBadge) {
    if (cb.partnerName || cb.partnerEmail) {
      partnerBadge.textContent = `Partner / Nominee: ${cb.partnerName || cb.partnerEmail}`;
      partnerBadge.style.display = "block";
    } else {
      partnerBadge.style.display = "none";
    }
  }

  renderTransactions(cb.transactions);
}

// Instant load from cache
const cachedDetail = sessionStorage.getItem(detailCacheKey);
if (cachedDetail) {
  try {
    updateUI(JSON.parse(cachedDetail));
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
      return;
    }
    const cb = await res.json();
    sessionStorage.setItem(detailCacheKey, JSON.stringify(cb));
    updateUI(cb);
  } catch (err) {
    console.error("Failed to load cashbook detail:", err);
  }
}

async function addTransaction() {
  const type = document.getElementById("txnType").value;
  const amountEl = document.getElementById("txnAmount");
  const noteEl = document.getElementById("txnNote");
  const amount = amountEl.value.trim();
  const note = noteEl.value.trim();

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    alert("Please enter a valid positive amount");
    return;
  }

  amountEl.value = "";
  noteEl.value = "";

  try {
    const res = await fetch(`${API}/cashbooks/${encodeURIComponent(id)}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount, note }),
    });

    if (!res.ok) {
      alert("Could not record entry. Please check your connection.");
      loadDetail();
      return;
    }

    const data = await res.json();
    if (data.success) {
      document.getElementById("cashIn").textContent = formatCurrency(data.cashIn);
      document.getElementById("cashOut").textContent = formatCurrency(data.cashOut);
      document.getElementById("balance").textContent = formatCurrency(data.balance);
      if (data.transactions) {
        renderTransactions(data.transactions);
      } else {
        loadDetail();
      }

      // Update cache
      const cached = sessionStorage.getItem(detailCacheKey);
      if (cached) {
        try {
          const cb = JSON.parse(cached);
          cb.cashIn = data.cashIn;
          cb.cashOut = data.cashOut;
          cb.balance = data.balance;
          if (data.transactions) cb.transactions = data.transactions;
          sessionStorage.setItem(detailCacheKey, JSON.stringify(cb));
        } catch (e) {}
      }
    } else {
      loadDetail();
    }
  } catch (err) {
    console.error("Add transaction error:", err);
    alert("Connection error. Please try again.");
  }
}

// Collaborator OTP Flow
async function requestOtp() {
  const email = document.getElementById("collabEmail").value.trim();
  if (!email) {
    alert("Please enter a collaborator email");
    return;
  }
  try {
    const res = await fetch(`${API}/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "Failed to send OTP.");
      return;
    }
    document.getElementById("otpStep").style.display = "block";
    if (data.demoCode) {
      alert(`[Demo OTP]: Your code is ${data.demoCode}`);
      document.getElementById("otpCode").value = data.demoCode;
    } else {
      alert(`OTP has been sent to ${email}`);
    }
  } catch (err) {
    console.error("OTP request error:", err);
    alert("Connection error sending OTP.");
  }
}

async function verifyAndAdd() {
  const collaboratorEmail = document.getElementById("collabEmail").value.trim();
  const otp = document.getElementById("otpCode").value.trim();
  const accountNumber = document.getElementById("accNum").value.trim();
  const ifsc = document.getElementById("ifsc").value.trim();

  if (!collaboratorEmail || !otp) {
    document.getElementById("collabErr").textContent = "Email and OTP are required";
    return;
  }

  try {
    const res = await fetch(`${API}/cashbooks/${encodeURIComponent(id)}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collaboratorEmail, otp, accountNumber, ifsc }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      document.getElementById("collabErr").textContent = errData.error || "Incorrect or expired OTP";
      return;
    }
    alert("Collaborator added successfully!");
    document.getElementById("otpStep").style.display = "none";
    document.getElementById("collabEmail").value = "";
    document.getElementById("otpCode").value = "";
    document.getElementById("accNum").value = "";
    document.getElementById("ifsc").value = "";
    document.getElementById("collabErr").textContent = "";
  } catch (err) {
    console.error("Verify collaborator error:", err);
    document.getElementById("collabErr").textContent = "Connection error. Please try again.";
  }
}

loadDetail();