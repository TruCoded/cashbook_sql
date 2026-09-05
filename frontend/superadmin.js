// superadmin.js - merged "master sheet" view of every cashbook, owner, and collaborator
const API = "http://localhost:5000/api";

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
