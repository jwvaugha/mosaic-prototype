import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ConfigProvider } from "@/config/config-context"
import { fieldIds } from "@/domain/workup"
import { Prototype } from "@/screens/app-shell"

// Drives the real screen with the keyboard, once per incompletion policy.

const MORPH = "cranium-morph"

function setup(query: string) {
  localStorage.clear()
  // Tests open on Cranium · Morphological unless they name a section.
  window.history.replaceState(null, "", `/?${query}${query.includes("start=") ? "" : "&start=cranium-morph"}`)
  render(
    <TooltipProvider>
      <ConfigProvider>
        <Prototype />
      </ConfigProvider>
      <Toaster />
    </TooltipProvider>,
  )
  return userEvent.setup()
}

const row = (id: string) => document.querySelector<HTMLElement>(`[data-variable="${id}"]`)!
const statusOf = (id: string) => within(row(id)).getAllByRole("img")[0].getAttribute("aria-label")
const focusedRow = () => document.activeElement?.closest<HTMLElement>("[data-variable]")?.dataset.variable

async function focusFirst(user: ReturnType<typeof userEvent.setup>) {
  // Clicking a state would score it, so focus the group directly.
  const first = fieldIds(MORPH)[0]
  act(() => document.getElementById(`field-${first}`)!.querySelector<HTMLElement>('[role="radio"]')!.focus())
  await user.keyboard("{Escape}")
  return first
}

beforeEach(() => localStorage.clear())

describe("keyboard: all modes", () => {
  it("scores Morph fields with digits and advances", async () => {
    const user = setup("inc=flag-end")
    await focusFirst(user)
    await user.keyboard("2")
    expect(statusOf("NAS")).toBe("Recorded")
    expect(focusedRow()).toBe("NAW")
    await user.keyboard("9") // not a Character state of NAW
    expect(statusOf("NAW")).toBe("Blank")
    expect(focusedRow()).toBe("NAW")
  })

  it("Tabs through every row to the Continue footer, then Enter moves on", async () => {
    const user = setup("inc=flag-section")
    await focusFirst(user)
    // Each later bone adds its header and Condition chips as Tab stops.
    const bones = 7
    for (let i = 1; i < fieldIds(MORPH).length + (bones - 1) * 2; i++) await user.keyboard("{Tab}")
    expect(focusedRow()).toBe(fieldIds(MORPH).at(-1))
    await user.keyboard("{Tab}")
    expect(document.activeElement).toHaveTextContent("Continue to Mandible · Metric")
    await user.keyboard("{Enter}")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mandible · Metric")
  })

  it("commits a Metric value on Enter and flags it if out of range", async () => {
    const user = setup("inc=skip-section&start=lower-limb-metric")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Lower limb · Metric")
    expect(focusedRow()).toBe("FemXL")
    await user.keyboard("700{Enter}")
    expect(statusOf("FemXL")).toBe("Out of range")
    expect(focusedRow()).toBe("FemBL")
  })
})

describe("keyboard: 1 · Skip", () => {
  it("Skips with -, passes over Skipped rows on Tab, and un-Skips with - again", async () => {
    const user = setup("inc=skip-section")
    await focusFirst(user)
    await user.keyboard("-")
    expect(statusOf("NAS")).toBe("Skipped")
    expect(focusedRow()).toBe("NAW")
    await user.keyboard("{Shift>}{Tab}{/Shift}")
    expect(focusedRow()).toBe("NAS")
    await user.keyboard("-")
    expect(statusOf("NAS")).toBe("Blank")
    expect(focusedRow()).toBe("NAS")
  })

  it("Skips the bone's blanks with ⇧-", async () => {
    const user = setup("inc=skip-section")
    await focusFirst(user)
    await user.keyboard("{Shift>}-{/Shift}")
    for (const id of ["NAS", "NAW", "NBS", "NBC", "ANS", "INA"]) expect(statusOf(id)).toBe("Skipped")
    expect(statusOf("ZS")).toBe("Blank")
  })

  it("never types a dash: - Skips a Metric field mid-entry, and Undo brings the value back", async () => {
    const user = setup("inc=skip-section&start=lower-limb-metric")
    await user.keyboard("450-")
    expect(statusOf("FemXL")).toBe("Skipped")
    await user.click(await screen.findByRole("button", { name: "Undo" }))
    expect(statusOf("FemXL")).toBe("Recorded")
    expect(screen.getByLabelText("Maximum length")).toHaveValue("450")
  })
})

describe("keyboard: 2 / 2.5 · Come back to", () => {
  it("flags with ⌥F and ignores -", async () => {
    const user = setup("inc=flag-section")
    await focusFirst(user)
    await user.keyboard("-")
    expect(statusOf("NAS")).toBe("Blank")
    expect(focusedRow()).toBe("NAS")
    const flagged = () => within(row("NAS")).queryByRole("button", { pressed: true })
    await user.keyboard("{Alt>}f{/Alt}")
    expect(flagged()).toHaveTextContent("Come back to this")
    await user.keyboard("{Alt>}f{/Alt}")
    expect(flagged()).toBeNull()
  })
})

describe("selecting a row by clicking", () => {
  it("clicking a row's name selects it, so keys act on that row", async () => {
    const user = setup("inc=skip-section")
    await user.click(within(row("IOB")).getByText("Interorbital breadth"))
    expect(focusedRow()).toBe("IOB")
    expect(row("IOB").querySelector("[data-focused]")).not.toBeNull()
    await user.keyboard("2")
    expect(statusOf("IOB")).toBe("Recorded")
    expect(focusedRow()).toBe("ORB")
  })

  it("clicking a Metric row's name puts the cursor in its input", async () => {
    const user = setup("inc=skip-section&start=lower-limb-metric")
    await user.click(within(row("TibPEB")).getByText("Proximal epiphyseal breadth"))
    expect(document.activeElement).toBe(screen.getByLabelText("Proximal epiphyseal breadth"))
  })
})

describe("changing a score", () => {
  it("Skips a scored Morph field with -, and ⌫ clears a score", async () => {
    const user = setup("inc=skip-section")
    await focusFirst(user)
    await user.keyboard("2")
    await user.keyboard("{Shift>}{Tab}{/Shift}")
    expect(statusOf("NAS")).toBe("Recorded")
    await user.keyboard("{Backspace}")
    expect(statusOf("NAS")).toBe("Blank")
    await user.keyboard("2{Shift>}{Tab}{/Shift}-")
    expect(statusOf("NAS")).toBe("Skipped")
    await user.keyboard("{Shift>}{Tab}{/Shift}{Backspace}")
    expect(statusOf("NAS")).toBe("Blank")
  })

  it("clicking the selected state again clears it", async () => {
    const user = setup("inc=flag-end")
    const state2 = () => within(row("NAW")).getByRole("radio", { name: /^2/ })
    await user.click(state2())
    expect(statusOf("NAW")).toBe("Recorded")
    await user.click(state2())
    expect(statusOf("NAW")).toBe("Blank")
  })

  it("arrow keys preview a state; Enter picks it and moves on", async () => {
    const user = setup("inc=flag-end")
    await focusFirst(user)
    await user.keyboard("{ArrowRight}")
    expect(within(row("NAS")).getByRole("radio", { name: /^2/ })).toHaveAttribute("data-previewed")
    await user.keyboard("{Enter}")
    expect(within(row("NAS")).getByRole("radio", { name: /^2/ })).toHaveAttribute("aria-checked", "true")
    expect(focusedRow()).toBe("NAW")
  })
})

describe("bone headers", () => {
  it("Tab reaches the next bone's header and Condition chips before its fields", async () => {
    const user = setup("inc=skip-and-flag")
    act(() => document.getElementById("field-NaOvg")!.querySelector<HTMLElement>('[role="radio"]')!.focus())
    await user.keyboard("{Escape}{Tab}")
    expect(document.activeElement).toHaveAccessibleName("Zygomatic and orbit")
    await user.keyboard("-")
    for (const id of ["ZS", "MT", "PZTub", "IOB", "ORB"]) expect(statusOf(id)).toBe("Skipped")
    await user.keyboard("{Tab}")
    expect(document.activeElement).toHaveTextContent("Autopsy cut")
    await user.keyboard("{ArrowRight} ")
    expect(screen.getAllByRole("button", { name: /Postmortem damage/ })[1]).toHaveAttribute("aria-pressed", "true")
  })

  it("Skip and come back to are both offered, as buttons", async () => {
    const user = setup("inc=skip-and-flag")
    await user.click(within(row("NAW")).getByRole("button", { name: /Skip/ }))
    expect(statusOf("NAW")).toBe("Skipped")
    await user.click(within(row("NBS")).getByRole("button", { name: /Come back/ }))
    expect(within(row("NBS")).getByRole("button", { pressed: true })).toHaveTextContent("Come back to this")
  })

  it("R shows and hides the reference panel, which stays on as focus moves", async () => {
    const user = setup("inc=skip-and-flag")
    await focusFirst(user)
    expect(screen.queryByRole("complementary", { name: "Reference" })).toBeNull()
    await user.keyboard("r")
    expect(screen.getByRole("complementary", { name: "Reference" })).toHaveTextContent("Nasal aperture shape")
    // On a bone header the panel stays, with a placeholder.
    await user.keyboard("{Shift>}{Tab}{Tab}{/Shift}")
    expect(screen.getByRole("complementary", { name: "Reference" })).toHaveTextContent("Select a field row")
    await user.keyboard("{Tab}{Tab}r")
    expect(screen.queryByRole("complementary", { name: "Reference" })).toBeNull()
  })

  it("docked: the header button opens the panel and goes away; the panel's × closes it", async () => {
    const user = setup("inc=skip-and-flag&ref=A")
    await user.click(screen.getByRole("button", { name: /Show reference/ }))
    expect(screen.getByRole("complementary", { name: "Reference" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /(Show|Hide) reference/ })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Close reference" }))
    expect(screen.queryByRole("complementary", { name: "Reference" })).toBeNull()
    expect(screen.getByRole("button", { name: /Show reference/ })).toBeInTheDocument()
  })
})

describe("notes", () => {
  it("N adds a note; the row then shows it, and it can be edited and deleted", async () => {
    const user = setup("inc=skip-and-flag")
    await focusFirst(user)
    await user.keyboard("n")
    await user.keyboard("Left side only")
    await user.keyboard("{Meta>}{Enter}{/Meta}")
    const icon = within(row("NAS")).getByRole("button", { name: /^Note: Left side only/ })
    await user.click(icon)
    await user.click(screen.getByRole("button", { name: "Delete note" }))
    expect(within(row("NAS")).queryByRole("button", { name: /^Note:/ })).toBeNull()
    // Keys typed in the note never reached the data-entry shortcuts.
    expect(statusOf("NAS")).toBe("Blank")
  })

  it("shows existing notes on their rows", () => {
    setup("inc=skip-and-flag&seed=midway")
    expect(within(row("NBC")).getByRole("button", { name: /^Note: Scored on the left/ })).toBeInTheDocument()
  })
})
