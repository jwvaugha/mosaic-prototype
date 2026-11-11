import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ResultsOptions } from "./results-options"

describe("ResultsOptions", () => {
  it("lays out one result four ways and switches examples", async () => {
    render(
      <TooltipProvider>
        <ResultsOptions />
      </TooltipProvider>,
    )
    for (const t of ["Range first", "Best estimate first", "Chart first", "Most likely band"]) {
      expect(screen.getByRole("heading", { name: t })).toBeInTheDocument()
    }
    expect(screen.getAllByText("37–90").length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole("radio", { name: "Age, split evidence" }))
    expect(screen.getAllByText("31–89").length).toBeGreaterThan(0)
    expect(screen.getByText("Illustrative")).toBeInTheDocument()
  })
})
