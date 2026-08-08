// Elegant, masculine, uncluttered design language.
// Deep ink backgrounds with a refined royal-blue brand color and a warm
// bronze accent. Generous spacing keeps screens calm, not crowded.

export interface Theme {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  primary: string;
  primarySoft: string;
  accent: string; // bronze / gold highlight
  text: string;
  textMuted: string;
  border: string;
  selectedBorder: string;
  danger: string;
  success: string;
  warning: string;
}

export const darkTheme: Theme = {
  isDark: true,
  background: "#0F141C",
  surface: "#161E2A",
  surfaceAlt: "#1B2533",
  card: "#18212F",
  primary: "#17569b",
  primarySoft: "#13324f",
  accent: "#094c95",
  text: "#E9EDF3",
  textMuted: "#8A94A6",
  border: "#243043",
  selectedBorder: "#094c95",
  danger: "#E5555C",
  success: "#33B285",
  warning: "#E0A93B",
};

// Light theme — per product spec:
// page bg #fafafa, item bg #ffffff, primary #17569b, selected border #094c95
export const lightTheme: Theme = {
  isDark: false,
  background: "#fafafa",
  surface: "#ffffff",
  surfaceAlt: "#f2f4f7",
  card: "#ffffff",
  primary: "#17569b",
  primarySoft: "#e3edf7",
  accent: "#094c95",
  text: "#15202e",
  textMuted: "#5c6675",
  border: "#e2e6ec",
  selectedBorder: "#094c95",
  danger: "#d2434a",
  success: "#1f9c72",
  warning: "#c8901f",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  small: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: "500" as const, lineHeight: 14 },
};

export const shadow = (theme: Theme) => ({
  card: {
    shadowColor: theme.isDark ? "#000000" : "#1A2230",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: theme.isDark ? 0.45 : 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
});
