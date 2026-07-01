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

// Open on card click / keyboard, but not when clicking the "View code" link.
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", (e) => {
    if (e.target.closest(".code-link")) return;
    openModal(card);
  });
  card.addEventListener("keydown", (e) => {
    if (e.target.closest(".code-link")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(card);
    }
  });
});

// Close interactions.
modal.querySelectorAll("[data-close]").forEach((el) =>
  el.addEventListener("click", closeModal)
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});
