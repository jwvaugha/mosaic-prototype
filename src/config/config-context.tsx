import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { POLICIES, type IncompletionPolicy } from "@/policies/incompletion"
import { loadConfig, saveConfig, type TestConfig } from "./test-config"

type ConfigContextValue = {
  config: TestConfig
  policy: IncompletionPolicy
  setConfig: (update: (c: TestConfig) => TestConfig) => void
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, set] = useState(loadConfig)
  const setConfig = useCallback((update: (c: TestConfig) => TestConfig) => {
    set((c) => {
      const next = update(c)
      saveConfig(next)
      return next
    })
  }, [])
  return (
    <ConfigContext.Provider value={{ config, policy: POLICIES[config.incompletion], setConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error("useConfig needs a ConfigProvider")
  return ctx
}
