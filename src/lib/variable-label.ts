import type { Variable } from "@/data/types"

// Whether a Variable's code is worth showing next to its name. It's hidden
// when it's a long dictionary key (has "_") or only repeats the name, e.g.
// "Lambda (2)" / Lambda, "Ilium shape" / IliumShape (feedback, 2026-11-09).
const bare = (s: string) => s.replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase()

export function showsCode(v: Pick<Variable, "code" | "name">): boolean {
  return !/_/.test(v.code) && bare(v.code) !== bare(v.name)
}

// "Name · CODE", or just the name when the code adds nothing.
export function nameWithCode(v: Pick<Variable, "code" | "name">, sep = " · "): string {
  return showsCode(v) ? `${v.name}${sep}${v.code}` : v.name
}
