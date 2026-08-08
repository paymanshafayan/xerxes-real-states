// Brand color matches the website (royal blue, see src/app/layout.tsx viewport.themeColor).
// Layout language (cards, banners, icon grids, bottom sheets) follows the
// reference screenshots the user provided.
export const colors = {
  primary: "#1a56db",
  primaryDark: "#1e40af",
  primaryLight: "#e8f0fe",
  accent: "#facc15", // banner CTA accent (yellow, as in the reference "LEARN MORE" button)
  background: "#ffffff",
  surface: "#f8f9fb",
  sectionBg: "#f4f6fa",
  border: "#e5e7eb",
  text: "#111827",
  textMuted: "#6b7280",
  textOnPrimary: "#ffffff",
  success: "#16a34a",
  danger: "#dc2626",
  discount: "#dc2626",
  star: "#f59e0b",
  overlayGradientStart: "#6d28d9",
  overlayGradientEnd: "#3b82f6",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
};

export const shadow = {
  card: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  floating: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const typography = {
  h1: { fontSize: 26, fontWeight: "700" as const },
  h2: { fontSize: 20, fontWeight: "700" as const },
  h3: { fontSize: 16, fontWeight: "600" as const },
  body: { fontSize: 14, fontWeight: "400" as const },
  small: { fontSize: 12, fontWeight: "400" as const },
};
