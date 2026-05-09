const player = document.getElementById("player");
const source = document.getElementById("audioSource");
const select = document.getElementById("audioSelect");
const playButton = document.getElementById("playButton");
const statusText = document.getElementById("estado");
const statusBar = document.getElementById("statusBar");
const phaseReadout = document.getElementById("phaseReadout");
const phaseBadge = document.getElementById("phaseBadge");
const phaseLiveDescription = document.getElementById("phaseLiveDescription");
const phaseTimeline = document.getElementById("phaseTimeline");
const cycleClock = document.getElementById("cycleClock");
const scrollProgress = document.getElementById("scrollProgress");

let timers = [];

const demoSchedules = {
  "audio1.wav": [
    { start: 0, end: 14.2, phase: "cierre" },
    { start: 14.2, end: 19.6, phase: "carga" },
    { start: 19.6, end: 27.2, phase: "retroceso" },
    { start: 27.2, end: 39.6, phase: "apertura" },
  ],
  "audio2.wav": [
    { start: 0, end: 13.6, phase: "cierre" },
    { start: 13.6, end: 19, phase: "carga" },
    { start: 19, end: 26.6, phase: "retroceso" },
    { start: 26.6, end: 39.6, phase: "apertura" },
  ],
  "audio3.wav": [
    { start: 0, end: 13.6, phase: "cierre" },
    { start: 13.6, end: 18.8, phase: "carga" },
    { start: 18.8, end: 26.6, phase: "retroceso" },
    { start: 26.6, end: 39.6, phase: "apertura" },
  ],
};

const phaseInfo = {
  cierre: {
    title: "Cierre",
    description: "La máquina se cierra y prepara el molde. El sonido suele ser estable y marca el inicio del ciclo.",
    duration: "14,2 s",
    signal: "Arranque mecánico claro",
  },
  carga: {
    title: "Carga",
    description: "El material avanza y el sistema vigila que esta fase no se alargue de forma anómala.",
    duration: "5,4 s",
    signal: "Energía sostenida",
  },
  retroceso: {
    title: "Retroceso",
    description: "La unidad vuelve a posición de recuperación. La decisión temporal evita saltos de fase no físicos.",
    duration: "7,6 s",
    signal: "Cambio espectral",
  },
  apertura: {
    title: "Apertura",
    description: "El molde abre y se completa el ciclo. La salida temporal queda lista para el siguiente cierre.",
    duration: "12,4 s",
    signal: "Final de ciclo",
  },
};

const phaseLabels = {
  cierre: "Cierre",
  carga: "Carga",
  retroceso: "Retroceso",
  apertura: "Apertura",
};

const phaseColors = {
  cierre: "#1f57b6",
  carga: "#c89a0a",
  retroceso: "#00a9c7",
  apertura: "#1f2933",
};

const phaseDemoDescriptions = {
  cierre: "La demo detecta el cierre del molde: el ciclo está arrancando y el sistema se mantiene en la primera fase.",
  carga: "La fase detectada pasa a carga: el sonido corresponde al avance del material dentro del proceso.",
  retroceso: "El clasificador temporal marca retroceso: el sistema reconoce la recuperación mecánica.",
  apertura: "El ciclo llega a apertura: la secuencia queda preparada para volver a empezar.",
};

const flowCaptions = [
  "El sensor recoge el sonido de la inyectora sin intervenir en el proceso.",
  "El audio se divide en ventanas de 0,2 s para trabajar de forma continua.",
  "Cada ventana se transforma en MFCC, energía, ZCR y rasgos espectrales.",
  "El modelo estima la fase y bloquea transiciones que no encajan con el ciclo real.",
];

const hotspotInfo = {
  captura: {
    title: "Captura acústica",
    body: "El micrófono escucha el ciclo sin tocar la máquina.",
  },
  molde: {
    title: "Zona del molde",
    body: "Las fases de cierre, carga, retroceso y apertura se reflejan en la señal sonora.",
  },
  control: {
    title: "Diagnóstico",
    body: "La salida temporal permite revisar el estado del proceso y posibles anomalías.",
  },
};

function setStatus(text, percent, color) {
  if (statusText) {
    statusText.textContent = text;
  }

  if (statusBar) {
    statusBar.style.width = `${percent}%`;
    if (color) {
      statusBar.style.background = color;
    }
  }
}

function setReadout(text) {
  if (phaseReadout) {
    phaseReadout.textContent = text;
  }
}

function formatSeconds(value) {
  return `${value.toFixed(1).replace(".", ",")} s`;
}

function getAudioKey(src) {
  return (src || "").split("/").pop() || "audio1.wav";
}

function currentSchedule() {
  const key = getAudioKey(source ? source.getAttribute("src") : "");
  return demoSchedules[key] || demoSchedules["audio1.wav"];
}

function renderPhaseTimeline() {
  if (!phaseTimeline) {
    return;
  }

  const schedule = currentSchedule();
  const total = schedule[schedule.length - 1].end;
  phaseTimeline.innerHTML = schedule.map((segment) => {
    const width = ((segment.end - segment.start) / total) * 100;
    const label = phaseLabels[segment.phase];
    return `<span class="timeline-segment timeline-${segment.phase}" data-timeline-phase="${segment.phase}" style="width:${width}%"><b>${label}</b><small>${formatSeconds(segment.end - segment.start)}</small></span>`;
  }).join("");
}

function setActiveDemoPhase(phase) {
  document.querySelectorAll("[data-demo-phase]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.demoPhase === phase);
  });
  document.querySelectorAll("[data-timeline-phase]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.timelinePhase === phase);
  });
}

function updateDemoPhase() {
  if (!player) {
    return;
  }

  const schedule = currentSchedule();
  const total = player.duration && Number.isFinite(player.duration)
    ? player.duration
    : schedule[schedule.length - 1].end;
  const time = Math.min(player.currentTime || 0, total);
  const segment = schedule.find((item) => time >= item.start && time < item.end) || schedule[schedule.length - 1];
  const phase = segment.phase;
  const progress = total > 0 ? (time / total) * 100 : 0;

  setReadout(phaseLabels[phase]);
  setActiveDemoPhase(phase);

  if (phaseBadge) {
    phaseBadge.textContent = `Fase temporal: ${phaseLabels[phase]}`;
    phaseBadge.dataset.phase = phase;
  }

  if (phaseLiveDescription) {
    phaseLiveDescription.textContent = phaseDemoDescriptions[phase];
  }

  if (cycleClock) {
    cycleClock.textContent = `${formatSeconds(time)} / ${formatSeconds(total)}`;
  }

  if (statusBar) {
    statusBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    statusBar.style.background = phaseColors[phase];
  }

  if (statusText) {
    statusText.textContent = `Analizando audio completo: ${phaseLabels[phase]}`;
  }
}

function clearTimers() {
  timers.forEach((timer) => window.clearTimeout(timer));
  timers = [];
}

function scheduleStatus(text, percent, delay, color) {
  timers.push(window.setTimeout(() => setStatus(text, percent, color), delay));
}

function tryAudioFallback() {
  if (!player || !source) {
    return;
  }

  const currentSrc = source.getAttribute("src") || "";
  const audioKey = getAudioKey(currentSrc);
  if (source.dataset.fallbackKey === audioKey) {
    return;
  }

  const fallbackSrc = currentSrc.includes("assets/audio/")
    ? audioKey
    : `assets/audio/${audioKey}`;

  if (fallbackSrc === currentSrc) {
    return;
  }

  source.dataset.fallbackKey = audioKey;
  source.src = fallbackSrc;
  player.load();
  setStatus("Buscando el audio en la ruta alternativa...", 12, "#00a9c7");
}

function cambiarAudio(src) {
  if (!player || !source) {
    return;
  }

  clearTimers();
  delete source.dataset.fallbackKey;
  source.src = src;
  player.load();
  setStatus("Audio cargado. Listo para reproducir.", 12, "#00a9c7");
  setReadout("Esperando audio");
  if (phaseBadge) {
    phaseBadge.textContent = "En espera";
    delete phaseBadge.dataset.phase;
  }
  if (phaseLiveDescription) {
    phaseLiveDescription.textContent = "Pulsa reproducir para ver cómo el sistema va siguiendo el ciclo de la máquina sobre un audio completo.";
  }
  if (cycleClock) {
    cycleClock.textContent = "0,0 s / 39,6 s";
  }
  setActiveDemoPhase("");
  renderPhaseTimeline();
}

function reproducirAudio() {
  if (!player) {
    return;
  }

  clearTimers();
  player.play();
  setStatus("Reproduciendo audio. Captura acústica activa.", 28, "#ffd32a");
  updateDemoPhase();
}

if (select) {
  select.addEventListener("change", (event) => cambiarAudio(event.target.value));
}

if (playButton) {
  playButton.addEventListener("click", reproducirAudio);
}

if (player) {
  player.addEventListener("loadedmetadata", () => {
    renderPhaseTimeline();
    updateDemoPhase();
  });

  player.addEventListener("timeupdate", updateDemoPhase);
  player.addEventListener("seeking", updateDemoPhase);
  player.addEventListener("play", updateDemoPhase);
  player.addEventListener("error", tryAudioFallback);

  player.addEventListener("ended", () => {
    clearTimers();
    setStatus("Audio finalizado. La decisión queda lista para revisar.", 100, "#12326f");
    setReadout("Ciclo completado");
    if (phaseBadge) {
      phaseBadge.textContent = "Secuencia completa";
    }
  });

  renderPhaseTimeline();
  updateDemoPhase();
}

function updateScrollProgress() {
  if (!scrollProgress) {
    return;
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const percent = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  scrollProgress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);
updateScrollProgress();

document.querySelectorAll("[data-phase]").forEach((button) => {
  button.addEventListener("click", () => {
    const phase = phaseInfo[button.dataset.phase];
    if (!phase) {
      return;
    }

    document.querySelectorAll("[data-phase]").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    document.getElementById("phaseTitle").textContent = phase.title;
    document.getElementById("phaseDescription").textContent = phase.description;
    document.getElementById("phaseDuration").textContent = phase.duration;
    document.getElementById("phaseSignal").textContent = phase.signal;
  });
});

document.querySelectorAll("[data-flow]").forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.flow);
    document.querySelectorAll("[data-flow]").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    document.getElementById("flowCaption").textContent = flowCaptions[index] || flowCaptions[0];
  });
});

document.querySelectorAll("[data-result]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.result;
    document.querySelectorAll("[data-result]").forEach((item) => item.classList.remove("is-active"));
    document.querySelectorAll("[data-result-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.resultPanel === target);
    });
    button.classList.add("is-active");
  });
});

document.querySelectorAll("[data-hotspot]").forEach((button) => {
  button.addEventListener("click", () => {
    const info = hotspotInfo[button.dataset.hotspot];
    const card = document.getElementById("hotspotCard");
    if (!info || !card) {
      return;
    }

    card.querySelector("strong").textContent = info.title;
    card.querySelector("span").textContent = info.body;
  });
});
