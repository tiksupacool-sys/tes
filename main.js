// ========== SMART HOME MAIN SCRIPT DENGAN KONTROL SUARA ==========

// Data perangkat
const devices = {
  lamp_tamu: { name: "Lampu Ruang Tamu", power: 40 },
  lamp_garasi: { name: "Lampu Garasi", power: 30 },
  lamp_keluarga: { name: "Lampu Keluarga", power: 50 },
  ac_utama: { name: "AC Utama", power: 900 },
  ac_kamar: { name: "AC Kamar", power: 700 },
  tv_keluarga: { name: "TV Keluarga", power: 200 },
  mw_dapur: { name: "Microwave Dapur", power: 1200 },
  mw_mini: { name: "Microwave Mini", power: 800 },
  fridge_utama: { name: "Kulkas Utama", power: 150 },
  fridge_mini: { name: "Kulkas Mini", power: 100 },
};

// Tombol ON/OFF manual
document.querySelectorAll(".toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.device;
    const current = JSON.parse(localStorage.getItem(id)) || { status: "OFF" };
    const newStatus = current.status === "ON" ? "OFF" : "ON";

    localStorage.setItem(
      id,
      JSON.stringify({
        status: newStatus,
        lastChange: Date.now(),
        usage: current.usage || 0,
      })
    );

    updateButtonUI(btn, newStatus === "ON");

    if (newStatus === "ON") startDeviceTimer(id);
    else stopDeviceTimer(id);

    updateDashboard();
  });
});

// Saat halaman dimuat
window.addEventListener("load", () => {
  document.querySelectorAll(".toggle").forEach(btn => {
    const id = btn.dataset.device;
    const saved = JSON.parse(localStorage.getItem(id)) || {};
    const isOn = saved.status === "ON";
    updateButtonUI(btn, isOn);
    if (isOn) startDeviceTimer(id);
  });
  updateDashboard();
});

// Update tampilan dashboard
function updateDashboard() {
  const groups = {
    lampSummary: ["lamp_tamu", "lamp_garasi", "lamp_keluarga"],
    acSummary: ["ac_utama", "ac_kamar"],
    tvSummary: ["tv_keluarga"],
    mwSummary: ["mw_dapur", "mw_mini"],
    fridgeSummary: ["fridge_utama", "fridge_mini"],
  };

  let totalPower = 0;

  for (let key in groups) {
    const el = document.getElementById(key);
    if (!el) continue;

    const devs = groups[key];
    const anyOn = devs.some(d => {
      const info = JSON.parse(localStorage.getItem(d));
      if (info?.status === "ON") totalPower += devices[d]?.power || 0;
      return info?.status === "ON";
    });

    el.textContent = anyOn ? "ON" : "OFF";
    el.style.color = anyOn ? "green" : "red";
  }

  const summary = document.getElementById("summary");
  if (summary) {
    let powerEl = document.getElementById("powerDisplay");
    if (!powerEl) {
      powerEl = document.createElement("p");
      powerEl.id = "powerDisplay";
      summary.appendChild(powerEl);
    }
    powerEl.innerHTML = `⚡ Total Daya: <b>${totalPower} W</b>`;
  }
}

// Fungsi update tombol
function updateButtonUI(btn, isOn) {
  btn.textContent = isOn ? "ON" : "OFF";
  btn.classList.toggle("on", isOn);
  btn.style.backgroundColor = isOn ? "#388e3c" : "#d32f2f";
}

// Timer penggunaan
const activeTimers = {};
function startDeviceTimer(id) {
  if (activeTimers[id]) return;
  activeTimers[id] = setInterval(() => {
    const data = JSON.parse(localStorage.getItem(id)) || {};
    if (data.status !== "ON") {
      clearInterval(activeTimers[id]);
      delete activeTimers[id];
      return;
    }
    data.usage = (data.usage || 0) + 1;
    localStorage.setItem(id, JSON.stringify(data));
  }, 1000);
}
function stopDeviceTimer(id) {
  if (activeTimers[id]) {
    clearInterval(activeTimers[id]);
    delete activeTimers[id];
  }
}

// Sinkronisasi antar halaman
window.addEventListener("storage", e => {
  if (devices[e.key]) updateDashboard();
});

// ========== FITUR KONTROL SUARA SPESIFIK PER PERANGKAT ==========
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if ('SpeechRecognition' in window) {
  const recognition = new SpeechRecognition();
  recognition.lang = "id-ID";
  recognition.continuous = true;

  // Tombol mikrofon
  const micButton = document.createElement("button");
  micButton.textContent = "🎙️ Aktifkan Suara";
  micButton.style.position = "fixed";
  micButton.style.bottom = "20px";
  micButton.style.left = "20px";
  micButton.style.padding = "10px 20px";
  micButton.style.background = "#00796b";
  micButton.style.color = "white";
  micButton.style.border = "none";
  micButton.style.borderRadius = "8px";
  micButton.style.cursor = "pointer";
  micButton.style.zIndex = "1000";
  document.body.appendChild(micButton);

  let listening = false;
  micButton.addEventListener("click", () => {
    if (!listening) {
      recognition.start();
      micButton.textContent = "🛑 Stop Suara";
      listening = true;
    } else {
      recognition.stop();
      micButton.textContent = "🎙️ Aktifkan Suara";
      listening = false;
    }
  });

  recognition.onresult = (event) => {
    const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("🎧 Perintah suara:", text);
    handleVoiceCommand(text);
  };

  function handleVoiceCommand(command) {
    let action = null;
    if (command.includes("nyalakan") || command.includes("hidupkan")) action = "ON";
    else if (command.includes("matikan")) action = "OFF";
    else return;

    for (const id in devices) {
      const dev = devices[id];
      const btn = document.querySelector(`[data-device="${id}"]`);
      if (!btn) continue;

      const cleanName = dev.name.toLowerCase().replace(/[^\w\s]/gi, "").trim();

      if (command.includes(cleanName)) {
        const current = JSON.parse(localStorage.getItem(id)) || { status: "OFF" };
        const newStatus = action;
        if (current.status !== newStatus) {
          btn.click();
          showNotification(`🎤 ${action === "ON" ? "Menyalakan" : "Mematikan"} ${dev.name}`);
        }
      }
    }
  }

  // Notifikasi kecil di pojok bawah
  const notif = document.createElement("div");
  notif.className = "notification";
  document.body.appendChild(notif);

  function showNotification(msg) {
    notif.textContent = msg;
    notif.classList.add("show");
    setTimeout(() => notif.classList.remove("show"), 2500);
  }

} else {
  alert("Browser kamu tidak mendukung pengenalan suara.");
}
