const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function loadAll() {
  const rowsEl = document.getElementById("rows");
  const totalBooksEl = document.getElementById("statTotalBooks");
  const globalBalEl = document.getElementById("statGlobalBalance");

  try {
    const res = await fetch(`${API}/superadmin/all`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const rows = await res.json();

    if (!rows || rows.length === 0) {
      if (rowsEl) rowsEl.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-secondary);">No ledger records found in MongoDB.</td></tr>`;
      if (totalBooksEl) totalBooksEl.textContent = "0";
      if (globalBalEl) globalBalEl.textContent = "₹0.00";
      return;
    }

    const totalBal = rows.reduce((s, r) => s + (Number(r.balance) || 0), 0);
    if (totalBooksEl) totalBooksEl.textContent = rows.length;
    if (globalBalEl) globalBalEl.textContent = formatCurrency(totalBal);

    if (rowsEl) {
      rowsEl.innerHTML = rows
        .map((r) => {
          const isPos = Number(r.balance) >= 0;
          return `
          <tr>
            <td style="font-weight:700;">${escapeHtml(r.cashbookName)}</td>
            <td><span style="display:inline-block;padding:3px 8px;border-radius:999px;background:var(--surface-elevated);font-size:12px;font-weight:600;">${escapeHtml(r.owner)}</span></td>
            <td style="font-weight:700;color:${isPos ? 'var(--accent-green)' : 'var(--accent-red)'};">
              ${formatCurrency(r.balance)}
            </td>
            <td style="color:var(--text-secondary);font-size:13px;">
              ${r.collaborators.length ? r.collaborators.map((c) => `<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 8px;border-radius:6px;background:rgba(139,92,246,0.15);color:var(--accent-purple);font-size:12px;">${escapeHtml(c)}</span>`).join("") : '<span style="opacity:0.5;">None</span>'}
            </td>
          </tr>`;
        })
        .join("");
    }
  } catch (err) {
    console.error("Superadmin load error:", err);
    if (rowsEl) {
      rowsEl.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--accent-red);">Could not connect to server. Please try again in a few moments.</td></tr>`;
    }
  }
}

loadAll();
