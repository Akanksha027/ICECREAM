/** Judge/demo tooling — off by default so the storefront stays customer-facing. */

const STORAGE_KEY = "sweetdrip_demo";

export function readDemoModeFromUrl(): boolean | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("demo");
  if (q === null) return null;
  return q === "1" || q === "true" || q === "yes";
}

export function getDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const fromUrl = readDemoModeFromUrl();
  if (fromUrl !== null) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, fromUrl ? "1" : "0");
    } catch {
      /* ignore */
    }
    return fromUrl;
  }
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDemoMode(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  if (on) url.searchParams.set("demo", "true");
  else url.searchParams.delete("demo");
  window.history.replaceState({}, "", url.toString());
  window.dispatchEvent(new CustomEvent("sweetdrip-demo", { detail: on }));
}
