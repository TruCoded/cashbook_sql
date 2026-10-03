// theme.js - Design system tokens supporting Dark & Light Modes
export const darkTheme = {
  bg: "#090d16",
  surface: "#111726",
  surfaceElevated: "#161e31",
  border: "rgba(255, 255, 255, 0.08)",
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  green: "#10b981",
  red: "#f43f5e",
  card: "#111726",
  navy: "#8b5cf6",
  cream: "#090d16",
};

export const lightTheme = {
  bg: "#f5f7fb",
  surface: "#ffffff",
  surfaceElevated: "#f8fafc",
  border: "rgba(0, 0, 0, 0.08)",
  text: "#0f172a",
  textSecondary: "#475569",
  purple: "#7c3aed",
  blue: "#2563eb",
  green: "#10b981",
  red: "#ef4444",
  card: "#ffffff",
  navy: "#46568c",
  cream: "#f7f3ea",
};

export const colors = lightTheme; // backward compatibility

export const fonts = {
  script: "PlayfairDisplay_500Medium_Italic",
  serifBold: "PlayfairDisplay_700Bold",
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semiBold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
};
