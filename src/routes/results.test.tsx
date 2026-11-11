import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import { summaryLine } from "@/results/model"
import { scenario } from "@/results/scenarios"
import { Results } from "./results"

const renderWith = (settings: object) => {
  localStorage.setItem("mosaic-proto:results", JSON.stringify(settings))
  return render(
    <TooltipProvider>
      <Results />
    </TooltipProvider>,
  )
}

describe("Results", () => {
  beforeEach(() => localStorage.clear())

  it("shows all four estimates in order, range first by default", () => {
    renderWith({})
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    expect(headings.slice(0, 5)).toEqual(["Estimates in detail", "Sex", "Age at death", "Population affinity (U.S. Census categories)", "Stature"])
    expect(screen.getAllByText("37–90").length).toBeGreaterThan(0)
  })

  it("never shows a number when there isn't enough evidence", () => {
    renderWith({ scenario: "partial" })
    expect(screen.getAllByText(/Not enough evidence/).length).toBe(4)
  })

  it("can hide population affinity", () => {
    renderWith({ affinity: false })
    expect(screen.queryByRole("heading", { name: /Population affinity/ })).not.toBeInTheDocument()
  })

  it("draws the summary tiles: a split bar for categories, the range on its scale", () => {
    renderWith({})
    expect(screen.getByRole("img", { name: "Male 65%, Female 35%" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "White 67%, all others 33%" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Range 37–90 on a scale from 10 to 110, best estimate 64" })).toBeInTheDocument()
  })

  it("can show one estimate's detail at a time in tabs", () => {
    renderWith({ details: "tabs" })
    expect(screen.getAllByRole("tab")).toHaveLength(4)
    expect(screen.getByRole("heading", { name: "Sex", level: 2 })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Stature", level: 2 })).not.toBeInTheDocument()
  })

  it("labels every figure in the detail cards and keeps training counts behind an info button", () => {
    renderWith({})
    expect(screen.getAllByText("probability").length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText("best estimate").length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText("In training data")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "About White in the training data" })).toBeInTheDocument()
  })

  it("keeps Back to Workup display-only, so testers can't leave for an unrelated Workup", () => {
    renderWith({})
    expect(screen.getByRole("button", { name: /Back to Workup/ })).toBeDisabled()
    expect(screen.queryByRole("link", { name: /Back to Workup/ })).not.toBeInTheDocument()
  })

  it("caps the copied summary below 100%", () => {
    expect(summaryLine(scenario("rich"), true)).toContain("Male >99%")
  })
})
