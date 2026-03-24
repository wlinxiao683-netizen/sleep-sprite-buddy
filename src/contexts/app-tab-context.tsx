import { createContext, useContext, type ReactNode } from "react";

type AppTabContextValue = {
  goToPlan: () => void;
};

const AppTabContext = createContext<AppTabContextValue | null>(null);

export function AppTabProvider({
  children,
  goToPlan,
}: {
  children: ReactNode;
  goToPlan: () => void;
}) {
  return <AppTabContext.Provider value={{ goToPlan }}>{children}</AppTabContext.Provider>;
}

export function useAppTab() {
  const ctx = useContext(AppTabContext);
  if (!ctx) throw new Error("useAppTab must be used within AppTabProvider");
  return ctx;
}
