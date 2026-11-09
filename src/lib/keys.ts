// Key names spelled out where a symbol alone confused testers (feedback,
// 2026-11-09: several couldn't read "⌥F"). Macs label the key "option",
// other keyboards "Alt".

export const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export const ALT = isMac ? "Option" : "Alt"

// The "come back to" shortcut, as shown on buttons and hints.
export const FLAG_KEYS = `${ALT} F`
