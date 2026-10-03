const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "login.html";

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getInitials(name) {
  if (!name) return "CO";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

async function loadCollaborators() {
  const container = document.getElementById("collabListContainer");
  const statCollabs = document.getElementById("statCollabs");
  const statShared = document.getElementById("statSharedBooks");
  const statPending = document.getElementById("statPending");

  try {
    const res = await fetch(`${API}/collaborators/workspace?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`);
    if (!res.ok) throw new Error("Failed to load");
    const data = await res.json();

    if (statCollabs) statCollabs.textContent = data.collaboratorsCount;
    if (statShared) statShared.textContent = data.sharedCashbooksCount;
    if (statPending) statPending.textContent = data.pendingCount;

    const list = data.collaborators || [];
    if (list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:36px 20px;">
          <div style="font-size:32px;margin-bottom:10px;">👥</div>
          <p style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">No collaborators yet</p>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Invite family members or business partners to your books.</p>
          <button class="btn" onclick="openInviteModal()">+ Invite First Collaborator</button>
        </div>`;
      return;
    }

    container.innerHTML = list
      .map((c) => {
        const initials = getInitials(c.name);
        const isActive = c.status === "Active";
        const statusColor = isActive ? "var(--accent-green)" : "#eab308";
        const statusIcon = isActive ? "✓" : "⏳";

        return `
        <div class="collab-row-item">
          <div style="display:flex;align-items:center;gap:14px;">
            <div class="collab-avatar">${initials}</div>
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--text-primary);">${escapeHtml(c.name)}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                ${escapeHtml(c.email)} • <span style="opacity:0.8;">${escapeHtml(c.cashbookName)}</span>
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:12px;font-weight:600;padding:4px 10px;border-radius:6px;background:var(--surface-elevated);border:1px solid var(--surface-border);color:var(--text-secondary);">
              ${escapeHtml(c.role || 'Viewer')}
            </span>
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:${statusColor};background:${isActive ? 'var(--accent-green-bg)' : 'rgba(234,179,8,0.1)'};padding:4px 10px;border-radius:999px;">
              <span>${statusIcon}</span>
              <span>${c.status}</span>
            </span>
          </div>
        </div>`;
      })
      .join("");
  } catch (err) {
    console.error("Collaborator load error:", err);
    if (container) {
      container.innerHTML = `<div class="card" style="text-align:center;color:var(--accent-red);padding:24px;">Failed to load collaborators. Please retry.</div>`;
    }
  }
}

function openInviteModal() {
  const modal = document.getElementById("inviteModal");
  if (modal) modal.style.display = "flex";
}

function closeInviteModal() {
  const modal = document.getElementById("inviteModal");
  if (modal) modal.style.display = "none";
}

async function sendInvite() {
  const email = document.getElementById("modalEmail").value.trim();
  if (!email) {
    alert("Please enter an email address");
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
      alert(data.error || "Failed to send invitation.");
      return;
    }
    alert(data.demoCode ? `[Demo OTP Generated]: ${data.demoCode}` : `Invitation OTP sent to ${email}`);
    closeInviteModal();
    loadCollaborators();
  } catch (e) {
    alert("Network error sending invite.");
  }
}

loadCollaborators();
