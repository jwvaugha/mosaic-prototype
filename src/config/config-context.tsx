import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { POLICIES, type IncompletionPolicy } from "@/policies/incompletion"
import { setLogSetup } from "@/lib/event-log"
import { loadConfig, saveConfig, toQuery, type TestConfig } from "./test-config"

type ConfigContextValue = {
  config: TestConfig
  policy: IncompletionPolicy
  setConfig: (update: (c: TestConfig) => TestConfig) => void
  // Starts the Workup again with the current setup.
  resetKey: number
  resetWorkup: () => void
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, set] = useState(loadConfig)
  const [resetKey, setResetKey] = useState(0)
  const resetWorkup = useCallback(() => setResetKey((k) => k + 1), [])
  const setConfig = useCallback((update: (c: TestConfig) => TestConfig) => {
    set((c) => {
      const next = update(c)
      saveConfig(next)
      return next
    })
  }, [])
  setLogSetup(toQuery(config).replaceAll("&", " ").replaceAll("%2C", ","))
  return (
    <ConfigContext.Provider value={{ config, policy: POLICIES[config.incompletion], setConfig, resetKey, resetWorkup }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error("useConfig needs a ConfigProvider")
  return ctx
}
