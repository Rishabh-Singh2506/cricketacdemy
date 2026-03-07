/* =============================================
   STEPUP CRICKET ACADEMY — script.js
   Works with Vercel serverless + Telegram bot
   ============================================= */

let players = JSON.parse(localStorage.getItem("sca_players")) || [];
let admissionsOpen = JSON.parse(localStorage.getItem("sca_admissions")) ?? true;

/* =============================================
   NAVIGATION
   ============================================= */

function show(id) {
  if (id === "admin" && sessionStorage.getItem("sca_admin") !== "true") {
    alert("Admin login required.");
    show("login");
    return;
  }

  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");

  // Update active nav button
  ["home","signup","login","admin"].forEach(key => {
    const btn = document.getElementById("nav-" + key);
    if (btn) btn.classList.toggle("active", key === id);
  });

  if (id === "admin") loadTable();
  if (id === "signup") checkAdmissionStatus();

  // Scroll to section (not top of page)
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function logout() {
  sessionStorage.removeItem("sca_admin");
  show("home");
}

function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  menu.classList.toggle("hidden");
}

/* =============================================
   ADMISSION STATUS
   ============================================= */

function checkAdmissionStatus() {
  const statusEl = document.getElementById("admissionStatus");
  const submitBtn = document.getElementById("submitBtn");

  if (!admissionsOpen) {
    statusEl.innerHTML = `<div class="msg-warning">⚠️ Admissions are currently closed. Please check back later.</div>`;
    if (submitBtn) submitBtn.disabled = true;
  } else {
    statusEl.innerHTML = "";
    if (submitBtn) submitBtn.disabled = false;
  }
}

function toggleAdmissions(state) {
  admissionsOpen = state;
  localStorage.setItem("sca_admissions", JSON.stringify(state));
  const msg = state ? "✅ Admissions are now OPEN." : "🚫 Admissions are now CLOSED.";
  alert(msg);
}

/* =============================================
   ADMIN LOGIN — calls Vercel serverless API
   ============================================= */

document.getElementById("loginForm").onsubmit = async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById("loginMsg");
  const btn = e.target.querySelector("button[type=submit]");
  const origText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = `<i class="fa fa-spinner fa-spin"></i> Verifying...`;
  msgEl.innerHTML = "";

  try {
    const res = await fetch("/api/adminLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("adminEmail").value.trim(),
        password: document.getElementById("adminPass").value
      })
    });

    const data = await res.json();

    if (data.success) {
      sessionStorage.setItem("sca_admin", "true");
      msgEl.innerHTML = `<div class="msg-success">✅ Login successful!</div>`;
      setTimeout(() => show("admin"), 500);
    } else {
      msgEl.innerHTML = `<div class="msg-error">❌ Invalid email or password.</div>`;
    }
  } catch (err) {
    console.error("Login error:", err);
    msgEl.innerHTML = `<div class="msg-error">❌ Server error. Please try again.</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = origText;
  }
};

/* =============================================
   GPS LOCATION
   ============================================= */

function getUserCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat: pos.coords.latitude.toFixed(6),
        lon: pos.coords.longitude.toFixed(6),
        map: `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
      }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

/* =============================================
   SUBMIT BUTTON COOLDOWN
   ============================================= */

function startCooldown(btn, seconds = 10) {
  const original = btn.innerHTML;
  btn.disabled = true;
  let remaining = seconds;

  const timer = setInterval(() => {
    btn.innerHTML = `<i class="fa fa-clock"></i> Please wait ${remaining}s`;
    remaining--;
    if (remaining < 0) {
      clearInterval(timer);
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }, 1000);
}

/* =============================================
   PLAYER SIGNUP FORM
   ============================================= */

document.getElementById("signupForm").onsubmit = async (e) => {
  e.preventDefault();
  if (!admissionsOpen) return;

  const submitBtn = document.getElementById("submitBtn");
  const submitMsg = document.getElementById("submitMsg");
  submitMsg.innerHTML = "";

  // Basic validation
  const phone = document.getElementById("phone").value.trim();
  const age = parseInt(document.getElementById("age").value);

  if (!/^\d{10}$/.test(phone)) {
    submitMsg.innerHTML = `<div class="msg-error">❌ Please enter a valid 10-digit mobile number.</div>`;
    return;
  }

  if (age < 5 || age > 18) {
    submitMsg.innerHTML = `<div class="msg-error">❌ Age must be between 5 and 18 years.</div>`;
    return;
  }

  // Start cooldown immediately
  startCooldown(submitBtn, 10);

  // Try to get GPS location
  let loc = { lat: "N/A", lon: "N/A", map: "N/A" };
  try {
    loc = await getUserCoordinates();
  } catch (err) {
    console.warn("GPS unavailable:", err.message || err);
  }

  // Generate registration number
  const reg = "SCA-" + Date.now().toString().slice(-6);

  const playerData = {
    reg,
    name: document.getElementById("playerName").value.trim(),
    age: age.toString(),
    parent: document.getElementById("parentName").value.trim(),
    phone,
    address: document.getElementById("address").value.trim(),
    timing: document.getElementById("timing").value,
    latitude: loc.lat,
    longitude: loc.lon,
    map: loc.map,
    date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  };

  // Save to localStorage
  players.push(playerData);
  localStorage.setItem("sca_players", JSON.stringify(players));

  // Send Telegram notification (non-blocking)
  sendTelegram(playerData);

  // Show success
  submitMsg.innerHTML = `
    <div class="msg-success">
      ✅ Registration submitted! Your Reg No: <strong>${reg}</strong>
    </div>`;

  e.target.reset();
};

/* =============================================
   TELEGRAM NOTIFICATION
   ============================================= */

async function sendTelegram(data) {
  try {
    const res = await fetch("/api/sendTelegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      console.warn("Telegram API responded with:", res.status);
    }
  } catch (err) {
    console.error("Telegram send failed:", err);
    // Silent fail — user registration already saved locally
  }
}

/* =============================================
   ADMIN TABLE
   ============================================= */

function loadTable() {
  const tbody = document.getElementById("tableBody");
  const countEl = document.getElementById("playerCount");
  tbody.innerHTML = "";

  if (players.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#aaa;padding:2rem">No registrations yet.</td></tr>`;
    if (countEl) countEl.textContent = "0";
    return;
  }

  players.forEach(p => {
    const row = tbody.insertRow();
    const mapLink = p.map && p.map !== "N/A"
      ? `<a href="${p.map}" target="_blank" title="View on map">📍 View</a>`
      : "N/A";

    row.innerHTML = `
      <td><strong>${p.reg}</strong></td>
      <td>${p.name}</td>
      <td>${p.age}</td>
      <td>${p.parent}</td>
      <td>${p.phone}</td>
      <td>${p.timing}</td>
      <td>${mapLink}</td>
      <td>${p.date}</td>
    `;
  });

  if (countEl) countEl.textContent = players.length;
}

/* =============================================
   EXPORT CSV
   ============================================= */

function exportCSV() {
  if (players.length === 0) {
    alert("No player data to export.");
    return;
  }

  const headers = ["Reg No","Name","Age","Parent","Phone","Address","Timing","Latitude","Longitude","Map","Date"];
  const rows = players.map(p => [
    p.reg, p.name, p.age, p.parent, p.phone,
    `"${p.address}"`, p.timing, p.latitude, p.longitude,
    p.map, `"${p.date}"`
  ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `SCA_Players_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* =============================================
   INIT
   ============================================= */

// Request GPS on load for faster signup later
window.addEventListener("load", () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {}
    );
  }

  show("home");
});
