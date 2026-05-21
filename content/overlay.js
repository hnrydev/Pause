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

function completeSnooze(host, snoozeMins) {
  removeOverlay();
  chrome.runtime.sendMessage({
    type: "PAUSE_SNOOZED",
    host,
    minutes: snoozeMins,
  });
}

function createOverlay({
  title,
  message,
  snoozeMinutes,
  closeTabOnRefocus,
  snoozeRequireRetype,
  snoozeRetypePhrase,
}) {
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

  const mainView = document.createElement("div");
  mainView.className = "pause-view pause-view-main";

  const snoozeView = document.createElement("div");
  snoozeView.className = "pause-view pause-view-snooze hidden";

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
  const host = getHost();
  const phrase = (snoozeRetypePhrase || "").trim();

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
  mainView.append(icon.cloneNode(true), titleEl, messageEl, actions, hint);

  const snoozeTitle = document.createElement("h2");
  snoozeTitle.className = "pause-snooze-title";
  snoozeTitle.textContent = "Retype to snooze";

  const snoozeHint = document.createElement("p");
  snoozeHint.className = "pause-message pause-snooze-hint";
  snoozeHint.textContent = "Type the phrase below exactly to snooze this reminder.";

  const phraseBox = document.createElement("p");
  phraseBox.className = "pause-phrase-box";
  phraseBox.textContent = phrase;

  const retypeInput = document.createElement("input");
  retypeInput.type = "text";
  retypeInput.className = "pause-retype-input";
  retypeInput.setAttribute("autocomplete", "off");
  retypeInput.setAttribute("spellcheck", "false");
  retypeInput.setAttribute("aria-label", "Retype phrase to snooze");
  retypeInput.placeholder = "Type phrase here…";

  const retypeError = document.createElement("p");
  retypeError.className = "pause-retype-error hidden";
  retypeError.textContent = "Phrase doesn't match. Try again.";

  const snoozeActions = document.createElement("div");
  snoozeActions.className = "pause-actions";

  const confirmSnoozeBtn = document.createElement("button");
  confirmSnoozeBtn.type = "button";
  confirmSnoozeBtn.className = "pause-btn pause-btn-primary";
  confirmSnoozeBtn.textContent = "Confirm snooze";

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "pause-btn pause-btn-secondary";
  backBtn.textContent = "Back";

  snoozeActions.append(confirmSnoozeBtn, backBtn);
  snoozeView.append(snoozeTitle, snoozeHint, phraseBox, retypeInput, retypeError, snoozeActions);

  card.append(mainView, snoozeView);
  root.append(backdrop, card);

  document.documentElement.classList.add("pause-extension-active");
  document.body.appendChild(root);

  requestAnimationFrame(() => root.classList.add("pause-visible"));

  function showMainView() {
    mainView.classList.remove("hidden");
    snoozeView.classList.add("hidden");
    retypeInput.value = "";
    retypeError.classList.add("hidden");
    titleEl.id = "pause-title";
  }

  function showSnoozeView() {
    mainView.classList.add("hidden");
    snoozeView.classList.remove("hidden");
    retypeInput.value = "";
    retypeError.classList.add("hidden");
    titleEl.id = "";
    snoozeTitle.id = "pause-title";
    retypeInput.focus();
  }

  continueBtn.addEventListener("click", () => {
    removeOverlay();
    chrome.runtime.sendMessage({
      type: "PAUSE_DISMISSED",
      closeTab: Boolean(closeTabOnRefocus),
    });
  });

  snoozeBtn.addEventListener("click", () => {
    if (snoozeRequireRetype && phrase) {
      showSnoozeView();
      return;
    }
    completeSnooze(host, snoozeMins);
  });

  backBtn.addEventListener("click", showMainView);

  function tryConfirmSnooze() {
    if (retypeInput.value === phrase) {
      completeSnooze(host, snoozeMins);
      return;
    }
    retypeError.classList.remove("hidden");
    retypeInput.focus();
    retypeInput.select();
  }

  confirmSnoozeBtn.addEventListener("click", tryConfirmSnooze);
  retypeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryConfirmSnooze();
    }
  });

  backdrop.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_PAUSE") {
    createOverlay({
      title: message.title,
      message: message.message,
      snoozeMinutes: message.snoozeMinutes,
      closeTabOnRefocus: message.closeTabOnRefocus,
      snoozeRequireRetype: message.snoozeRequireRetype,
      snoozeRetypePhrase: message.snoozeRetypePhrase,
    });
  }
});
