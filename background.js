import { DEFAULT_SETTINGS } from "./shared/defaults.js";
import { urlMatchesSettings } from "./shared/match.js";

const TICK_ALARM = "pause-tick";
const SESSION_KEY = "tracker";

async function getSettings() {
  const { settings } = await chrome.storage.sync.get("settings");
  return { ...DEFAULT_SETTINGS, ...settings };
}

async function getSession() {
  const data = await chrome.storage.session.get(SESSION_KEY);
  return (
    data[SESSION_KEY] ?? {
      accumulatedMs: 0,
      activeSince: null,
      activeTabId: null,
      activeHost: null,
    }
  );
}

async function setSession(session) {
  await chrome.storage.session.set({ [SESSION_KEY]: session });
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isSnoozed(host, snoozes) {
  if (!host || !snoozes?.[host]) return false;
  return Date.now() < snoozes[host];
}

async function getSnoozes() {
  const { snoozes } = await chrome.storage.local.get("snoozes");
  return snoozes ?? {};
}

async function stopTracking(session) {
  if (session.activeSince) {
    session.accumulatedMs += Date.now() - session.activeSince;
  }
  session.activeSince = null;
  session.activeTabId = null;
  session.activeHost = null;
  return session;
}

async function evaluateTab(tabId) {
  const settings = await getSettings();
  if (!settings.enabled) return;

  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    return;
  }

  if (!tab.url || !urlMatchesSettings(tab.url, settings)) {
    let session = await getSession();
    session = await stopTracking(session);
    await setSession(session);
    return;
  }

  const host = hostnameFromUrl(tab.url);
  const snoozes = await getSnoozes();
  if (isSnoozed(host, snoozes)) {
    let session = await getSession();
    session = await stopTracking(session);
    await setSession(session);
    return;
  }

  let session = await getSession();

  if (session.activeTabId !== tabId) {
    session = await stopTracking(session);
    session.activeTabId = tabId;
    session.activeHost = host;
    session.activeSince = Date.now();
    await setSession(session);
  }

  session = await getSession();
  if (session.activeSince) {
    session.accumulatedMs += Date.now() - session.activeSince;
    session.activeSince = Date.now();
    await setSession(session);
  }

  const updated = await getSession();
  const thresholdMs = settings.intervalMinutes * 60 * 1000;

  if (updated.accumulatedMs >= thresholdMs) {
    await showPauseOnTab(tabId, settings);
    updated.accumulatedMs = 0;
    updated.activeSince = Date.now();
    await setSession(updated);
  }
}

async function showPauseOnTab(tabId, settings) {
  const payload = {
    type: "SHOW_PAUSE",
    title: settings.title,
    message: settings.message,
    snoozeMinutes: settings.snoozeMinutes,
  };

  try {
    await chrome.tabs.sendMessage(tabId, payload);
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content/overlay.js"],
      });
      await chrome.tabs.sendMessage(tabId, payload);
    } catch (err) {
      console.warn("Pause: could not show overlay", err);
    }
  }
}

async function syncActiveTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active?.id) await evaluateTab(active.id);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === TICK_ALARM) await syncActiveTab();
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  let session = await getSession();
  session = await stopTracking(session);
  await setSession(session);
  await evaluateTab(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (active?.id === tabId) await evaluateTab(tabId);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    let session = await getSession();
    session = await stopTracking(session);
    await setSession(session);
    return;
  }
  await syncActiveTab();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === "PAUSE_DISMISSED") {
      let session = await getSession();
      session.accumulatedMs = 0;
      if (session.activeSince) session.activeSince = Date.now();
      await setSession(session);
      sendResponse({ ok: true });
    }

    if (message.type === "PAUSE_SNOOZED") {
      const host = message.host;
      const minutes = message.minutes ?? 10;
      const snoozes = await getSnoozes();
      if (host) snoozes[host] = Date.now() + minutes * 60 * 1000;
      await chrome.storage.local.set({ snoozes });

      let session = await getSession();
      session.accumulatedMs = 0;
      session = await stopTracking(session);
      await setSession(session);
      sendResponse({ ok: true });
    }

    if (message.type === "GET_SETTINGS") {
      sendResponse({ settings: await getSettings() });
    }

    if (message.type === "RESET_TRACKER") {
      await setSession({
        accumulatedMs: 0,
        activeSince: null,
        activeTabId: null,
        activeHost: null,
      });
      sendResponse({ ok: true });
    }
  })();
  return true;
});

async function init() {
  const settings = await getSettings();
  await chrome.alarms.create(TICK_ALARM, { periodInMinutes: 1 });
  const { settings: stored } = await chrome.storage.sync.get("settings");
  if (!stored) await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
}

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);
init();
