import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ThemeDefinition {
  id: ThemeMode;
  name: string;
  tagline: string;
  description: string;
  isDark: boolean;
  colors: {
    bg: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    border: string;
  };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'light',
    name: 'Light Minimal',
    tagline: 'Crisp & Clean',
    description: 'Clean, high-contrast daylight workspace with vibrant indigo accents and soft slate framing.',
    isDark: false,
    colors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      primary: '#4f46e5',
      accent: '#6366f1',
      text: '#0f172a',
      border: '#e2e8f0',
    },
  },
  {
    id: 'dark',
    name: 'Midnight Dark',
    tagline: 'Deep Obsidian',
    description: 'Deep slate surfaces and reduced eye strain with luminous indigo and violet glows.',
    isDark: true,
    colors: {
      bg: '#0b0f19',
      surface: '#111827',
      primary: '#6366f1',
      accent: '#818cf8',
      text: '#f9fafb',
      border: '#374151',
    },
  },
  {
    id: 'calm',
    name: 'Serene Calm',
    tagline: 'Sage & Sandstone',
    description: 'Warm, grounding linen neutrals paired with tranquil sage green accents for peaceful study sessions.',
    isDark: false,
    colors: {
      bg: '#f7f5f0',
      surface: '#ffffff',
      primary: '#059669',
      accent: '#10b981',
      text: '#292524',
      border: '#ded5c2',
    },
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    tagline: 'Midnight Sea & Aqua',
    description: 'Immersive deep marine navy palette illuminated with bright cyan and coastal turquoise reflections.',
    isDark: true,
    colors: {
      bg: '#081325',
      surface: '#0c1e3d',
      primary: '#06b6d4',
      accent: '#38bdf8',
      text: '#f0fdfa',
      border: '#1d427d',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura Blossom',
    tagline: 'Petal Blush & Rose',
    description: 'Delicate floral aesthetic featuring soft blush hues, rose quartz surfaces, and radiant berry accents.',
    isDark: false,
    colors: {
      bg: '#fff7f9',
      surface: '#ffffff',
      primary: '#e11d48',
      accent: '#f43f5e',
      text: '#4c0519',
      border: '#fbcfe8',
    },
  },
  {
    id: 'cyber',
    name: 'Cyber Synth',
    tagline: 'Obsidian & Neon Fuchsia',
    description: 'High-tech cyberpunk dark canvas accented with electric magenta, neon cyan, and synthwave violet.',
    isDark: true,
    colors: {
      bg: '#050508',
      surface: '#0f0f17',
      primary: '#d946ef',
      accent: '#06b6d4',
      text: '#f8fafc',
      border: '#323254',
    },
  },
  {
    id: 'classic',
    name: 'Classic Scholastic',
    tagline: 'Oxford Navy & Ivory',
    description: 'Traditional collegiate parchment paired with authoritative Oxford blue and antique warm accents.',
    isDark: false,
    colors: {
      bg: '#fbfaf8',
      surface: '#ffffff',
      primary: '#1e3a8a',
      accent: '#2563eb',
      text: '#0f172a',
      border: '#d8ceb7',
    },
  },
];

interface ThemeContextType {
  theme: ThemeMode;
  themeInfo: ThemeDefinition;
  themesList: ThemeDefinition[];
  setTheme: (newTheme: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();

  // Initialize theme from userProfile, localStorage, or fallback to 'light'
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('focusflow_theme') as ThemeMode;
    if (saved && THEMES.some(t => t.id === saved)) {
      return saved;
    }
    return 'light';
  });

  // Keep in sync when user profile loads from Firestore
  useEffect(() => {
    if (userProfile?.theme && userProfile.theme !== theme) {
      setThemeState(userProfile.theme);
      localStorage.setItem('focusflow_theme', userProfile.theme);
    }
  }, [userProfile?.theme]);

  // Apply theme attributes and classes to document root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    const currentThemeDef = THEMES.find(t => t.id === theme) || THEMES[0];
    if (currentThemeDef.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('focusflow_theme', theme);
  }, [theme]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('focusflow_theme', newTheme);

    // Persist to user account in Firestore if authenticated
    if (user && db) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          theme: newTheme,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to persist theme to Firestore:', err);
      }
    }
  };

  const themeInfo = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeInfo,
        themesList: THEMES,
        setTheme,
        isDark: themeInfo.isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
