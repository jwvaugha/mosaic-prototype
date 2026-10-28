import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import { KitchenSink } from "./kitchen-sink"

describe("KitchenSink", () => {
  it("renders the themed primitives", () => {
    render(
      <TooltipProvider>
        <KitchenSink />
      </TooltipProvider>,
    )
    expect(screen.getByRole("heading", { name: "Kitchen sink" })).toBeInTheDocument()
    expect(screen.getByLabelText("Maximum length of the femur")).toBeInTheDocument()
  })
})
