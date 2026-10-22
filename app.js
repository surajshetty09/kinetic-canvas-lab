const canvas = document.querySelector("#art-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const palettes = {
  acid: ["#efff8a", "#a48cff", "#ff8ad8", "#e9fff5"],
  ember: ["#ffcf70", "#ff5e7d", "#ff8e55", "#fff2d0"],
  ice: ["#a5fff4", "#4f8cff", "#b3baff", "#efffff"],
};

const sceneData = {
  nebula: {
    index: "001",
    eyebrow: "FLOW STUDY / 001",
    title: "Field<br>Notes",
    description:
      "A living map of invisible currents. Move slowly to bend the field; move fast to leave a scar of light.",
    hint: "MOVE TO DISTURB THE FIELD",
  },
  ribbons: {
    index: "002",
    eyebrow: "WAVE STUDY / 002",
    title: "Soft<br>Signal",
    description:
      "A choir of elastic frequencies. Your position becomes a conductor, stretching silence into luminous tension.",
    hint: "DRAG TO TUNE THE SIGNAL",
  },
  orbit: {
    index: "003",
    eyebrow: "GRAVITY STUDY / 003",
    title: "Orbit<br>Garden",
    description:
      "A tiny cosmos that grows under your hand. Plant gravity wells and watch wandering light find a home.",
    hint: "CLICK TO PLANT A SUN",
  },
};

const state = {
  scene: "nebula",
  palette: "acid",
  intensity: 68,
  paused: false,
  width: 0,
  height: 0,
  dpr: 1,
  time: 0,
  lastTime: performance.now(),
  pointer: { x: 0, y: 0, px: 0, py: 0, active: false, down: false },
  particles: [],
  stars: [],
  suns: [],
  echoes: [],
};

const ui = {
  sceneTitle: document.querySelector("#scene-title"),
  sceneEyebrow: document.querySelector("#scene-eyebrow"),
  sceneDescription: document.querySelector("#scene-description"),
  stageIndex: document.querySelector("#stage-index"),
  hint: document.querySelector("#interaction-hint span:last-child"),
  status: document.querySelector("#status-text"),
  intensity: document.querySelector("#intensity"),
  intensityOutput: document.querySelector("#intensity-output"),
  pause: document.querySelector("#pause-button span"),
};

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function color(hex, alpha = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = rect.width;
  state.height = rect.height;
  canvas.width = Math.round(rect.width * state.dpr);
  canvas.height = Math.round(rect.height * state.dpr);
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  resetScene();
}

function resetScene() {
  const area = state.width * state.height;
  const particleCount = Math.min(1100, Math.max(320, Math.round(area / 950)));
  state.particles = Array.from({ length: particleCount }, () => ({
    x: random(0, state.width),
    y: random(0, state.height),
    px: 0,
    py: 0,
    age: random(0, 220),
    life: random(120, 320),
    speed: random(0.35, 1.25),
    tint: Math.floor(random(0, 3)),
  }));
  state.stars = Array.from({ length: Math.min(380, particleCount / 2) }, () => ({
    x: random(0, state.width),
    y: random(0, state.height),
    vx: random(-0.22, 0.22),
    vy: random(-0.22, 0.22),
    size: random(0.5, 2.1),
    phase: random(0, Math.PI * 2),
  }));
  state.suns = [
    { x: state.width * 0.68, y: state.height * 0.33, mass: 1.3, phase: 0 },
    { x: state.width * 0.82, y: state.height * 0.64, mass: 0.75, phase: 2 },
  ];
  state.echoes = [];
  ctx.fillStyle = "#090a0f";
  ctx.fillRect(0, 0, state.width, state.height);
}

function setScene(name) {
  state.scene = name;
  const data = sceneData[name];
  ui.sceneTitle.innerHTML = data.title;
  ui.sceneEyebrow.textContent = data.eyebrow;
  ui.sceneDescription.textContent = data.description;
  ui.stageIndex.textContent = data.index;
  ui.hint.textContent = data.hint;
  document.querySelectorAll(".scene-option").forEach((button) => {
    const active = button.dataset.scene === name;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  resetScene();
}

function setPalette(name) {
  state.palette = name;
  const [primary, secondary] = palettes[name];
  document.documentElement.style.setProperty("--accent", primary);
  document.documentElement.style.setProperty("--accent-2", secondary);
  document.querySelectorAll(".palette").forEach((button) => {
    const active = button.dataset.palette === name;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function togglePause() {
  state.paused = !state.paused;
  ui.pause.textContent = state.paused ? "RESUME" : "PAUSE";
  ui.status.textContent = state.paused ? "SYSTEM SUSPENDED" : "SYSTEM RUNNING";
  document.querySelector(".status-dot").style.opacity = state.paused ? "0.3" : "1";
}

function updateRange() {
  const value = Number(ui.intensity.value);
  state.intensity = value;
  ui.intensityOutput.textContent = value;
  ui.intensity.style.background =
    `linear-gradient(90deg, var(--accent) 0 ${value}%, #34353a ${value}% 100%)`;
}

function fade(alpha, shade = "8, 9, 14") {
  ctx.fillStyle = `rgba(${shade}, ${alpha})`;
  ctx.fillRect(0, 0, state.width, state.height);
}

function ambientGlow(x, y, radius, hex, alpha) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color(hex, alpha));
  glow.addColorStop(0.42, color(hex, alpha * 0.34));
  glow.addColorStop(1, color(hex, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawNebula(dt) {
  fade(0.085 - state.intensity * 0.00042);
  const palette = palettes[state.palette];
  const pointer = state.pointer;
  const scale = state.intensity / 60;

  ctx.globalCompositeOperation = "lighter";
  ambientGlow(state.width * 0.73, state.height * 0.3, state.width * 0.42, palette[1], 0.035);
  ambientGlow(state.width * 0.42, state.height * 0.77, state.width * 0.34, palette[0], 0.022);
  ctx.lineWidth = 1.15;
  for (const particle of state.particles) {
    particle.px = particle.x;
    particle.py = particle.y;

    const angle =
      Math.sin(particle.x * 0.006 + state.time * 0.38) * 1.2 +
      Math.cos(particle.y * 0.007 - state.time * 0.3) * 1.1 +
      Math.sin((particle.x + particle.y) * 0.0024) * 0.8;
    let vx = Math.cos(angle) * particle.speed * scale;
    let vy = Math.sin(angle) * particle.speed * scale;

    if (pointer.active) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < 22000 && distanceSq > 4) {
        const force = (1 - distanceSq / 22000) * (pointer.down ? -3.2 : 2.2);
        const inv = 1 / Math.sqrt(distanceSq);
        vx += -dy * inv * force;
        vy += dx * inv * force;
      }
    }

    particle.x += vx * dt;
    particle.y += vy * dt;
    particle.age += dt;

    if (
      particle.x < -10 ||
      particle.x > state.width + 10 ||
      particle.y < -10 ||
      particle.y > state.height + 10 ||
      particle.age > particle.life
    ) {
      particle.x = random(0, state.width);
      particle.y = random(0, state.height);
      particle.px = particle.x;
      particle.py = particle.y;
      particle.age = 0;
    }

    const lifeFade = Math.sin((particle.age / particle.life) * Math.PI);
    ctx.strokeStyle = color(palette[particle.tint], 0.38 * lifeFade);
    ctx.beginPath();
    ctx.moveTo(particle.px, particle.py);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";

  if (pointer.active) {
    const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 120);
    gradient.addColorStop(0, color(palette[0], 0.08));
    gradient.addColorStop(1, color(palette[1], 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 120, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRibbons() {
  fade(0.12, "7, 8, 13");
  const palette = palettes[state.palette];
  const pointer = state.pointer;
  const energy = state.intensity / 100;
  const lines = 26;

  ctx.globalCompositeOperation = "lighter";
  ambientGlow(state.width * 0.72, state.height * 0.5, state.width * 0.5, palette[1], 0.03);
  for (let line = 0; line < lines; line += 1) {
    const yBase = ((line + 0.5) / lines) * state.height;
    const phase = line * 0.34 + state.time * (0.35 + energy * 0.45);
    const tone = palette[line % 3];
    ctx.strokeStyle = color(tone, 0.16 + energy * 0.12);
    ctx.lineWidth = line % 5 === 0 ? 2.3 : 1.05;
    ctx.beginPath();

    for (let x = -10; x <= state.width + 10; x += 9) {
      const distance = pointer.active ? Math.abs(x - pointer.x) : state.width;
      const influence = pointer.active ? Math.max(0, 1 - distance / 250) : 0;
      const pointerPull = influence * (pointer.y - yBase) * 0.38;
      const wave =
        Math.sin(x * 0.012 + phase) * (12 + energy * 21) +
        Math.sin(x * 0.004 - phase * 1.4) * 20 +
        Math.cos(x * 0.022 + line) * 5;
      const y = yBase + wave + pointerPull;
      if (x === -10) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";

  state.echoes = state.echoes.filter((echo) => echo.life > 0);
  for (const echo of state.echoes) {
    echo.radius += 2.5;
    echo.life -= 0.025;
    ctx.strokeStyle = color(palette[echo.tint], Math.max(0, echo.life) * 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(echo.x, echo.y, echo.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawOrbit(dt) {
  fade(0.09, "7, 8, 12");
  const palette = palettes[state.palette];
  const energy = state.intensity / 68;

  ctx.globalCompositeOperation = "lighter";
  ambientGlow(state.width * 0.68, state.height * 0.46, state.width * 0.48, palette[2], 0.025);
  state.suns.forEach((sun, index) => {
    sun.phase += 0.005 * dt;
    const pulse = 7 + Math.sin(sun.phase * 2) * 2 + sun.mass * 3;
    const glow = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, pulse * 7);
    glow.addColorStop(0, color(palette[index % palette.length], 0.8));
    glow.addColorStop(0.18, color(palette[index % palette.length], 0.2));
    glow.addColorStop(1, color(palette[index % palette.length], 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, pulse * 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color(palette[index % palette.length], 0.9);
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, Math.max(1.8, pulse * 0.24), 0, Math.PI * 2);
    ctx.fill();
  });

  for (const star of state.stars) {
    let nearest = null;
    let nearestDist = Infinity;
    for (const sun of state.suns) {
      const dx = sun.x - star.x;
      const dy = sun.y - star.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDist) {
        nearestDist = distSq;
        nearest = { sun, dx, dy };
      }
    }

    if (nearest) {
      const distance = Math.sqrt(nearestDist) || 1;
      const force = Math.min(0.055, (nearest.sun.mass * 3.8) / Math.max(distance, 40));
      star.vx += (nearest.dx / distance) * force * energy * dt;
      star.vy += (nearest.dy / distance) * force * energy * dt;
      const tangent = 0.008 * energy * dt;
      star.vx += (-nearest.dy / distance) * tangent;
      star.vy += (nearest.dx / distance) * tangent;
    }

    const speed = Math.hypot(star.vx, star.vy);
    if (speed > 2.4) {
      star.vx *= 2.4 / speed;
      star.vy *= 2.4 / speed;
    }
    const oldX = star.x;
    const oldY = star.y;
    star.x += star.vx * dt;
    star.y += star.vy * dt;

    if (star.x < -30 || star.x > state.width + 30 || star.y < -30 || star.y > state.height + 30) {
      star.x = random(0, state.width);
      star.y = random(0, state.height);
      star.vx = random(-0.15, 0.15);
      star.vy = random(-0.15, 0.15);
    }

    const twinkle = 0.3 + Math.sin(state.time * 2 + star.phase) * 0.16;
    ctx.strokeStyle = color(palette[Math.floor(star.phase) % 3], twinkle);
    ctx.lineWidth = star.size * 0.45;
    ctx.beginPath();
    ctx.moveTo(oldX, oldY);
    ctx.lineTo(star.x, star.y);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}

function frame(now) {
  const elapsed = Math.min(32, now - state.lastTime);
  state.lastTime = now;
  const dt = elapsed / 16.667;

  if (!state.paused) {
    state.time += elapsed / 1000;
    if (state.scene === "nebula") drawNebula(dt);
    if (state.scene === "ribbons") drawRibbons(dt);
    if (state.scene === "orbit") drawOrbit(dt);
  }
  requestAnimationFrame(frame);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.px = state.pointer.x;
  state.pointer.py = state.pointer.y;
  state.pointer.x = event.clientX - rect.left;
  state.pointer.y = event.clientY - rect.top;
  state.pointer.active = true;
}

canvas.addEventListener("pointermove", pointerPosition);
canvas.addEventListener("pointerenter", pointerPosition);
canvas.addEventListener("pointerleave", () => {
  state.pointer.active = false;
  state.pointer.down = false;
});
canvas.addEventListener("pointerdown", (event) => {
  pointerPosition(event);
  state.pointer.down = true;
  if (state.scene === "orbit") {
    state.suns.push({
      x: state.pointer.x,
      y: state.pointer.y,
      mass: random(0.55, 1.45),
      phase: random(0, Math.PI * 2),
    });
    if (state.suns.length > 7) state.suns.shift();
  }
  if (state.scene === "ribbons") {
    for (let i = 0; i < 4; i += 1) {
      state.echoes.push({
        x: state.pointer.x,
        y: state.pointer.y,
        radius: i * 12,
        life: 1 - i * 0.12,
        tint: i % 3,
      });
    }
  }
});
window.addEventListener("pointerup", () => {
  state.pointer.down = false;
});

document.querySelectorAll(".scene-option").forEach((button) => {
  button.addEventListener("click", () => setScene(button.dataset.scene));
});

document.querySelectorAll(".palette").forEach((button) => {
  button.addEventListener("click", () => setPalette(button.dataset.palette));
});

ui.intensity.addEventListener("input", updateRange);
document.querySelector("#pause-button").addEventListener("click", togglePause);
document.querySelector("#reset-button").addEventListener("click", resetScene);
document.querySelector("#save-button").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `kinetic-canvas-${state.scene}-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

window.addEventListener("keydown", (event) => {
  const tag = event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (event.code === "Space") {
    event.preventDefault();
    togglePause();
  }
  if (event.key.toLowerCase() === "r") resetScene();
  if (event.key.toLowerCase() === "s") document.querySelector("#save-button").click();
  if (["1", "2", "3"].includes(event.key)) {
    setScene(["nebula", "ribbons", "orbit"][Number(event.key) - 1]);
  }
});

window.addEventListener("resize", resize);
document.querySelector("#year").textContent = new Date().getFullYear();
updateRange();
resize();
requestAnimationFrame(frame);
