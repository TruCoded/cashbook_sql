const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "login.html";

// Set user name and avatar
const userNameEl = document.getElementById("userName");
const userAvatarEl = document.getElementById("userAvatar");
if (userNameEl && user) userNameEl.textContent = user.name || "User";
if (userAvatarEl && user) {
  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();
  userAvatarEl.textContent = initial;
}

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderBooks(books) {
  const list = document.getElementById("list");
  const totalBalanceEl = document.getElementById("totalNetBalance");
  const countEl = document.getElementById("cashbookCount");
  if (!list) return;

  if (!books || books.length === 0) {
    list.innerHTML = `
      <div class="card" style="text-align:center;padding:36px 20px;">
        <div style="font-size:32px;margin-bottom:10px;">💳</div>
        <p style="font-weight:600;color:var(--text-primary);margin-bottom:6px;">No cashbooks yet</p>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Create your first financial book to track transactions.</p>
        <a href="add-cashbook.html" class="btn" style="padding:10px 20px;font-size:12px;">+ Create Cashbook</a>
      </div>`;
    if (totalBalanceEl) totalBalanceEl.textContent = "₹0.00";
    if (countEl) countEl.textContent = "0 Cashbooks";
    return;
  }

  const total = books.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
  if (totalBalanceEl) totalBalanceEl.textContent = formatCurrency(total);
  if (countEl) countEl.textContent = `${books.length} Active ${books.length === 1 ? 'Book' : 'Books'}`;

  const bookIcons = ["💼", "💰", "🏠", "🛒", "📈", "💳", "🏖️", "🚗"];

  list.innerHTML = books
    .map((b, idx) => {
      const icon = bookIcons[idx % bookIcons.length];
      const isPositive = Number(b.balance) >= 0;
      return `
      <div class="cashbook-item-card" onclick="openCashbook('${b.id}')">
        <div class="cb-item-left">
          <div class="cb-avatar">${icon}</div>
          <div class="cb-info">
            <div class="cb-title">${escapeHtml(b.name)}</div>
            <div class="cb-sub">ID: ${b.id.slice(-6)}</div>
          </div>
        </div>
        <div class="cb-item-right">
          <div class="cb-balance" style="color:${isPositive ? 'var(--text-primary)' : 'var(--accent-red)'};">
            ${formatCurrency(b.balance)}
          </div>
          <div class="cb-badge" style="color:${isPositive ? 'var(--accent-green)' : 'var(--accent-red)'};">
            ${isPositive ? '● Positive' : '● Negative'}
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Instant load from cache
const cached = sessionStorage.getItem(`cashbooks_${user.id}`);
if (cached) {
  try {
    renderBooks(JSON.parse(cached));
  } catch (e) {}
}

async function loadCashbooks() {
  const list = document.getElementById("list");
  if (!cached && list) {
    list.innerHTML = `<div class="card" style="text-align:center;color:var(--text-secondary);padding:24px;">Loading cashbooks...</div>`;
  }

  try {
    const res = await fetch(`${API}/cashbooks?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const books = await res.json();
    sessionStorage.setItem(`cashbooks_${user.id}`, JSON.stringify(books));
    renderBooks(books);
  } catch (err) {
    console.error("Failed to load cashbooks:", err);
    if (!cached && list) {
      list.innerHTML = `
        <div class="card" style="text-align:center;color:var(--accent-red);">
          <p style="margin-bottom:8px;font-weight:600;">Could not connect to server.</p>
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;">Please check connection or backend status.</p>
          <button class="btn secondary" onclick="loadCashbooks()">Retry</button>
        </div>`;
    }
  }
}

function openCashbook(id) {
  localStorage.setItem("lastCashbookId", id);
  location.href = `cashbook-detail.html?id=${id}`;
}

loadCashbooks();