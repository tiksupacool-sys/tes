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

      const cleanName = dev.name.toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .trim();

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
