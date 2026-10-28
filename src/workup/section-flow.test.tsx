import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ConfigProvider } from "@/config/config-context"
import { Prototype } from "@/screens/app-shell"

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

const heading = () => screen.getAllByRole("heading", { level: 1 })[0]
const continueButton = () => screen.getByRole("button", { name: /Continue to Lower limb/ })

describe("Continue under each policy", () => {
  it("1 · asks about blanks, and Skip N and continue marks them Skipped", async () => {
    const user = setup("inc=skip-section&seed=midway")
    await user.click(continueButton())
    expect(screen.getByRole("alertdialog")).toHaveTextContent("5 fields in Cranium · Morphological are blank")
    await user.click(screen.getByRole("button", { name: "Skip 5 and continue" }))
    expect(heading()).toHaveTextContent("Lower limb · Metric")
    // Back on the rail, Cranium · Morphological shows 6 recorded and 5 skipped.
    await user.keyboard("{Control>}{Alt>}{ArrowUp}{/Alt}{/Control}")
    expect(screen.getByText(/6 of 11 recorded · 5 skipped/, { selector: "p" })).toBeInTheDocument()
  })

  it("1 · Go to first blank stays in the section", async () => {
    const user = setup("inc=skip-section&seed=midway")
    await user.click(continueButton())
    await user.click(screen.getByRole("button", { name: "Go to first blank" }))
    expect(heading()).toHaveTextContent("Cranium · Morphological")
    expect(document.activeElement?.closest("[data-variable]")).toHaveAttribute("data-variable", "ANS")
  })

  it("2 · lists flagged fields before moving on, and only then", async () => {
    const user = setup("inc=flag-section&seed=midway")
    await user.click(continueButton())
    expect(heading()).toHaveTextContent("Lower limb · Metric")

    await user.keyboard("{Control>}{Alt>}{ArrowUp}{/Alt}{/Control}")
    await user.keyboard("{Alt>}f{/Alt}") // focus lands on ANS, the first blank
    await user.click(continueButton())
    expect(screen.getByRole("dialog")).toHaveTextContent("1 field to come back to in Cranium · Morphological")
    expect(screen.getByRole("dialog")).toHaveTextContent("Anterior nasal spine · ANS")
  })

  it("2.5 · never asks, and collects flags in the pre-Analysis check", async () => {
    const user = setup("inc=flag-end&seed=midway")
    await user.keyboard("{Alt>}f{/Alt}")
    await user.click(continueButton())
    expect(heading()).toHaveTextContent("Lower limb · Metric")
    await user.click(screen.getByRole("button", { name: "Review and analyze" }))
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveTextContent("Fields you flagged to come back to")
    expect(dialog).toHaveTextContent("Anterior nasal spine · ANS")
    expect(dialog).toHaveTextContent("Unacknowledged warnings")
  })
})
