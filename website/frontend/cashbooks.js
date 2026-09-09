const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "login.html"; // must be logged in

document.getElementById("userName").textContent = user.name; // "Apna naam ana chahiye"

function renderBooks(books) {
  const list = document.getElementById("list");
  if (!list) return;
  if (!books || books.length === 0) {
    list.innerHTML = `<p style="text-align:center;color:var(--text-muted, #666);margin:20px 0;">No cashbooks yet. Tap + to add one.</p>`;
    return;
  }
  list.innerHTML = books
    .map(
      (b) => `
    <div class="card list-item" onclick="openCashbook('${b.id}')">
      <span class="name">${b.name}</span>
      <span class="balance">₹${b.balance}</span>
    </div>`
    )
    .join("");
}

// 0ms instant load from local session cache
const cached = sessionStorage.getItem(`cashbooks_${user.id}`);
if (cached) {
  try {
    renderBooks(JSON.parse(cached));
  } catch (e) {}
}

async function loadCashbooks() {
  const list = document.getElementById("list");
  if (!cached && list) {
    list.innerHTML = `<p style="text-align:center;color:var(--text-muted, #666);">Loading cashbooks...</p>`;
  }

  try {
    const res = await fetch(`${API}/cashbooks?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const books = await res.json(); // [{ id, name, balance }]
    sessionStorage.setItem(`cashbooks_${user.id}`, JSON.stringify(books));
    renderBooks(books);
  } catch (err) {
    console.error("Failed to load cashbooks:", err);
    if (!cached && list) {
      list.innerHTML = `
        <div class="card" style="text-align:center;color:var(--danger, #d9534f);">
          <p style="margin-bottom:8px;">Could not connect to server.</p>
          <p style="font-size:12px;color:#666;margin-bottom:12px;">If Render was sleeping, it may take ~30s to boot up.</p>
          <button class="btn" style="padding:6px 14px;font-size:13px;" onclick="loadCashbooks()">Retry</button>
        </div>`;
    }
  }
}



// remember the id in localStorage too, as a fallback in case the URL's
// query string gets dropped by a page reload before cashbook-detail.js runs
function openCashbook(id) {
  localStorage.setItem("lastCashbookId", id);
  location.href = `cashbook-detail.html?id=${id}`;
}
loadCashbooks();