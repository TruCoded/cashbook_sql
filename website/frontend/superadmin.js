const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";


async function loadAll() {
  const rowsEl = document.getElementById("rows");
  if (rowsEl) rowsEl.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:#666;">Loading ledger data...</td></tr>`;

  try {
    const res = await fetch(`${API}/superadmin/all`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const rows = await res.json(); // [{ cashbookName, owner, balance, collaborators }]
    if (!rows || rows.length === 0) {
      rowsEl.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:#666;">No records found.</td></tr>`;
      return;
    }
    rowsEl.innerHTML = rows
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
  } catch (err) {
    console.error("Superadmin load error:", err);
    if (rowsEl) {
      rowsEl.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--danger, #d9534f);">Could not connect to server. If Render was sleeping, please wait a moment and reload.</td></tr>`;
    }
  }
}
loadAll();

