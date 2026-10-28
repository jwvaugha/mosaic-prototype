import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ConfigProvider } from "@/config/config-context"
import { fieldIds } from "@/domain/workup"
import { Prototype } from "@/screens/app-shell"

// Drives the real screen with the keyboard, once per incompletion policy.

const MORPH = "cranium-morph"

function setup(query: string) {
  localStorage.clear()
  window.history.replaceState(null, "", `/?${query}`)
  render(
    <TooltipProvider>
      <ConfigProvider>
        <Prototype />
      </ConfigProvider>
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
  act(() => document.getElementById(`field-${first}`)!.focus())
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
    for (let i = 1; i < fieldIds(MORPH).length; i++) await user.keyboard("{Tab}")
    expect(focusedRow()).toBe(fieldIds(MORPH).at(-1))
    await user.keyboard("{Tab}")
    expect(document.activeElement).toHaveTextContent("Continue to Lower limb · Metric")
    await user.keyboard("{Enter}")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Lower limb · Metric")
  })

  it("commits a Metric value on Enter and flags it if out of range", async () => {
    const user = setup("inc=skip-section")
    await user.keyboard("{Control>}{Alt>}{ArrowDown}{/Alt}{/Control}")
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

  it("never types a dash into a Metric field", async () => {
    const user = setup("inc=skip-section")
    await user.keyboard("{Control>}{Alt>}{ArrowDown}{/Alt}{/Control}")
    await user.keyboard("4-5")
    expect(screen.getByLabelText("Maximum length")).toHaveValue("45")
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
    const user = setup("inc=skip-section")
    await user.keyboard("{Control>}{Alt>}{ArrowDown}{/Alt}{/Control}")
    await user.click(within(row("TibPEB")).getByText("Proximal epiphyseal breadth"))
    expect(document.activeElement).toBe(screen.getByLabelText("Proximal epiphyseal breadth"))
  })
})
