// cashbooks.js - shows the logged-in user's name and their list of cashbooks
const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000"
  ? "http://localhost:5000/api"
  : "https://cashbook-sql.onrender.com/api";
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "login.html"; // must be logged in

document.getElementById("userName").textContent = user.name; // "Apna naam ana chahiye"

async function loadCashbooks() {
  const res = await fetch(`${API}/cashbooks?userId=${user.id}&email=${user.email}`);
  const books = await res.json(); // [{ id, name, balance }]
  const list = document.getElementById("list");
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

// remember the id in localStorage too, as a fallback in case the URL's
// query string gets dropped by a page reload before cashbook-detail.js runs
function openCashbook(id) {
  localStorage.setItem("lastCashbookId", id);
  location.href = `cashbook-detail.html?id=${id}`;
}
loadCashbooks();