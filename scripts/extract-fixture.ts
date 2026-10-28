// Builds src/data/fixture.json and src/data/image-manifest.json from the MOSAIC
// data dictionaries and reference files, and writes the reference images to
// public/ref-images/ (only mms/ is committed; see src/data/index.ts).
//
// Every Variable in the dictionaries becomes a field, grouped into the nine
// Regions × Metric/Morphological sections of the rail (requirements: Data
// entry design). Grouping into bones follows the dictionaries and the MSU
// data-collection forms.
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
  Modality,
  Section,
  Variable,
} from "../src/data/types"

const root = path.resolve(import.meta.dirname, "..")
const refArg = process.argv.indexOf("--references")
const REF = path.resolve(root, refArg > -1 ? process.argv[refArg + 1] : "../References")
const OUT_IMG = path.join(root, "public/ref-images")
const MMS_DIR = path.join(REF, "MOSAIC Photos/Cranial Images/Morphological/MMS line drawings")
const DENTAL_DIR = path.join(REF, "MOSAIC Photos/Dental Images/Morphological")
const CRANIAL_XLSX = path.join(REF, "MOSAIC Photos/Cranial Images/MOSAIC_CranialVariables10.1.26.xlsx")
const POSTCRANIAL_XLSX = path.join(REF, "MOSAIC_PostcranialVariables.xlsx")
const DENTAL_XLSX = path.join(REF, "MOSAIC Photos/Dental Images/Morphological/MOSAIC_DentalVariables.xlsx")
const POSTCRANIAL_PDF = path.join(REF, "MOSAIC Postcranial Metrics Data Collection Form.pdf")

// ---------------------------------------------------------------------------
// Grouping. Each section lists its bone groups by Variable name (the
// dictionary's first column). `bilateral` groups get the Side toggle.

type Group = { id: string; name: string; codes: string[]; bilateral?: boolean }
type SectionSpec = { id: string; region: string; modality: Modality; groups: Group[]; calculated?: string[] }

const CRANIAL_CALCULATED = [
  "FRF", "PAF", "OCF",
  "NAR", "SSR", "PRR", "DKR", "ZOR", "FMR", "EKR", "ZMR", "AVR", "BRR", "VRR", "LAR", "OSR", "BAR",
  "PRA", "BAA", "NBA", "BBA", "BRA", "SSA", "NFA", "DKA", "NDA", "SIA", "RFA", "RPA", "ROA", "BSA", "SBA", "SLA", "TBA",
  "NAA", "FRA", "PAA", "OCA",
]
const ANGLES = new Set(["PRA", "BAA", "NBA", "BBA", "BRA", "SSA", "NFA", "DKA", "NDA", "SIA", "RFA", "RPA", "ROA", "BSA", "SBA", "SLA", "TBA", "MAN"])

const SECTIONS: SectionSpec[] = [
  {
    id: "cranium-metric",
    region: "Cranium",
    modality: "metric",
    groups: [
      { id: "vault", name: "Vault and base", codes: ["GOL", "NOL", "BNL", "BBH", "XCB", "XFB", "WFB", "AUB", "ASB", "STB", "MDH", "GLS", "FOL", "FOB"] },
      { id: "vault-chords", name: "Vault chords and subtenses", codes: ["FRC", "FRS", "PAC", "PAS", "OCC", "OCS"] },
      { id: "face", name: "Face", codes: ["ZYB", "BPL", "NPH", "JUB", "MAB", "MAL", "ZMB", "SSS", "FMB", "NAS", "WMH", "IML", "XML", "MOW", "UFBR", "UFHT"] },
      { id: "orbit-nose", name: "Orbits and nose", codes: ["OBH", "OBB", "EKB", "DKB", "DKS", "NDS", "NLH", "NLB", "WNB", "SIS"] },
    ],
    calculated: CRANIAL_CALCULATED,
  },
  {
    id: "cranium-morph",
    region: "Cranium",
    modality: "morph",
    groups: [
      { id: "nasal", name: "Nasal aperture and bones", codes: ["NAShape", "NAWidth", "NBShape", "NBContour", "ANSpine", "INAperture", "NaOvg"] },
      { id: "midface", name: "Zygomatic and orbit", codes: ["ZSCourse", "MTub", "PZTub", "IOBreadth", "OrbShape"] },
      { id: "sex-traits", name: "Sex traits", codes: ["NC", "MP", "SOM", "GL"] },
      { id: "vault-palate", name: "Vault and palate", codes: ["NasFrntSut", "SnSut", "PBDep", "TPSut", "PalSh", "Parietal_depression", "Occipital_condyle_lipping"] },
      { id: "vault-sutures", name: "Vault sutures", codes: ["Midlambdoid", "Lambda", "Obelion", "Anterior_sagittal", "Bregma", "Midcoronal", "Pterion", "Sphenofrontal", "Inf_sphenotemporal", "Sup_sphenotemporal"] },
      { id: "maxillary-sutures", name: "Maxillary sutures", codes: ["IN", "AMP", "TP", "PMP", "GPF"] },
      { id: "sos", name: "Spheno-occipital synchondrosis", codes: ["SOS_fusion", "SOS_fusion_AdultAge"] },
    ],
  },
  {
    id: "mandible-metric",
    region: "Mandible",
    modality: "metric",
    groups: [{ id: "mandible", name: "Mandible", codes: ["GNI", "HML", "TML", "GOG", "CDL", "WRB", "XRH", "MLT", "MAN"] }],
  },
  {
    id: "mandible-morph",
    region: "Mandible",
    modality: "morph",
    groups: [
      {
        id: "mandible-traits",
        name: "Mandible",
        codes: ["Mandibular_torus", "Lower_border_of_mandible", "Chin_shape", "Gonial_angle_flare", "Ascending_ramus_profile", "PREI"],
      },
    ],
  },
  {
    id: "dentition-metric",
    region: "Dentition",
    modality: "metric",
    groups: [
      { id: "max-teeth", name: "Maxilla", codes: ["UCBL", "UCMD", "UM1BL", "UM1MD"] },
      { id: "mand-teeth", name: "Mandible", codes: ["LCBL", "LCMD", "LM1BL", "LM1MD"] },
    ],
  },
  // Dentition · Morphological groups are built from the dictionary below.
  {
    id: "vertebrae-morph",
    region: "Vertebrae",
    modality: "morph",
    groups: [
      { id: "c1", name: "Atlas (C1)", codes: ["C1_lipping", "C1_Eburnation"] },
      {
        id: "l1",
        name: "L1",
        codes: ["L1_spinous_process_flattening", "L1_superior_ring_fusion", "L1_inferior_ring_fusion", "L1_superior_surface_morphology", "L1_inferior_surface_morphology"],
      },
      {
        id: "l5",
        name: "L5",
        codes: ["L5_superior_ring_fusion", "L5_inferior_ring_fusion", "L5_superior_surface_morphology", "L5_inferior_surface_morphology", "L5_superior_margin", "L5_inferior_margin"],
      },
      {
        id: "column",
        name: "Vertebral column",
        codes: ["C3_C7_lipping", "T1_T12_lipping", "L1_L5_lipping", "C3_C7_candlewax", "T1_T12_candlewax", "L1_L5_candlewax", "C3_C7_DISH", "T1_T12_DISH", "L1_L5_DISH"],
      },
    ],
  },
  {
    id: "thorax-morph",
    region: "Thorax",
    modality: "morph",
    groups: [
      { id: "sternum", name: "Sternum and first rib", codes: ["R1_fusion", "Sternum_central_dorsal_ridge"] },
      { id: "ribs", name: "Ribs", codes: ["R2", "R3_10", "R2_ossification", "R3_10_ossification", "R2_shingle", "R3_10_shingle", "Sternal_rib_ends"] },
    ],
  },
  {
    id: "shoulder-metric",
    region: "Shoulder & upper limb",
    modality: "metric",
    groups: [
      { id: "clavicle", name: "Clavicle", bilateral: true, codes: ["ClavXL", "ClavMXD", "ClavMWD"] },
      { id: "scapula", name: "Scapula", bilateral: true, codes: ["ScH", "ScB", "ScGB", "ScGH"] },
      { id: "humerus", name: "Humerus", bilateral: true, codes: ["HumXL", "HumMXD", "HumMWD", "HumEB", "HumHXD"] },
      { id: "radius", name: "Radius", bilateral: true, codes: ["RadXL", "RadMXD", "RadMWD", "RadHXD"] },
      { id: "ulna", name: "Ulna", bilateral: true, codes: ["UlnXL", "UlnMXD", "UlnMWD", "UlnPL", "UlnDWC", "UlnOPXB"] },
    ],
  },
  {
    id: "shoulder-morph",
    region: "Shoulder & upper limb",
    modality: "morph",
    groups: [
      { id: "clavicle-m", name: "Clavicle", bilateral: true, codes: ["Medial_epiphysis_fusion", "Medial_epiphysis_gravel", "Medial_macroporosity", "Lateral_macroporosity"] },
      { id: "scapula-m", name: "Scapula", bilateral: true, codes: ["Glenoid_fossa_lipping"] },
      {
        id: "humerus-m",
        name: "Humerus",
        bilateral: true,
        codes: ["Lesser_tubercle_anterior_bumps", "Lesser_tubercle_margin_shape", "Greater_tubercle_pits", "Medial_epicondyle_texture", "Lateral_epicondyle_texture"],
      },
      { id: "forearm-hand", name: "Radius, ulna and hand", bilateral: true, codes: ["Radial_tuberosity_crest", "Ulna_olecranon_spur", "Trapezium_lipping"] },
    ],
  },
  {
    id: "pelvis-metric",
    region: "Pelvis",
    modality: "metric",
    groups: [
      { id: "sacrum", name: "Sacrum", codes: ["SacAH", "SacAB", "SacS1B", "SacS1APD"] },
      { id: "os-coxae", name: "Os coxae", bilateral: true, codes: ["PUM", "SPU", "DCOX", "IIMT", "ISMM", "SCOX", "SS", "SA", "SIS_PCMetric", "VEAC"] },
    ],
  },
  {
    id: "pelvis-morph",
    region: "Pelvis",
    modality: "morph",
    groups: [
      { id: "os-coxae-sex", name: "Os coxae", bilateral: true, codes: ["VA", "SPC", "MA", "CompositeArc", "IliumShape", "ASHeight", "GSN"] },
      { id: "sacrum-m", name: "Sacrum and sacroiliac joint", codes: ["S1_Margin", "S1_S2_fusion", "Sacral_elbow", "Sacroiliac_joint_fusion_left", "Sacroiliac_joint_fusion_right"] },
      {
        id: "ilium",
        name: "Ilium",
        bilateral: true,
        codes: ["Iliac_crest_fusion", "Iliac_crest_tuberculum_ossification", "Iliac_AIIS_exostoses", "Superior_Posterior_Iliac_Exostoses", "Inferior_Posterior_Iliac_Exostoses", "Posterior_exostoses"],
      },
      { id: "acetabulum", name: "Acetabulum", bilateral: true, codes: ["Posterior_margin_lipping", "Articular_surface_extra_bone", "Inferior_joint_lipping"] },
      {
        id: "ischium",
        name: "Ischial tuberosity",
        bilateral: true,
        codes: ["Ischial_tuberosity_superior_margin_spur", "Ischial_tuberosity_superior_median_spur", "Ischial_tuberosity_bumps"],
      },
      {
        id: "pubic-symphysis",
        name: "Pubic symphysis",
        bilateral: true,
        codes: ["Pubic_symphysis", "Pubic_symphyseal_collar", "Symphyseal_relief", "Superior_protuberance", "Ventral_symphyseal_margin", "Dorsal_symphyseal_margin"],
      },
      {
        id: "auricular",
        name: "Auricular surface",
        bilateral: true,
        codes: ["Transverse_organization", "Surface_texture", "Microporosity", "Macroporosity", "Apical_change"],
      },
    ],
  },
  {
    id: "lower-limb-metric",
    region: "Lower limb",
    modality: "metric",
    groups: [
      {
        id: "femur",
        name: "Femur",
        bilateral: true,
        codes: ["FemXL", "FemBL", "FemEB", "FemHXD", "FemMXD", "FemMWD", "FemMC", "FemSTD", "FemSAPD", "FemLCAPD", "FemMCAPD"],
      },
      { id: "tibia", name: "Tibia", bilateral: true, codes: ["TibCML", "TibPEB", "TibDEB", "TibMXD", "TibMWD", "TibMC"] },
      { id: "fibula", name: "Fibula", bilateral: true, codes: ["FibXL", "FibMXD"] },
      { id: "calcaneus", name: "Calcaneus", bilateral: true, codes: ["CalcXL", "CalcB"] },
    ],
  },
  {
    id: "lower-limb-morph",
    region: "Lower limb",
    modality: "morph",
    groups: [
      {
        id: "femur-m",
        name: "Femur",
        bilateral: true,
        codes: ["Fovea_tuberosity_margin_lipping", "Head_surface_extra_bone", "Greater_trochanter_roughening", "Trochanteric_fossa_exostoses", "Trochanteric_medial_exostoses"],
      },
      { id: "fibula-m", name: "Fibula", bilateral: true, codes: ["Fibular_wings"] },
    ],
  },
  {
    id: "whole-morph",
    region: "Whole skeleton",
    modality: "morph",
    groups: [{ id: "whole", name: "Whole skeleton", codes: ["Overall_skeleton_weight"] }],
  },
]

const REGION_ORDER = ["Cranium", "Mandible", "Dentition", "Vertebrae", "Thorax", "Shoulder & upper limb", "Pelvis", "Lower limb", "Whole skeleton"]

// Short names that read well under their bone header (the wireframes use
// "Maximum length" under Femur). Others come from the form or dictionary.
const NAME_OVERRIDES: Record<string, string> = {
  FemXL: "Maximum length",
  FemBL: "Bicondylar length",
  FemEB: "Epicondylar breadth",
  FemHXD: "Head maximum diameter",
  FemMXD: "Midshaft maximum diameter",
  FemMWD: "Midshaft minimum diameter",
  TibCML: "Condylo-malleolar length",
  TibPEB: "Proximal epiphyseal breadth",
  TibDEB: "Distal epiphyseal breadth",
  TibMXD: "Midshaft maximum diameter",
  C3_C7_lipping: "C3–C7 lipping",
  T1_T12_lipping: "T1–T12 lipping",
  L1_L5_lipping: "L1–L5 lipping",
  C3_C7_candlewax: "C3–C7 candlewax",
  T1_T12_candlewax: "T1–T12 candlewax",
  L1_L5_candlewax: "L1–L5 candlewax",
  C3_C7_DISH: "C3–C7 DISH",
  T1_T12_DISH: "T1–T12 DISH",
  L1_L5_DISH: "L1–L5 DISH",
  R2: "Rib 2 sternal end profile",
  R3_10: "Ribs 3–10 sternal end profile",
  R2_ossification: "Rib 2 ossification pattern",
  R3_10_ossification: "Ribs 3–10 ossification pattern",
  R2_shingle: "Rib 2 shingle",
  R3_10_shingle: "Ribs 3–10 shingle",
  Sacroiliac_joint_fusion_left: "Sacroiliac joint fusion, left",
  Sacroiliac_joint_fusion_right: "Sacroiliac joint fusion, right",
  SOS_fusion_AdultAge: "Spheno-occipital synchondrosis fusion (3 phase)",
}

// Illustrative ranges kept from the first fixture, for out-of-range warnings.
const RANGES: Record<string, [number, number]> = {
  FemXL: [340, 560], FemBL: [335, 555], FemEB: [60, 100], FemHXD: [35, 60], FemMXD: [20, 40], FemMWD: [18, 36],
  TibCML: [270, 470], TibPEB: [55, 90], TibDEB: [38, 60], TibMXD: [22, 40],
}

// Figures in the postcranial form with highlight boxes per DCP number,
// estimated by eye from the number labels in each drawing.
const BOXED_FIGURES: { page: number; caption: string; boxes: Record<number, Highlight> }[] = [
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
    boxes: { 76: { x: 0.04, y: 0.7, w: 0.92, h: 0.17 }, 83: { x: 0.46, y: 0.2, w: 0.08, h: 0.2 } },
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

// FoRDent abbreviations whose image files use another prefix. The sheet's
// parastyle (maxillary) and protostylid (mandibular) codes are filed under
// each other's suffix.
const DENTAL_FILE_PREFIX: Record<string, string> = {
  WING: "UIWing",
  DIAS: "Dias",
  UI2PEG: "UI2Peg",
  UM3PEG: "UM3Peg",
  UP3MMXPAR: "UP3M_MXPAR",
  UP3DMXPAR: "UP3D_MXPAR",
  UP4MMXPAR: "UP4M_MXPAR",
  UP4DMXPAR: "UP4D_MXPAR",
  UM1EE: "UMEE",
  UM2EE: "UMEE",
  LM1EE: "LMEE",
  LM2EE: "LMEE",
  LM2PG: "LM2GP",
  UM1PS: "UM1PR",
  UM2PS: "UM2PR",
  LM1PR: "LM1PS",
  LM2PR: "LM2PS",
}

// ---------------------------------------------------------------------------

type Row = (string | number)[]

function sheetRows(file: string, sheet: string): Row[] {
  const wb = XLSX.readFile(file)
  return XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheet], { header: 1, defval: "" }).slice(1)
}

const clean = (v: unknown) => String(v ?? "").trim()
const sentenceCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const humanize = (code: string) => sentenceCase(code.replace(/_/g, " ").toLowerCase())
const expandAbbrev = (s: string) =>
  s.replace(/\bmax\b/g, "maximum").replace(/\bmin\b/g, "minimum").replace(/\bdiamater\b/g, "diameter").replace(/\btranvserse\b/g, "transverse")

// "Ordinal 1-5" → states 1…5.
function ordinalStates(spec: string): CharacterState[] {
  const m = spec.match(/Ordinal (\d+)\s*-\s*(\d+)/)
  if (!m) return []
  const out: CharacterState[] = []
  for (let i = Number(m[1]); i <= Number(m[2]); i++) out.push({ code: String(i), label: "" })
  return out
}

// Morph sheets: a trait row, then one continuation row per Character state.
function readMorphSheet(file: string, sheet: string, cols: { name: number; abbr?: number; method?: number; desc: number; state: number; label: number }) {
  const traits = new Map<string, { abbr: string; method: string; desc: string; states: CharacterState[] }>()
  let current: { abbr: string; method: string; desc: string; states: CharacterState[] } | null = null
  for (const r of sheetRows(file, sheet)) {
    const name = clean(r[cols.name])
    if (name) {
      current = {
        abbr: cols.abbr !== undefined ? clean(r[cols.abbr]) : "",
        method: cols.method !== undefined ? clean(r[cols.method]) : "",
        desc: clean(r[cols.desc]),
        states: [],
      }
      traits.set(name, current)
    }
    const state = clean(r[cols.state])
    if (!current || state === "") continue
    if (state.startsWith("Ordinal")) current.states.push(...ordinalStates(state))
    else current.states.push({ code: state, label: clean(r[cols.label]) })
  }
  return traits
}

function readMetricSheet(file: string, sheet: string) {
  const out = new Map<string, string>()
  for (const r of sheetRows(file, sheet)) {
    const [code, desc] = r.map(clean)
    if (code) out.set(code, desc)
  }
  return out
}

// Postcranial form: "<item> <Title> (DCP 2.0 #75): <definition> Instrument: …
// Comment: … Enter your answer". Items are numbered in dictionary order,
// starting at 6.
type FormItem = { item: number; title: string; dcp?: number; definition: string; instrument?: string }

function pdfText(first?: number, last?: number) {
  const args = first ? ["-f", String(first), "-l", String(last ?? first), POSTCRANIAL_PDF, "-"] : [POSTCRANIAL_PDF, "-"]
  return execFileSync("pdftotext", args, { encoding: "utf8" })
    .replace(/\d+\/\d+\/\d+, \d+:\d+ [AP]M MOSAIC Postcranial Metrics Data Collection Form/g, " ")
    .replace(/https:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
}

const ITEM_RE = /(?:^| )(\d{1,2}) ([A-Z][A-Za-z ,.\-]+?) \((?:DCP(?: 2\.0)? #(\d+)|[A-Z_]+)\)(?: \([^)]*\))?:\s*(.+?)(?= Enter your answer|$)/g

function readPostcranialForm(): Map<number, FormItem> {
  const items = new Map<number, FormItem>()
  for (const m of pdfText().matchAll(ITEM_RE)) {
    const body = m[4]
    items.set(Number(m[1]), {
      item: Number(m[1]),
      title: m[2].trim(),
      dcp: m[3] ? Number(m[3]) : undefined,
      definition: body.split(/ (?:Instrument|Comment):/)[0].trim(),
      instrument: body.match(/Instrument: (.+?)(?= Comment:|$)/)?.[1].trim(),
    })
  }
  return items
}

function formItemsOnPage(page: number): number[] {
  return [...pdfText(page).matchAll(ITEM_RE)].map((m) => Number(m[1]))
}

function pagesWithFigures(): number[] {
  const list = execFileSync("pdfimages", ["-list", POSTCRANIAL_PDF], { encoding: "utf8" }).split("\n").slice(2)
  const pages = new Set<number>()
  for (const line of list) {
    const [page, , , width] = line.trim().split(/\s+/)
    if (Number(width) >= 200) pages.add(Number(page))
  }
  return [...pages].sort((a, b) => a - b)
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
  // Capped in size: the enlarged view is the largest place they appear. The
  // FoRDent pencil drawings are grayscale and compress poorly, so they go
  // smaller and lose their (empty) colour channels.
  const pencil = outRel.startsWith("dental/")
  let img = sharp(input)
    .flatten({ background: "#ffffff" })
    .resize({ width: pencil ? 800 : 1000, height: pencil ? 800 : 1000, fit: "inside", withoutEnlargement: true })
  if (pencil) img = img.grayscale()
  const info = await img.webp({ quality: pencil ? 70 : 78 }).toFile(outFile)
  return { src: `ref-images/${outRel}`, width: info.width, height: info.height }
}

// ---------------------------------------------------------------------------

async function main() {
  const report: string[] = []
  const variables: Record<string, Variable> = {}
  const manifest: ImageManifest = {}
  const sections: Section[] = []
  fs.rmSync(OUT_IMG, { recursive: true, force: true })

  const cranialMetric = readMetricSheet(CRANIAL_XLSX, "Metric Variables")
  const cranialMorph = readMorphSheet(CRANIAL_XLSX, "Morphological Variables", { name: 0, abbr: 1, method: 2, desc: 3, state: 4, label: 5 })
  const postMetric = readMetricSheet(POSTCRANIAL_XLSX, "Metric Variables")
  const postMorph = readMorphSheet(POSTCRANIAL_XLSX, "Morphological Variables", { name: 0, desc: 1, state: 2, label: 3 })
  const dentalMetric = readMetricSheet(DENTAL_XLSX, "Metric Variables")
  const dentalMorph = readMorphSheet(DENTAL_XLSX, "Morphological Variables", { name: 0, abbr: 1, desc: 2, state: 3, label: 4 })
  const form = readPostcranialForm()
  const postMetricCodes = [...postMetric.keys()]
  const itemOf = (code: string) => postMetricCodes.indexOf(code) + 6

  // A code can be both an MMS trait and a cranial measurement (NAS), so ids
  // fall back to "<code>-metric" when taken.
  const morphAbbrs = new Set([...cranialMorph.values()].map((t) => t.abbr).filter(Boolean))
  const idFor = (code: string, modality: Modality) =>
    (modality === "metric" && morphAbbrs.has(code)) || variables[code] ? `${code}-${modality}` : code
  const mmsFiles = fs.readdirSync(MMS_DIR).filter((f) => f.endsWith(".bmp"))

  async function addMorph(name: string, source: Map<string, { abbr: string; method: string; desc: string; states: CharacterState[] }>) {
    const t = source.get(name)
    if (!t) throw new Error(`No Morphological Variable ${name}`)
    const code = t.abbr || name
    const id = idFor(code, "morph")
    variables[id] = {
      id,
      code,
      name: NAME_OVERRIDES[name] ?? (t.desc ? sentenceCase(t.desc) : humanize(name)),
      modality: "morph",
      method: t.method,
      states: t.states,
    }
    // MMS traits have one drawing per Character state.
    const states: Record<string, ImageAsset> = {}
    if (t.method === "MMS") {
      for (const s of t.states) {
        const file = mmsFiles.find((f) => f === `${code}_${s.code}.bmp`)
        if (file) states[s.code] = await toWebp(path.join(MMS_DIR, file), `mms/${code}_${s.code}.webp`)
      }
    }
    manifest[id] = Object.keys(states).length ? { kind: "states", states } : { kind: "none" }
    return id
  }

  function addMetric(code: string, desc: string, opts: { unit: string; precision: number; calculated?: boolean; formItem?: FormItem }) {
    const id = idFor(code, "metric")
    const f = opts.formItem
    const unit = ANGLES.has(code) ? "°" : opts.unit
    variables[id] = {
      id,
      code,
      name: NAME_OVERRIDES[code] ?? sentenceCase(f?.title ? f.title.toLowerCase() : expandAbbrev(desc)),
      fullName: f?.title,
      modality: "metric",
      unit,
      precision: ANGLES.has(code) ? 1 : opts.precision,
      range: RANGES[code] ? { min: RANGES[code][0], max: RANGES[code][1] } : undefined,
      dcp: f?.dcp,
      definition: f?.definition,
      instrument: f?.instrument,
      calculated: opts.calculated || undefined,
    }
    manifest[id] = { kind: "none" }
    return id
  }

  // Dentition · Morphological: grouped by jaw and tooth class, with states
  // and drawings from the FoRDent image set (the sheet doesn't list states).
  const dentalFiles = new Map<string, string[]>()
  for (const jaw of ["Maxilla", "Mandible"]) {
    for (const f of fs.readdirSync(path.join(DENTAL_DIR, jaw))) {
      if (f.endsWith(".png")) dentalFiles.set(f, [...(dentalFiles.get(f) ?? []), path.join(DENTAL_DIR, jaw, f)])
    }
  }
  const dentalStatesFor = (abbr: string) => {
    const prefix = DENTAL_FILE_PREFIX[abbr] ?? abbr
    const states = new Map<string, string>()
    let location: string | undefined
    for (const f of [...dentalFiles.keys()].sort()) {
      if (!f.startsWith(`${prefix}_`)) continue
      const suffix = f.slice(prefix.length + 1, -4)
      if (/^Loc/i.test(suffix)) {
        if (!location || /New/.test(suffix)) location = dentalFiles.get(f)![0]
        continue
      }
      const m = suffix.match(/^(\d+(?:\.\d+)?)/)
      if (m && !states.has(m[1])) states.set(m[1], dentalFiles.get(f)![0])
    }
    return { states, location }
  }
  const dentalGroups: Group[] = [
    { id: "max-incisors", name: "Maxillary incisors", codes: [] },
    { id: "max-canine", name: "Maxillary canine", codes: [] },
    { id: "max-premolars", name: "Maxillary premolars", codes: [] },
    { id: "max-molars", name: "Maxillary molars", codes: [] },
    { id: "mand-incisors", name: "Mandibular incisors", codes: [] },
    { id: "mand-canine", name: "Mandibular canine", codes: [] },
    { id: "mand-premolars", name: "Mandibular premolars", codes: [] },
    { id: "mand-molars", name: "Mandibular molars", codes: [] },
  ]
  for (const name of dentalMorph.keys()) {
    const jaw = name.startsWith("max") ? "max" : "mand"
    const tooth = name.match(/_(i\d|c|pm\d|m\d)r?$/)?.[1] ?? "i1"
    const cls = tooth.startsWith("i") ? "incisors" : tooth === "c" ? "canine" : tooth.startsWith("pm") ? "premolars" : "molars"
    dentalGroups.find((g) => g.id === `${jaw}-${cls}`)!.codes.push(name)
  }
  SECTIONS.splice(SECTIONS.findIndex((s) => s.id === "vertebrae-morph"), 0, {
    id: "dentition-morph",
    region: "Dentition",
    modality: "morph",
    groups: dentalGroups,
  })

  async function addDental(name: string) {
    const t = dentalMorph.get(name)!
    // Third molars without their own code share the scale of the second.
    const sibling = name.replace(/_m3$/, "_m2").replace(/_pm2$/, "_pm1")
    const abbr = t.abbr || dentalMorph.get(sibling)?.abbr || ""
    const code = t.abbr || name
    const { states: files, location } = abbr ? dentalStatesFor(abbr) : { states: new Map<string, string>(), location: undefined }
    const listed = t.states.filter((s) => s.code)
    let states: CharacterState[] = [...files.keys()]
      .sort((a, b) => Number(a) - Number(b))
      .map((c) => ({ code: c, label: listed.find((s) => s.code === c)?.label ?? "" }))
    const inferred = states.length === 0
    if (inferred) states = [{ code: "0", label: "absent" }, { code: "1", label: "present" }]
    // Absence traits may have a drawing for one state only: complete the 0/1 scale.
    else if (states.length === 1) {
      for (const c of ["0", "1"]) if (!states.some((x) => x.code === c)) states.push({ code: c, label: "" })
      states.sort((a, b) => Number(a.code) - Number(b.code))
    }
    const id = idFor(code, "morph")
    // "Maxillary incisor shovel shape - first" → "Shovel shape, first"
    const short = t.desc.replace(/^(Maxillary|Mandibular) (incisor|canine|premolar|molar) /, "").replace(/ - /, ", ")
    variables[id] = { id, code, name: sentenceCase(short), modality: "morph", method: "FoRDent", states, statesPending: inferred || undefined }
    const assets: Record<string, ImageAsset> = {}
    if (abbr) {
      for (const [c, file] of files) assets[c] = await toWebp(file, `dental/${code}_${c}.webp`)
    }
    manifest[id] = Object.keys(assets).length
      ? {
          kind: "states",
          states: assets,
          location: location ? await toWebp(location, `dental/${code}_loc.webp`) : undefined,
        }
      : { kind: "none" }
    return id
  }

  for (const spec of SECTIONS) {
    const bones: Bone[] = []
    for (const g of spec.groups) {
      const ids: string[] = []
      for (const name of g.codes) {
        if (spec.id === "dentition-morph") ids.push(await addDental(name))
        else if (spec.modality === "morph") ids.push(await addMorph(name, spec.region === "Cranium" || spec.region === "Mandible" ? cranialMorph : postMorph))
        else if (spec.region === "Cranium" || spec.region === "Mandible") {
          const desc = cranialMetric.get(name)
          if (desc === undefined) throw new Error(`No cranial measurement ${name}`)
          ids.push(addMetric(name, desc, { unit: "mm", precision: 0.1 }))
        } else if (spec.region === "Dentition") {
          ids.push(addMetric(name, dentalMetric.get(name) ?? name, { unit: "mm", precision: 0.1 }))
        } else {
          const desc = postMetric.get(name)
          if (desc === undefined) throw new Error(`No postcranial measurement ${name}`)
          ids.push(addMetric(name, desc, { unit: "mm", precision: 1, formItem: form.get(itemOf(name)) }))
        }
      }
      bones.push({ id: g.id, name: g.name, bilateral: g.bilateral, variableIds: ids })
    }
    const calculated = (spec.calculated ?? []).map((code) =>
      addMetric(code, cranialMetric.get(code) ?? code, { unit: "mm", precision: 0.1, calculated: true }),
    )
    const label = spec.modality === "metric" ? "Metric" : "Morphological"
    sections.push({
      id: spec.id,
      region: spec.region,
      modality: spec.modality,
      title: `${spec.region} · ${label}`,
      bones,
      calculated: calculated.length ? calculated : undefined,
    })
  }

  // Check every dictionary Variable landed exactly once.
  const placed = new Set(Object.values(variables).map((v) => v.code))
  const expectCodes = [
    ...cranialMetric.keys(),
    ...[...cranialMorph.entries()].map(([n, t]) => t.abbr || n),
    ...postMetric.keys(),
    ...postMorph.keys(),
    ...dentalMetric.keys(),
    ...[...dentalMorph.entries()].map(([n, t]) => t.abbr || n),
  ]
  const missing = expectCodes.filter((c) => !placed.has(c))
  if (missing.length) throw new Error(`Variables not placed in any section: ${missing.join(", ")}`)

  // Figures from the postcranial form (DCP 2.0; local builds only).
  const figTmp = fs.mkdtempSync(path.join(os.tmpdir(), "mosaic-fig-"))
  const byCode = new Map(Object.values(variables).filter((v) => v.modality === "metric").map((v) => [v.code, v.id]))
  const boxed = new Map<number, { asset: ImageAsset; caption: string; box: Highlight }>()
  for (const page of pagesWithFigures()) {
    execFileSync("pdfimages", ["-png", "-f", String(page), "-l", String(page), POSTCRANIAL_PDF, path.join(figTmp, `p${page}`)])
    const first = fs.readdirSync(figTmp).filter((f) => f.startsWith(`p${page}-`)).sort()[0]
    if (!first) continue
    const asset = await toWebp(path.join(figTmp, first), `dcp/page-${page}.webp`)
    const spec = BOXED_FIGURES.find((f) => f.page === page)
    if (spec) for (const [dcp, box] of Object.entries(spec.boxes)) boxed.set(Number(dcp), { asset, caption: spec.caption, box })
    // Without a highlight, a figure serves the items printed on its page.
    for (const item of formItemsOnPage(page)) {
      const code = postMetricCodes[item - 6]
      const id = code && byCode.get(code)
      if (id && manifest[id].kind === "none") {
        manifest[id] = { kind: "figure", figure: asset, caption: `Postcranial form, item ${item} · ${variables[id].fullName ?? variables[id].name}` }
      }
    }
  }
  for (const v of Object.values(variables)) {
    const b = v.dcp ? boxed.get(v.dcp) : undefined
    if (b) manifest[v.id] = { kind: "figure", figure: b.asset, caption: b.caption, highlight: b.box }
  }

  sections.sort((a, b) => REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region) || (a.modality === "metric" ? -1 : 1))

  for (const s of sections) {
    const ids = s.bones.flatMap((b) => b.variableIds)
    const kinds = ids.map((id) => manifest[id].kind)
    report.push(
      `| ${s.title} | ${ids.length}${s.calculated ? ` + ${s.calculated.length} calculated` : ""} | ` +
        `${kinds.filter((k) => k === "states").length} per-state · ${kinds.filter((k) => k === "figure").length} figure · ${kinds.filter((k) => k === "none").length} none | ` +
        `${ids.filter((id) => variables[id].statesPending).length || ""} |`,
    )
  }

  const fixture: Fixture = { generatedAt: new Date().toISOString().slice(0, 10), sections, variables }
  fs.writeFileSync(path.join(root, "src/data/fixture.json"), JSON.stringify(fixture, null, 2) + "\n")
  fs.writeFileSync(path.join(root, "src/data/image-manifest.json"), JSON.stringify(manifest, null, 2) + "\n")
  const lines = [
    "# Fixture and image report",
    "",
    `Generated ${fixture.generatedAt} by \`npm run fixture\`. ${Object.keys(variables).length} Variables in ${sections.length} sections.`,
    "",
    "| Section | Variables | Reference images | States pending |",
    "| --- | --- | --- | --- |",
    ...report,
    "",
    "\"States pending\": dental traits with no FoRDent image set, given absent/present until the states are confirmed.",
    "",
  ]
  fs.writeFileSync(path.join(root, "scripts/manifest-report.md"), lines.join("\n"))
  console.log(lines.join("\n"))
}

await main()
