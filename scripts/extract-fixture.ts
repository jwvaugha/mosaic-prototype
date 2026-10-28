// Builds src/data/fixture.json and src/data/image-manifest.json from the MOSAIC
// reference files, and copies the real images to public/ref-images/ (git-ignored).
//
// Local only: needs the MOSAIC References folder next to this repo, plus macOS
// `sips` (BMP → PNG) and poppler's `pdfimages` / `pdftotext`.
//
//   npm run fixture -- --references "../References"

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import XLSX from "xlsx"
import type {
  Bone,
  CharacterState,
  Fixture,
  Highlight,
  ImageAsset,
  ImageManifest,
  Section,
  Variable,
} from "../src/data/types"

const root = path.resolve(import.meta.dirname, "..")
const refArg = process.argv.indexOf("--references")
const REF = path.resolve(root, refArg > -1 ? process.argv[refArg + 1] : "../References")
const OUT_IMG = path.join(root, "public/ref-images")
const MMS_DIR = path.join(REF, "MOSAIC Photos/Cranial Images/Morphological/MMS line drawings")
const CRANIAL_XLSX = path.join(REF, "MOSAIC Photos/Cranial Images/MOSAIC_CranialVariables10.1.26.xlsx")
const POSTCRANIAL_XLSX = path.join(REF, "MOSAIC_PostcranialVariables.xlsx")
const POSTCRANIAL_PDF = path.join(REF, "MOSAIC Postcranial Metrics Data Collection Form.pdf")

// ---------------------------------------------------------------------------
// Scope: which Variables the prototype uses (spec: Scope of content)

const CRANIUM_MORPH_GROUPS: { id: string; name: string; codes: string[] }[] = [
  { id: "nasal", name: "Nasal aperture and bones", codes: ["NAS", "NAW", "NBS", "NBC", "ANS", "INA"] },
  { id: "midface", name: "Zygomatic and orbit", codes: ["ZS", "MT", "PZTub", "IOB", "ORB"] },
]

// DCP 2.0 numbers come from the postcranial form. Ranges are illustrative
// placeholders for out-of-bounds testing, not validated limits.
const LOWER_LIMB_METRIC: { bone: string; vars: { code: string; dcp: number; range: [number, number] }[] }[] = [
  {
    bone: "Femur",
    vars: [
      { code: "FemXL", dcp: 75, range: [340, 560] },
      { code: "FemBL", dcp: 76, range: [335, 555] },
      { code: "FemEB", dcp: 77, range: [60, 100] },
      { code: "FemHXD", dcp: 78, range: [35, 60] },
      { code: "FemMXD", dcp: 81, range: [20, 40] },
      { code: "FemMWD", dcp: 82, range: [18, 36] },
    ],
  },
  {
    bone: "Tibia",
    vars: [
      { code: "TibCML", dcp: 86, range: [270, 470] },
      { code: "TibPEB", dcp: 87, range: [55, 90] },
      { code: "TibDEB", dcp: 88, range: [38, 60] },
      { code: "TibMXD", dcp: 89, range: [22, 40] },
    ],
  },
]

// Figures in the postcranial form, by page. Highlight boxes are fractions of
// the figure, estimated by eye from the DCP number labels in each drawing.
const FIGURES: { page: number; caption: string; boxes: Record<number, Highlight> }[] = [
  {
    page: 15,
    caption: "DCP 2.0 fig. 3.22 · Maximum length and epicondylar breadth of the femur",
    boxes: {
      75: { x: 0.03, y: 0.7, w: 0.9, h: 0.12 },
      77: { x: 0.89, y: 0.08, w: 0.09, h: 0.52 },
      78: { x: 0.03, y: 0.42, w: 0.11, h: 0.31 },
      79: { x: 0.24, y: 0.06, w: 0.05, h: 0.36 },
    },
  },
  {
    page: 17,
    caption: "DCP 2.0 fig. 3.23 · Bicondylar length and midshaft circumference of the femur",
    boxes: {
      76: { x: 0.04, y: 0.7, w: 0.92, h: 0.17 },
      83: { x: 0.46, y: 0.2, w: 0.08, h: 0.2 },
    },
  },
  {
    page: 20,
    caption: "DCP 2.0 fig. 3.25 · Selected measurements of the tibia",
    boxes: {
      86: { x: 0.07, y: 0.68, w: 0.84, h: 0.16 },
      87: { x: 0.02, y: 0.07, w: 0.12, h: 0.62 },
      88: { x: 0.81, y: 0.15, w: 0.17, h: 0.45 },
      91: { x: 0.46, y: 0.3, w: 0.07, h: 0.24 },
    },
  },
]

// ---------------------------------------------------------------------------

type Row = (string | number)[]

function sheetRows(file: string, sheet: string): Row[] {
  const wb = XLSX.readFile(file)
  return XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheet], { header: 1, defval: "" }).slice(1)
}

const clean = (v: unknown) => String(v ?? "").trim()
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Morph sheet: a trait row followed by continuation rows, one per Character state.
function readCranialMorph() {
  const traits = new Map<string, { name: string; method: string; states: CharacterState[] }>()
  let current: { name: string; method: string; states: CharacterState[] } | null = null
  for (const r of sheetRows(CRANIAL_XLSX, "Morphological Variables")) {
    const [name, abbr, method, desc, state, label] = r.map(clean)
    if (name) {
      current = { name: sentenceCase(desc), method, states: [] }
      traits.set(abbr || name, current)
    }
    if (current && state !== "" && !state.startsWith("Ordinal")) {
      current.states.push({ code: state, label })
    }
  }
  return traits
}

function readPostcranialMetricNames() {
  const names = new Map<string, string>()
  for (const r of sheetRows(POSTCRANIAL_XLSX, "Metric Variables")) {
    const [code, measurement] = r.map(clean)
    if (code) names.set(code, sentenceCase(measurement))
  }
  return names
}

// "32 Maximum Length of the Femur (DCP 2.0 #75): The distance from … Instrument:
// osteometric board Comment: … Enter your answer" → { 75: {title, definition, instrument} }
function readDcpDefinitions() {
  const text = execFileSync("pdftotext", ["-f", "14", "-l", "23", POSTCRANIAL_PDF, "-"], {
    encoding: "utf8",
  })
    .replace(/\d+\/\d+\/\d+, \d+:\d+ [AP]M MOSAIC Postcranial Metrics Data Collection Form/g, " ")
    .replace(/https:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
  const defs = new Map<number, { title: string; definition: string; instrument?: string }>()
  const re = /\d+ ([A-Z][A-Za-z\- ]+?) \(DCP(?: 2\.0)? #(\d+)\)(?: \([^)]*\))?:\s*(.+?)(?= Enter your answer|$)/g
  for (const m of text.matchAll(re)) {
    const body = m[3]
    const definition = body.split(/ (?:Instrument|Comment):/)[0].trim()
    const instrument = body.match(/Instrument: (.+?)(?= Comment:|$)/)?.[1].trim()
    defs.set(Number(m[2]), { title: m[1].trim(), definition, instrument })
  }
  return defs
}

async function toWebp(srcFile: string, outRel: string): Promise<ImageAsset> {
  const outFile = path.join(OUT_IMG, outRel)
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  let input = srcFile
  if (srcFile.toLowerCase().endsWith(".bmp")) {
    // sharp has no BMP decoder; sips ships with macOS.
    input = path.join(os.tmpdir(), `mosaic-${path.basename(srcFile)}.png`)
    execFileSync("sips", ["-s", "format", "png", srcFile, "--out", input], { stdio: "ignore" })
  }
  const info = await sharp(input).webp({ quality: 85 }).toFile(outFile)
  return { src: `ref-images/${outRel}`, width: info.width, height: info.height }
}

async function main() {
  const report: string[] = []
  const variables: Record<string, Variable> = {}
  const manifest: ImageManifest = {}
  const sections: Section[] = []
  fs.rmSync(OUT_IMG, { recursive: true, force: true })

  // Cranium · Morphological (MMS, one image per Character state)
  const traits = readCranialMorph()
  const mmsFiles = fs.readdirSync(MMS_DIR).filter((f) => f.endsWith(".bmp"))
  const morphBones: Bone[] = []
  for (const group of CRANIUM_MORPH_GROUPS) {
    const ids: string[] = []
    for (const code of group.codes) {
      const t = traits.get(code)
      if (!t) throw new Error(`Cranial sheet has no MMS trait ${code}`)
      variables[code] = { id: code, code, name: t.name, modality: "morph", method: t.method, states: t.states }
      ids.push(code)

      const states: Record<string, ImageAsset> = {}
      const missing: string[] = []
      for (const s of t.states) {
        const file = mmsFiles.find((f) => f === `${code}_${s.code}.bmp`)
        if (file) states[s.code] = await toWebp(path.join(MMS_DIR, file), `mms/${code}_${s.code}.webp`)
        else missing.push(s.code)
      }
      const extra = mmsFiles
        .filter((f) => f.startsWith(`${code}_`))
        .map((f) => f.slice(code.length + 1, -4))
        .filter((s) => !t.states.some((st) => st.code === s))
      manifest[code] = Object.keys(states).length ? { kind: "states", states } : { kind: "none" }
      report.push(
        `| ${code} | Morph | ${Object.keys(states).length}/${t.states.length} states` +
          (missing.length ? `, missing ${missing.join(", ")}` : "") +
          (extra.length ? `, unmatched files ${extra.join(", ")}` : "") +
          " |",
      )
    }
    morphBones.push({ id: group.id, name: group.name, variableIds: ids })
  }
  sections.push({
    id: "cranium-morph",
    region: "Cranium",
    modality: "morph",
    title: "Cranium · Morphological",
    bones: morphBones,
  })

  // Lower limb · Metric (figures from the postcranial form)
  const names = readPostcranialMetricNames()
  const defs = readDcpDefinitions()
  const figTmp = fs.mkdtempSync(path.join(os.tmpdir(), "mosaic-fig-"))
  const figureByDcp = new Map<number, { asset: ImageAsset; caption: string; box: Highlight }>()
  for (const fig of FIGURES) {
    execFileSync("pdfimages", ["-png", "-f", String(fig.page), "-l", String(fig.page), POSTCRANIAL_PDF, path.join(figTmp, `p${fig.page}`)])
    const asset = await toWebp(path.join(figTmp, `p${fig.page}-000.png`), `dcp/page-${fig.page}.webp`)
    for (const [dcp, box] of Object.entries(fig.boxes)) {
      figureByDcp.set(Number(dcp), { asset, caption: fig.caption, box })
    }
  }
  const metricBones: Bone[] = []
  for (const bone of LOWER_LIMB_METRIC) {
    const ids: string[] = []
    for (const v of bone.vars) {
      const name = names.get(v.code)
      if (!name) throw new Error(`Postcranial sheet has no ${v.code}`)
      const def = defs.get(v.dcp)
      variables[v.code] = {
        id: v.code,
        code: v.code,
        name: def?.title ?? name,
        modality: "metric",
        unit: "mm",
        precision: 1,
        range: { min: v.range[0], max: v.range[1] },
        dcp: v.dcp,
        definition: def?.definition,
        instrument: def?.instrument,
      }
      ids.push(v.code)
      const fig = figureByDcp.get(v.dcp)
      manifest[v.code] = fig
        ? { kind: "figure", figure: fig.asset, caption: fig.caption, highlight: fig.box }
        : { kind: "none" }
      report.push(
        `| ${v.code} | Metric | ${fig ? `figure (${fig.caption.split(" · ")[0]})` : "none"}` +
          (def ? "" : ", no definition found") +
          " |",
      )
    }
    metricBones.push({ id: bone.bone.toLowerCase(), name: bone.bone, variableIds: ids })
  }
  sections.push({
    id: "lower-limb-metric",
    region: "Lower limb",
    modality: "metric",
    title: "Lower limb · Metric",
    bones: metricBones,
  })

  const fixture: Fixture = { generatedAt: new Date().toISOString().slice(0, 10), sections, variables }
  fs.writeFileSync(path.join(root, "src/data/fixture.json"), JSON.stringify(fixture, null, 2) + "\n")
  fs.writeFileSync(path.join(root, "src/data/image-manifest.json"), JSON.stringify(manifest, null, 2) + "\n")
  fs.writeFileSync(
    path.join(root, "scripts/manifest-report.md"),
    [
      "# Image manifest report",
      "",
      `Generated ${fixture.generatedAt} by \`npm run fixture\`.`,
      "",
      "| Variable | Modality | Reference |",
      "| --- | --- | --- |",
      ...report,
      "",
    ].join("\n"),
  )
  console.log(report.join("\n"))
}

await main()
