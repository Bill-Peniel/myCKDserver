import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedMode, toggleMode } = useTheme();
  const dark = resolvedMode === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      className={cn("relative text-muted-foreground hover:text-foreground", className)}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={dark ? "Mode clair" : "Mode sombre"}
    >
      <Sun className={cn("absolute transition-all duration-300", dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
      <Moon className={cn("absolute transition-all duration-300", dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
    </Button>
  );
}
