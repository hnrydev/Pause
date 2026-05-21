import {
  DEFAULT_SETTINGS,
  INTERVAL_PRESETS,
  SNOOZE_PRESETS,
} from "../shared/defaults.js";
import { normalizeDomain } from "../shared/match.js";

let settings = { ...DEFAULT_SETTINGS };
let saveTimer = null;

const $ = (id) => document.getElementById(id);

async function loadSettings() {
  const { settings: stored } = await chrome.storage.sync.get("settings");
  settings = { ...DEFAULT_SETTINGS, ...stored };
  render();
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await chrome.storage.sync.set({ settings });
    chrome.runtime.sendMessage({ type: "RESET_TRACKER" });
  }, 280);
}

function renderPresets(containerId, presets, selected, onSelect) {
  const el = $(containerId);
  el.innerHTML = "";
  presets.forEach((preset) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-btn" + (preset.value === selected ? " active" : "");
    btn.textContent = preset.label;
    btn.addEventListener("click", () => {
      onSelect(preset.value);
      renderPresets(containerId, presets, preset.value, onSelect);
    });
    el.appendChild(btn);
  });
}

function renderSites() {
  const list = $("site-list");
  list.innerHTML = "";
  settings.sites.forEach((site) => {
    const li = document.createElement("li");
    li.className = "chip";
    li.innerHTML = `<span>${site}</span>`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${site}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      settings.sites = settings.sites.filter((s) => s !== site);
      renderSites();
      scheduleSave();
    });
    li.appendChild(remove);
    list.appendChild(li);
  });
  $("site-count").textContent = String(settings.sites.length);
}

function updateModeUI(mode) {
  document.querySelectorAll(".segmented-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  $("sites-section").classList.toggle("disabled", mode === "all");
}

function setMode(mode, { save = true } = {}) {
  settings.mode = mode;
  updateModeUI(mode);
  if (save) scheduleSave();
}

function updateSnoozePhraseUI() {
  $("snooze-phrase-field").classList.toggle("disabled", !settings.snoozeRequireRetype);
}

function render() {
  $("enabled").checked = settings.enabled;
  $("close-tab-on-refocus").checked = settings.closeTabOnRefocus;
  $("snooze-require-retype").checked = settings.snoozeRequireRetype;
  $("snooze-retype-phrase").value = settings.snoozeRetypePhrase;
  updateSnoozePhraseUI();
  $("title").value = settings.title;
  $("message").value = settings.message;
  updateModeUI(settings.mode);
  renderSites();

  renderPresets("interval-presets", INTERVAL_PRESETS, settings.intervalMinutes, (v) => {
    settings.intervalMinutes = v;
    scheduleSave();
  });

  renderPresets("snooze-presets", SNOOZE_PRESETS, settings.snoozeMinutes, (v) => {
    settings.snoozeMinutes = v;
    scheduleSave();
  });
}

function addSite(raw) {
  const site = normalizeDomain(raw);
  if (!site) return;
  if (!settings.sites.includes(site)) {
    settings.sites.push(site);
    settings.sites.sort();
  }
  $("site-input").value = "";
  renderSites();
  scheduleSave();
}

$("enabled").addEventListener("change", (e) => {
  settings.enabled = e.target.checked;
  scheduleSave();
});

$("close-tab-on-refocus").addEventListener("change", (e) => {
  settings.closeTabOnRefocus = e.target.checked;
  scheduleSave();
});

$("snooze-require-retype").addEventListener("change", (e) => {
  settings.snoozeRequireRetype = e.target.checked;
  updateSnoozePhraseUI();
  scheduleSave();
});

$("snooze-retype-phrase").addEventListener("input", (e) => {
  settings.snoozeRetypePhrase = e.target.value;
  scheduleSave();
});

$("title").addEventListener("input", (e) => {
  settings.title = e.target.value;
  scheduleSave();
});

$("message").addEventListener("input", (e) => {
  settings.message = e.target.value;
  scheduleSave();
});

document.querySelectorAll(".segmented-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

$("add-site").addEventListener("click", () => addSite($("site-input").value));
$("site-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addSite($("site-input").value);
  }
});

$("preview").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const payload = {
    type: "SHOW_PAUSE",
    title: settings.title,
    message: settings.message,
    snoozeMinutes: settings.snoozeMinutes,
    closeTabOnRefocus: settings.closeTabOnRefocus,
    snoozeRequireRetype: settings.snoozeRequireRetype,
    snoozeRetypePhrase: settings.snoozeRetypePhrase,
  };
  try {
    await chrome.tabs.sendMessage(tab.id, payload);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/overlay.js"],
    });
    await chrome.tabs.sendMessage(tab.id, payload);
  }
  window.close();
});

$("reset-timer").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "RESET_TRACKER" });
  const btn = $("reset-timer");
  const prev = btn.textContent;
  btn.textContent = "Timer reset";
  setTimeout(() => {
    btn.textContent = prev;
  }, 1200);
});

loadSettings();
