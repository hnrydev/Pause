export const DEFAULT_SETTINGS = {
  enabled: true,
  mode: "specific",
  sites: ["x.com", "twitter.com", "youtube.com", "reddit.com", "instagram.com", "facebook.com"],
  intervalMinutes: 20,
  title: "Pause",
  message:
    "Are you spending your time most efficiently? Maybe there's something better worth your attention.",
  snoozeMinutes: 10,
  closeTabOnRefocus: false,
  snoozeRequireRetype: false,
  snoozeRetypePhrase: "I choose to continue",
};

export const INTERVAL_PRESETS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "20 min", value: 20 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
];

export const SNOOZE_PRESETS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
];
