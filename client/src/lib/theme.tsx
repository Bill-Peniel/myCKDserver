import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeAccent = "teal" | "blue" | "violet" | "rose" | "amber" | "slate";

export const THEME_ACCENTS: { value: ThemeAccent; label: string; swatch: string }[] = [
  { value: "teal", label: "Sarcelle", swatch: "hsl(173 80% 36%)" },
  { value: "blue", label: "Bleu", swatch: "hsl(221 83% 53%)" },
  { value: "violet", label: "Violet", swatch: "hsl(262 83% 58%)" },
  { value: "rose", label: "Rose", swatch: "hsl(346 77% 50%)" },
  { value: "amber", label: "Ambre", swatch: "hsl(32 95% 44%)" },
  { value: "slate", label: "Graphite", swatch: "hsl(240 5.9% 10%)" },
];

type ThemeSettings = { mode: ThemeMode; accent: ThemeAccent; radius: number };

type ThemeContextValue = ThemeSettings & {
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
  setRadius: (radius: number) => void;
  toggleMode: () => void;
};

const STORAGE_KEY = "ckd-theme";
const DEFAULTS: ThemeSettings = { mode: "light", accent: "teal", radius: 0.75 };

function readSettings(): ThemeSettings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(readSettings);
  const [systemDark, setSystemDark] = useState(prefersDark);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedMode = settings.mode === "system" ? (systemDark ? "dark" : "light") : settings.mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedMode === "dark");
    root.dataset.accent = settings.accent;
    root.style.setProperty("--radius", `${settings.radius}rem`);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // stockage indisponible (navigation privée) : le thème reste appliqué pour la session
    }
  }, [settings, resolvedMode]);

  const update = (patch: Partial<ThemeSettings>) => setSettings((prev) => ({ ...prev, ...patch }));

  return (
    <ThemeContext.Provider
      value={{
        ...settings,
        resolvedMode,
        setMode: (mode) => update({ mode }),
        setAccent: (accent) => update({ accent }),
        setRadius: (radius) => update({ radius }),
        toggleMode: () => update({ mode: resolvedMode === "dark" ? "light" : "dark" }),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  return context;
}
