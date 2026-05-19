const ROOT_ID = "pause-extension-root";

function getHost() {
  try {
    return window.location.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function removeOverlay() {
  document.getElementById(ROOT_ID)?.remove();
  document.documentElement.classList.remove("pause-extension-active");
}

function createOverlay({ title, message, snoozeMinutes }) {
  removeOverlay();

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "pause-title");

  const backdrop = document.createElement("div");
  backdrop.className = "pause-backdrop";

  const card = document.createElement("div");
  card.className = "pause-card";

  const icon = document.createElement("div");
  icon.className = "pause-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="13" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
      <rect x="10" y="8" width="3" height="12" rx="1.5" fill="currentColor"/>
      <rect x="15" y="8" width="3" height="12" rx="1.5" fill="currentColor"/>
    </svg>
  `;

  const titleEl = document.createElement("h1");
  titleEl.id = "pause-title";
  titleEl.className = "pause-title";
  titleEl.textContent = title || "Pause";

  const messageEl = document.createElement("p");
  messageEl.className = "pause-message";
  messageEl.textContent = message || "";

  const actions = document.createElement("div");
  actions.className = "pause-actions";

  const snoozeMins = snoozeMinutes || 10;

  const continueBtn = document.createElement("button");
  continueBtn.type = "button";
  continueBtn.className = "pause-btn pause-btn-primary";
  continueBtn.textContent = "I'll refocus";

  const snoozeBtn = document.createElement("button");
  snoozeBtn.type = "button";
  snoozeBtn.className = "pause-btn pause-btn-secondary";
  snoozeBtn.textContent = `Snooze ${snoozeMins} min`;

  const hint = document.createElement("p");
  hint.className = "pause-hint";
  hint.textContent = "Pause · mindful browsing";

  actions.append(continueBtn, snoozeBtn);
  card.append(icon, titleEl, messageEl, actions, hint);
  root.append(backdrop, card);

  document.documentElement.classList.add("pause-extension-active");
  document.body.appendChild(root);

  requestAnimationFrame(() => root.classList.add("pause-visible"));

  const host = getHost();

  continueBtn.addEventListener("click", () => {
    removeOverlay();
    chrome.runtime.sendMessage({ type: "PAUSE_DISMISSED" });
  });

  snoozeBtn.addEventListener("click", () => {
    removeOverlay();
    chrome.runtime.sendMessage({
      type: "PAUSE_SNOOZED",
      host,
      minutes: snoozeMins,
    });
  });

  backdrop.addEventListener("click", () => continueBtn.click());

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") continueBtn.click();
    },
    { once: true }
  );
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_PAUSE") {
    createOverlay({
      title: message.title,
      message: message.message,
      snoozeMinutes: message.snoozeMinutes,
    });
  }
});
