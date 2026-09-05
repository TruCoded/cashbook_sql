// add-cashbook.js - creates a new cashbook ("new sheet") for the logged-in user
const API = "http://localhost:5000/api";
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
