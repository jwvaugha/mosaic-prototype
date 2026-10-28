import { ConfigProvider } from "@/config/config-context"
import { useHashRoute } from "@/lib/use-hash-route"
import { Prototype } from "@/screens/app-shell"
import { Guide } from "@/routes/guide"
import { KitchenSink } from "@/routes/kitchen-sink"
import { Parts } from "@/routes/parts"

export default function App() {
  const route = useHashRoute()

  if (route === "/kitchen-sink") return <KitchenSink />
  if (route === "/parts") return <Parts />
  if (route === "/guide") return <Guide />

  return (
    <ConfigProvider>
      <Prototype />
    </ConfigProvider>
  )
}
