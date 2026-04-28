import { useEffect } from "react";
import { applyTheme, loadConfig } from "@/lib/admin-config";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(loadConfig().theme);
  }, []);
  return <>{children}</>;
}
