import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Appliquer le thème par défaut
const defaultTheme = {
  primary: 'hsl(173 74% 18%)',
  variant: 'professional',
  appearance: 'light',
  radius: 0.5
};

// Appliquer les variables CSS du thème par défaut
document.documentElement.style.setProperty('--primary', defaultTheme.primary);
document.documentElement.style.setProperty('--radius', `${defaultTheme.radius}rem`);

// Variables pour la barre latérale
const hslMatch = defaultTheme.primary.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
if (hslMatch) {
  const [_, hue, saturation] = hslMatch;
  document.documentElement.style.setProperty('--sidebar-background', `${hue} ${saturation}% 18%`);
  document.documentElement.style.setProperty('--sidebar-primary', `${hue} 70% 30%`);
  document.documentElement.style.setProperty('--sidebar-accent', `${hue} 80% 40%`);
  document.documentElement.style.setProperty('--sidebar-border', `${hue} 60% 25%`);
  document.documentElement.style.setProperty('--sidebar-ring', `${hue} 70% 30%`);
}

// Charger le thème depuis localStorage s'il existe
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    try {
      const themeData = JSON.parse(savedTheme);
      
      // Appliquer les variables CSS au document
      if (themeData.primary) {
        document.documentElement.style.setProperty('--primary', themeData.primary);
        
        // Calculer et appliquer des nuances supplémentaires basées sur la couleur primaire
        const hslMatch = themeData.primary.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
        if (hslMatch) {
          const [_, hue, saturation, lightness] = hslMatch;
          
          // Variables pour la barre latérale
          document.documentElement.style.setProperty('--sidebar-background', `${hue} ${saturation}% 18%`);
          document.documentElement.style.setProperty('--sidebar-primary', `${hue} 70% 30%`);
          document.documentElement.style.setProperty('--sidebar-accent', `${hue} 80% 40%`);
          document.documentElement.style.setProperty('--sidebar-border', `${hue} 60% 25%`);
          document.documentElement.style.setProperty('--sidebar-ring', `${hue} 70% 30%`);
          
          // Variables pour les variations sombres/claires
          document.documentElement.style.setProperty('--primary-dark', `hsl(${hue}, ${saturation}%, ${Math.max(parseInt(lightness) - 10, 0)}%)`);
          document.documentElement.style.setProperty('--primary-light', `hsl(${hue}, ${saturation}%, ${Math.min(parseInt(lightness) + 10, 100)}%)`);
        }
      }
      
      // Appliquer d'autres variables du thème
      if (themeData.radius !== undefined) {
        document.documentElement.style.setProperty('--radius', `${themeData.radius}rem`);
      }
      
      // Appliquer le mode (sombre/clair)
      if (themeData.appearance) {
        if (themeData.appearance === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (themeData.appearance === 'light') {
          document.documentElement.classList.remove('dark');
        } else if (themeData.appearance === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse saved theme:', error);
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
