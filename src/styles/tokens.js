// ─────────────────────────────────────────────────────
// tokens.js — single source of truth for every visual
// decision in the app. Import T from here everywhere.
// ─────────────────────────────────────────────────────

export const T = {
  // brand
  brand:      "#E8500A",
  brandDark:  "#C04008",
  brandLight: "#FFF0EB",

  // neutrals
  bg:       "#F7F6F3",
  surface:  "#FFFFFF",
  surface2: "#F2F0EC",
  surface3: "#E8E5DF",
  black:    "#0F0E0D",

  // text
  text:  "#131211",
  muted: "#6B6460",
  hint:  "#A09890",

  // borders
  border:    "rgba(0,0,0,0.08)",
  borderMed: "rgba(0,0,0,0.15)",

  // semantic
  green:   "#1A7F4B",
  greenBg: "#EDFAF3",
  amber:   "#92530A",
  amberBg: "#FEF3CD",
  red:     "#A32D2D",
  redBg:   "#FEECEC",
  blue:    "#1D4ED8",
  blueBg:  "#EFF6FF",

  // radii
  r: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },

  // shadows
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.07)",
    md: "0 4px 16px rgba(0,0,0,0.07)",
    lg: "0 12px 40px rgba(0,0,0,0.10)",
    xl: "0 24px 64px rgba(0,0,0,0.14)",
  },
};