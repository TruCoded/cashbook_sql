// add-cashbook.js - creates a new cashbook linked to the current user
const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port !== "5000"
  ? "http://localhost:5000/api"
  : "https://cashbook-sql.onrender.com/api";
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) window.location.href = "login.html";

async function createCashbook() {
  const name = document.getElementById("name").value;
  const partnerName = document.getElementById("partnerName").value;
  const partnerEmail = document.getElementById("partnerEmail").value;

  if (!name) {
    document.getElementById("err").textContent = "Please enter a cashbook name";
    return;
  }

  await fetch(`${API}/cashbooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, partnerName, partnerEmail, ownerId: user.id }),
  });

  window.location.href = "cashbooks.html"; // done -> back to the list
}
