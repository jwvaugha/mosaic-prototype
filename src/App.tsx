import { ConfigProvider } from "@/config/config-context"
import { useHashRoute } from "@/lib/use-hash-route"
import { Prototype } from "@/screens/app-shell"
import { Guide } from "@/routes/guide"
import { KitchenSink } from "@/routes/kitchen-sink"
import { Parts } from "@/routes/parts"
import { Results } from "@/routes/results"
import { ResultsOptions } from "@/routes/results-options"

export default function App() {
  const route = useHashRoute()

  if (route === "/kitchen-sink") return <KitchenSink />
  if (route === "/parts") return <Parts />
  if (route === "/guide") return <Guide />
  if (route === "/results-options") return <ResultsOptions />
  if (route === "/results") return <Results />

  return (
    <ConfigProvider>
      <Prototype />
    </ConfigProvider>
  )
}
