let players = JSON.parse(localStorage.getItem("players")) || [];
let admissionsOpen = JSON.parse(localStorage.getItem("admissions")) ?? true;

/* ================= UI ================= */
.hero-buttons button:hover{
transform:scale(1.05);
transition:.2s;
}
.facility-grid i{
margin-right:8px;
color:var(--green);
}
table{
display:block;
overflow-x:auto;
}
@media(max-width:600px){

.hero h1{
font-size:1.8rem;
}

.hero{
padding:3rem 1rem;
}

}
function show(id) {

  // 🔐 Admin protection
  if (id === "admin" && sessionStorage.getItem("admin") !== "true") {
    alert("Login required");
    return;
  }

  document.querySelectorAll("section").forEach(section => {
    section.classList.add("hidden");
  });

  const page = document.getElementById(id);
  if (page) page.classList.remove("hidden");

  if (id === "admin") loadTable();
  if (id === "signup") checkStatus();
}
.hero-overlay{
max-width:900px;
margin:auto;
}

function logout() {
  sessionStorage.removeItem("admin");
  show("home");
}

function checkStatus() {

  if (!window.admissionStatus || !window.signupForm) return;

  admissionStatus.innerHTML = admissionsOpen
    ? ""
    : "<div class='error'>Admissions Closed</div>";

  const btn = signupForm.querySelector("button");
  if (btn) btn.disabled = !admissionsOpen;
}

/* ================= ADMIN LOGIN ================= */

if (window.loginForm) {
  loginForm.onsubmit = async e => {

    e.preventDefault();

    try {

      const res = await fetch("/api/adminLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: adminEmail.value,
          password: adminPass.value
        })
      });

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("admin", "true");
        show("admin");
      } else {
        alert("Invalid Login");
      }

    } catch (err) {
      alert("Server error. Try again.");
      console.error(err);
    }

  };
}

/* ================= GPS ================= */

function getUserCoordinates() {

  return new Promise((resolve, reject) => {

    if (!navigator.geolocation) {
      reject("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(

      pos => {

        resolve({
          lat: pos.coords.latitude.toFixed(6),
          lon: pos.coords.longitude.toFixed(6),
          map: `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
        });

      },

      err => reject(err),

      { enableHighAccuracy: true }

    );

  });

}

/* ================= BUTTON TIMER ================= */

function disableSubmit(btn, sec = 10) {

  if (!btn) return;

  btn.disabled = true;

  let time = sec;
  const originalText = btn.innerText;

  const timer = setInterval(() => {

    btn.innerText = `Please wait ${time}s`;
    time--;

    if (time < 0) {

      clearInterval(timer);
      btn.disabled = false;
      btn.innerText = originalText;

    }

  }, 1000);

}

/* ================= SIGNUP FORM ================= */

if (window.signupForm) {

  signupForm.onsubmit = async e => {

    e.preventDefault();

    if (!admissionsOpen) return;

    const btn = signupForm.querySelector("button");
    disableSubmit(btn, 10);

    let loc = { lat: "N/A", lon: "N/A", map: "N/A" };

    try {
      loc = await getUserCoordinates();
    } catch (err) {
      console.warn("GPS error:", err);
    }

    const reg = "SCA-" + Date.now().toString().slice(-6);

    const data = {

      reg: reg,
      name: playerName.value,
      age: age.value,
      parent: parentName.value,
      phone: phone.value,
      address: address.value,
      timing: timing.value,

      latitude: loc.lat,
      longitude: loc.lon,
      map: loc.map,

      date: new Date().toLocaleString("en-IN")

    };

    players.push(data);

    localStorage.setItem("players", JSON.stringify(players));

    try {

      await fetch("/api/sendTelegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

    } catch (err) {
      console.error("Telegram send failed", err);
    }

    if (window.submitMsg) {
      submitMsg.innerHTML =
        "<div class='success'>Admission Successful! Telegram & GPS sent.</div>";
    }

    signupForm.reset();

  };

}

/* ================= ADMIN TABLE ================= */

function loadTable() {

  if (!window.tableBody) return;

  tableBody.innerHTML = "";

  players.forEach(player => {

    const row = tableBody.insertRow();

    ["reg", "name", "age", "parent", "phone", "timing", "date"].forEach(key => {

      const cell = row.insertCell();
      cell.textContent = player[key] || "";

    });

  });

}

/* ================= INIT ================= */

show("home");
