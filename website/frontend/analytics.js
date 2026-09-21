const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000";
const API = isLocal ? "http://localhost:5000/api" : "/api";
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "login.html";

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function loadAnalytics() {
  const statIncome = document.getElementById("statIncome");
  const statExpenses = document.getElementById("statExpenses");
  const statSavings = document.getElementById("statSavings");
  const statRate = document.getElementById("statRate");
  const barChartContainer = document.getElementById("barChartContainer");
  const categoryContainer = document.getElementById("categoryContainer");
  const insightsContainer = document.getElementById("insightsContainer");

  try {
    const res = await fetch(`${API}/analytics?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email)}`);
    if (!res.ok) throw new Error("Failed to load analytics");
    const data = await res.json();

    if (statIncome) statIncome.textContent = formatCurrency(data.totalIncome || 265000);
    if (statExpenses) statExpenses.textContent = formatCurrency(data.totalExpenses || 150000);
    if (statSavings) statSavings.textContent = formatCurrency(data.netSavings || 115000);
    if (statRate) statRate.textContent = `${data.savingsRate || 43.4}%`;

    // Render Bar Chart
    const monthly = data.monthlyData || [];
    const maxVal = Math.max(...monthly.map((m) => Math.max(m.income, m.expenses)), 100000);

    if (barChartContainer) {
      barChartContainer.innerHTML = monthly
        .map((m) => {
          const incHeight = Math.max(12, Math.round((m.income / maxVal) * 140));
          const expHeight = Math.max(12, Math.round((m.expenses / maxVal) * 140));

          return `
          <div class="bar-group">
            <div class="bars-pair">
              <div class="bar-col income" style="height:${incHeight}px;" title="Income: ${formatCurrency(m.income)}"></div>
              <div class="bar-col expense" style="height:${expHeight}px;" title="Expenses: ${formatCurrency(m.expenses)}"></div>
            </div>
            <div class="bar-month-label">${m.month}</div>
          </div>`;
        })
        .join("");
    }

    // Render Categories
    const categories = data.categories || [];
    if (categoryContainer) {
      categoryContainer.innerHTML = categories
        .map((cat) => `
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:600;">
            <span style="color:var(--text-primary);">${escapeHtml(cat.name)}</span>
            <span style="color:var(--text-secondary);">${formatCurrency(cat.amount)}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${cat.percent}%;"></div>
          </div>
        </div>`)
        .join("");
    }

    // Render Insights
    const insights = data.insights || [];
    if (insightsContainer) {
      insightsContainer.innerHTML = insights
        .map((ins) => `
        <div class="insight-card">
          <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">
            ${escapeHtml(ins.title)}
          </div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">
            ${escapeHtml(ins.desc)}
          </div>
        </div>`)
        .join("");
    }
  } catch (err) {
    console.error("Analytics fetch error:", err);
  }
}

loadAnalytics();
