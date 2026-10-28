import { useSyncExternalStore } from "react"

// GitHub Pages has no SPA fallback, so routes live in the hash: /#/kitchen-sink
function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

function getRoute() {
  return window.location.hash.replace(/^#/, "") || "/"
}

export function useHashRoute() {
  return useSyncExternalStore(subscribe, getRoute)
}
