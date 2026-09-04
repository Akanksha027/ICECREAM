/** Light multi-brand switch for dual-store demos. */

export type StoreBrand = {
  id: string
  name: string
  tagline: string
  currency: "USD" | "INR"
  currencySymbol: string
  fxToInr: number
}

export const BRANDS: StoreBrand[] = [
  {
    id: "sundae",
    name: "Sundae & Co.",
    tagline: "Small-batch ice cream & cookies",
    currency: "USD",
    currencySymbol: "$",
    fxToInr: 83,
  },
  {
    id: "bean",
    name: "Bean & Batter",
    tagline: "Coffee + cookies across the street",
    currency: "INR",
    currencySymbol: "₹",
    fxToInr: 1,
  },
]

const KEY = "sweetdrip_brand"

export function getBrandId(): string {
  if (typeof window === "undefined") return "sundae"
  return window.localStorage.getItem(KEY) || "sundae"
}

export function setBrandId(id: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, id)
  window.dispatchEvent(new CustomEvent("sweetdrip-brand", { detail: id }))
}

export function getBrand(): StoreBrand {
  return BRANDS.find((b) => b.id === getBrandId()) || BRANDS[0]
}
