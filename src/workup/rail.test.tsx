import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ConfigProvider } from "@/config/config-context"
import { Prototype } from "@/screens/app-shell"

// The Region Rail: membership, Edit order and the keyboard tree.

function setup(query = "inc=skip-section&seed=midway&start=cranium-morph") {
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

beforeEach(() => localStorage.clear())

const tree = () => screen.getByRole("tree", { name: "Regions" })
const region = (name: string) =>
  within(tree()).getAllByRole("treeitem").find((el) => el.getAttribute("aria-label")?.startsWith(`${name},`))!
const summary = () => within(tree().parentElement!).getByText(/ of \d+ recorded/, { selector: "span" })
const heading = () => screen.getAllByRole("heading", { level: 1 })[0]

describe("Region Rail", () => {
  it("shows every Region: expanded, collapsed, set aside and not in the Workup", () => {
    setup()
    const regions = within(tree()).getAllByRole("treeitem").filter((el) => el.getAttribute("aria-level") === "1")
    expect(regions).toHaveLength(9)
    expect(region("Cranium")).toHaveAttribute("aria-expanded", "true")
    expect(region("Mandible")).toHaveAttribute("aria-expanded", "false")
    expect(region("Shoulder & upper limb")).toHaveAccessibleName(/set aside, 8 kept/)
    expect(region("Thorax")).toHaveAccessibleName(/not in this Workup/)
  })

  it("adds a Region left out at Inventory, which raises the total", async () => {
    const user = setup()
    const before = Number(summary().textContent!.match(/of (\d+)/)![1])
    await user.click(within(region("Thorax")).getByRole("button", { name: /add/ }))
    expect(region("Thorax")).toHaveAttribute("aria-expanded", "true")
    expect(summary()).toHaveTextContent(`of ${before + 9} recorded`)
  })

  it("removing a Region with Observations sets it aside; without, it goes back to + add", async () => {
    const user = setup()
    await user.click(within(region("Lower limb")).getByRole("button", { name: "Lower limb menu" }))
    await user.click(await screen.findByRole("menuitem", { name: "Remove from Workup…" }))
    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toHaveTextContent("Lower limb has 5 Observations")
    await user.click(within(dialog).getByRole("button", { name: "Set aside Region" }))
    expect(region("Lower limb")).toHaveAccessibleName(/set aside, 5 kept/)

    await user.click(within(region("Dentition")).getByRole("button", { name: "Dentition menu" }))
    await user.click(await screen.findByRole("menuitem", { name: "Remove from Workup…" }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove Region" }))
    expect(region("Dentition")).toHaveAccessibleName(/not in this Workup/)
  })

  it("removing the open Region moves to the next one still in the Workup", async () => {
    const user = setup()
    expect(heading()).toHaveTextContent("Cranium · Morphological")
    await user.click(within(region("Cranium")).getByRole("button", { name: "Cranium menu" }))
    await user.click(await screen.findByRole("menuitem", { name: "Remove from Workup…" }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Set aside Region" }))
    expect(heading()).toHaveTextContent("Mandible · Metric")
  })

  it("Edit order changes where Continue goes, and Reset puts it back", async () => {
    const user = setup()
    expect(screen.getByRole("button", { name: /Continue to Mandible · Metric/ })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Edit order" }))
    const order = screen.getByRole("list", { name: "Region order" })
    within(order).getByText("Mandible").closest("li")!.focus()
    for (let i = 0; i < 8; i++) await user.keyboard("{Alt>}{ArrowDown}{/Alt}")
    expect(within(order).getAllByRole("listitem").at(-1)).toHaveTextContent("Mandible")
    await user.click(screen.getByRole("button", { name: "Done" }))
    // Mandible now comes last, so Cranium leads straight to Dentition.
    expect(screen.getByRole("button", { name: /Continue to Dentition · Metric/ })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Edit order" }))
    await user.click(screen.getByRole("button", { name: /Reset to anatomical/ }))
    await user.click(screen.getByRole("button", { name: "Done" }))
    expect(screen.getByRole("button", { name: /Continue to Mandible · Metric/ })).toBeInTheDocument()
  })

  it("Save as my default order persists the order for the next Workup", async () => {
    const user = setup()
    await user.click(screen.getByRole("button", { name: "Edit order" }))
    within(screen.getByRole("list", { name: "Region order" })).getByText("Whole skeleton").closest("li")!.focus()
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}")
    await user.click(screen.getByRole("button", { name: /Save as my default order/ }))
    expect(screen.getByRole("status")).toHaveTextContent("Saved as your default order")
    expect(JSON.parse(localStorage.getItem("mosaic-proto:rail-order")!).at(-1)).toBe("Lower limb")
  })

  it("F6 enters the tree on the current section; arrows move, collapse and open", async () => {
    const user = setup()
    await user.keyboard("{F6}")
    expect(document.activeElement).toHaveAccessibleName(/^Morphological/)
    await user.keyboard("{ArrowLeft}")
    expect(document.activeElement).toBe(region("Cranium"))
    await user.keyboard("{ArrowLeft}")
    expect(region("Cranium")).toHaveAttribute("aria-expanded", "false")
    // Down past Mandible, Dentition, Vertebrae, Thorax, Shoulder, Pelvis to Lower limb.
    for (let i = 0; i < 7; i++) await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(region("Lower limb"))
    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}")
    expect(heading()).toHaveTextContent("Lower limb · Metric")
  })
})
