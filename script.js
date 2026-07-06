// Theme: respect saved choice, else system preference.
const root = document.documentElement;
const saved = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
root.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));

document.getElementById("theme-toggle").addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

// Current year in footer.
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Project detail modal ----
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalStatus = document.getElementById("modal-status");
const modalBody = document.getElementById("modal-body");
const modalCode = document.getElementById("modal-code");
let lastFocused = null;

function openModal(card) {
  const title = card.querySelector("h3").textContent;
  const statusEl = card.querySelector(".status");
  const detail = card.querySelector("template.detail");
  const codeUrl = card.querySelector(".code-link").href;

  modalTitle.textContent = title;
  modalStatus.textContent = statusEl.textContent;
  modalStatus.className = "status " + [...statusEl.classList].filter((c) => c !== "status").join(" ");
  modalBody.replaceChildren(detail.content.cloneNode(true));
  modalCode.href = codeUrl;

  lastFocused = document.activeElement;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modal.querySelector(".modal-close").focus();
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

// ---- Project carousel ----
// A continuously drifting deck. `pos` is a float position over the cards;
// every frame each card's transform, blur and opacity are interpolated from
// its wrapped distance to `pos`, so the deck is always in slow motion.
const carousel = document.querySelector(".carousel");
const stage = document.querySelector(".carousel-stage");
const cards = [...document.querySelectorAll(".carousel .card")];
const dotsBox = document.querySelector(".carousel-dots");
const isStacked = () => window.matchMedia("(max-width: 720px)").matches;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const N = cards.length;
const DRIFT_SPEED = 0.08; // cards per second while idle

let pos = 0;
let seekTarget = null;
let lastInteraction = 0;
let carouselVisible = false;
let wasStacked = null;

const markInteraction = () => (lastInteraction = Date.now());

cards.forEach((_, i) => {
  const dot = document.createElement("button");
  dot.setAttribute("aria-label", `Go to project ${i + 1}`);
  dot.addEventListener("click", () => seek(i));
  dotsBox.appendChild(dot);
});
const dots = [...dotsBox.children];

function wrapDelta(i) {
  let d = (((i - pos) % N) + N) % N;
  if (d > N / 2) d -= N;
  return d;
}

function nearestIndex() {
  return ((Math.round(pos) % N) + N) % N;
}

function seek(i) {
  seekTarget = pos + wrapDelta(i);
  if (reducedMotion) {
    pos = seekTarget;
    seekTarget = null;
  }
  markInteraction();
}

function render() {
  const nearest = nearestIndex();
  cards.forEach((card, i) => {
    const off = wrapDelta(i);
    const d = Math.min(Math.abs(off), 2);
    const sign = off < 0 ? -1 : 1;
    const x = d <= 1 ? off * 64 : sign * (64 + (d - 1) * 48);
    const scale = d <= 1 ? 1 - 0.18 * d : 0.82 - 0.14 * (d - 1);
    const blur = d <= 1 ? 3 * d : 3 + 2 * (d - 1);
    const opacity = d <= 1 ? 1 - 0.45 * d : 0.55 - 0.2 * (d - 1);
    card.style.transform = `translate(calc(-50% + ${x.toFixed(2)}%), -50%) scale(${scale.toFixed(3)})`;
    card.style.filter = blur < 0.15 ? "none" : `blur(${blur.toFixed(2)}px)`;
    card.style.opacity = opacity.toFixed(3);
    card.style.zIndex = String(Math.round((2 - d) * 10));
    card.classList.toggle("is-active", i === nearest);
  });
  dots.forEach((dot, i) => dot.classList.toggle("active", i === nearest));
}

function clearInlineStyles() {
  cards.forEach((card) => {
    card.classList.remove("is-active");
    card.style.transform = "";
    card.style.filter = "";
    card.style.opacity = "";
    card.style.zIndex = "";
  });
}

function setStageHeight() {
  if (isStacked()) return;
  let maxH = 0;
  cards.forEach((card) => (maxH = Math.max(maxH, card.offsetHeight)));
  stage.style.height = maxH + 48 + "px";
}

document.querySelectorAll(".carousel-arrow").forEach((btn) =>
  btn.addEventListener("click", () => seek(nearestIndex() + Number(btn.dataset.dir)))
);

// Card click: focus it if it's on the side, open the modal if it's front and
// center (or if the carousel is stacked on small screens). Ignore "View code".
cards.forEach((card, i) => {
  const activate = () => {
    if (!isStacked() && i !== nearestIndex()) {
      seek(i);
    } else {
      openModal(card);
    }
  };
  card.addEventListener("click", (e) => {
    if (e.target.closest(".code-link")) return;
    activate();
  });
  card.addEventListener("keydown", (e) => {
    if (e.target.closest(".code-link")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  });
});

// Arrow keys steer the carousel while it's in view and no modal is open.
document.addEventListener("keydown", (e) => {
  if (modal.classList.contains("open") || isStacked()) return;
  if (e.target.matches("input, textarea")) return;
  if (e.key === "ArrowLeft") seek(nearestIndex() - 1);
  if (e.key === "ArrowRight") seek(nearestIndex() + 1);
});

carousel.addEventListener("pointerdown", markInteraction);
carousel.addEventListener("keydown", markInteraction);

new IntersectionObserver(
  (entries) => {
    carouselVisible = entries[0].isIntersecting;
  },
  { threshold: 0.3 }
).observe(stage);

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  const stacked = isStacked();
  if (stacked !== wasStacked) {
    wasStacked = stacked;
    if (stacked) {
      stage.style.height = "";
      clearInlineStyles();
    } else {
      setStageHeight();
    }
  }
  if (!stacked) {
    if (seekTarget !== null) {
      // Ease toward a manually chosen card.
      pos += (seekTarget - pos) * Math.min(1, dt * 8);
      if (Math.abs(seekTarget - pos) < 0.002) {
        pos = seekTarget;
        seekTarget = null;
      }
    } else {
      const engaged =
        document.hidden ||
        !carouselVisible ||
        modal.classList.contains("open") ||
        carousel.matches(":hover") ||
        carousel.querySelector(":focus-visible") !== null ||
        Date.now() - lastInteraction < 8000;
      if (!engaged && !reducedMotion) {
        pos += DRIFT_SPEED * dt;
      } else {
        // While the visitor is engaged, settle on the nearest card so the
        // front of the deck is crisp instead of frozen mid-drift.
        pos += (Math.round(pos) - pos) * Math.min(1, dt * 5);
      }
    }
    render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Fonts and images can shift card sizes after load; keep the stage honest.
window.addEventListener("load", setStageHeight);
window.addEventListener("resize", setStageHeight);

// ---- Interactive terminal ----
const termInput = document.getElementById("term-input");
const termOut = document.getElementById("term-output");
const termScroll = document.getElementById("term-scroll");
const termHistory = [];
let termHistPos = 0;

document.querySelector(".terminal").addEventListener("click", () => {
  if (window.getSelection().toString()) return; // don't steal text selections
  termInput.focus({ preventScroll: true });
});

function termPrint(text, cls) {
  const line = document.createElement("span");
  if (cls) line.className = cls;
  line.textContent = text + "\n";
  termOut.appendChild(line);
}

function termEcho(cmd) {
  const line = document.createElement("span");
  line.className = "t-cmd";
  const dollar = document.createElement("span");
  dollar.className = "dollar";
  dollar.textContent = "$ ";
  line.appendChild(dollar);
  line.appendChild(document.createTextNode(cmd + "\n"));
  termOut.appendChild(line);
}

const PROJECT_ALIASES = {
  votium: "votium",
  timeseries: "timeseries",
  airtrail: "airtrail-gke",
  "airtrail-gke": "airtrail-gke",
  xicochain: "xicochain",
};

function termRun(raw) {
  const cmd = raw.trim();
  termEcho(cmd);
  if (!cmd) return;
  const [name, ...args] = cmd.split(/\s+/);
  const arg = args.join(" ");

  if (name === "help") {
    termPrint(
      "available commands:\n" +
        "  ls projects        list the projects\n" +
        "  open <project>     e.g. open votium\n" +
        "  cat about.txt      who is this guy\n" +
        "  whoami             you know this one\n" +
        "  pwd                where are we\n" +
        "  clear              wipe the screen"
    );
  } else if (name === "ls") {
    termPrint("votium  timeseries  airtrail-gke  xicochain");
  } else if (name === "open") {
    const slug = PROJECT_ALIASES[arg.toLowerCase()];
    const card = slug && document.querySelector(`[data-project="${slug}"]`);
    if (card) {
      termPrint("opening " + slug + " ...");
      openModal(card);
    } else {
      termPrint("open: no such project: " + (arg || "(none)") + " (try: ls)", "t-err");
    }
  } else if (name === "cat") {
    if (arg === "about.txt") {
      termPrint(
        "Software engineering student from Portugal.\n" +
          "Distributed systems, blockchains and the cloud that runs them.\n" +
          "Likes problems where correctness actually matters."
      );
    } else {
      termPrint("cat: " + (arg || "(none)") + ": No such file or directory", "t-err");
    }
  } else if (name === "whoami") {
    termPrint("francisco");
  } else if (name === "pwd") {
    termPrint("/home/francisco/portfolio");
  } else if (name === "tree") {
    termPrint("it's right above you ^");
  } else if (name === "sudo") {
    termPrint("sudo: permission denied (nice try)", "t-err");
  } else if (name === "clear") {
    termOut.replaceChildren();
  } else {
    termPrint("command not found: " + name + " (try: help)", "t-err");
  }
}

termInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const value = termInput.value;
    if (value.trim()) {
      termHistory.push(value);
    }
    termHistPos = termHistory.length;
    termInput.value = "";
    termRun(value);
    termScroll.scrollTop = termScroll.scrollHeight;
  } else if (e.key === "ArrowUp") {
    if (termHistPos > 0) {
      termHistPos--;
      termInput.value = termHistory[termHistPos];
      e.preventDefault();
    }
  } else if (e.key === "ArrowDown") {
    if (termHistPos < termHistory.length - 1) {
      termHistPos++;
      termInput.value = termHistory[termHistPos];
    } else {
      termHistPos = termHistory.length;
      termInput.value = "";
    }
    e.preventDefault();
  }
});

// ---- Scroll reveal ----
const revealEls = document.querySelectorAll(
  ".about .section-title, .about-text, .terminal, .projects-eyebrow, .projects-title, .carousel, .contact-text, .contact-actions"
);
if (
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  revealEls.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));
}

// Close interactions.
modal.querySelectorAll("[data-close]").forEach((el) =>
  el.addEventListener("click", closeModal)
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});
