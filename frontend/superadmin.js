// superadmin.js - loads and displays all users' cashbooks in one flat table
const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000"
  ? "http://localhost:5000/api"
  : "https://cashbook-sql.onrender.com/api";

async function loadAll() {
  const res = await fetch(`${API}/superadmin/all`);
  const rows = await res.json(); // [{ cashbookName, owner, balance, collaborators }]
  document.getElementById("rows").innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${r.cashbookName}</td>
      <td>${r.owner}</td>
      <td>₹${r.balance}</td>
      <td>${r.collaborators.length ? r.collaborators.join(", ") : "-"}</td>
    </tr>`
    )
    .join("");
}
loadAll();
