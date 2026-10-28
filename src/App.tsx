import { useHashRoute } from "@/lib/use-hash-route"
import { KitchenSink } from "@/routes/kitchen-sink"
import { Parts } from "@/routes/parts"

export default function App() {
  const route = useHashRoute()

  if (route === "/kitchen-sink") return <KitchenSink />
  if (route === "/parts") return <Parts />

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">MOSAIC prototype</h1>
      <p className="text-muted-foreground">
        Data entry is not built yet. See the{" "}
        <a className="text-primary underline underline-offset-4" href="#/kitchen-sink">
          kitchen sink
        </a>{" "}
        for the themed primitives and{" "}
        <a className="text-primary underline underline-offset-4" href="#/parts">
          MOSAIC parts
        </a>{" "}
        for the custom components.
      </p>
    </main>
  )
}
