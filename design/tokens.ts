/**
 * OfficePal designtokens — källan till sanning.
 *
 * Allt visuellt i OfficePal refererar hit, antingen via Tailwind-klasser
 * (t.ex. `bg-primary-500`, `text-ink`, `rounded-lg`, `shadow-md`) eller via
 * CSS-variabler (`var(--color-primary-500)`). Hårdkoda aldrig egna hexkoder,
 * mått eller skuggor i komponenter.
 *
 * `design/tokens.css` speglar det här objektet 1:1 för Tailwind v4 (@theme).
 * `design/tokens.test.ts` verifierar att de två filerna inte glider isär.
 *
 * Se DESIGN-SYSTEM.md för hur tokens och komponenter ska användas.
 */

/* ----------------------------------------------------------------------- */
/* Färg                                                                     */
/* ----------------------------------------------------------------------- */

/**
 * Primär: OfficePal-blå. En lugn, mättad blå — pålitlig snarare än
 * "elektrisk". 500 är standardnyansen för knappar och länkar, 900 är
 * navy-bläcket för rubriker och mörka piller.
 */
export const primary = {
  50: "#EEF3FD",
  100: "#DCE6FA",
  200: "#B8CCF4",
  300: "#8DACEB",
  400: "#5B85E1",
  500: "#2A5BD7",
  600: "#2149B3",
  700: "#1A3A8E",
  800: "#142C6B",
  900: "#0E1F4B",
} as const;

/**
 * Neutraler: varm "papperston" (svensk enkelhet — björk, inte betong).
 * 50 är canvas (sidbakgrund), 0 är kort/ytor, 200 är standardkantlinje.
 */
export const neutral = {
  0: "#FFFFFF",
  50: "#F7F6F3",
  100: "#F0EEE9",
  200: "#E6E3DC",
  300: "#D2CEC5",
  400: "#A6A198",
  500: "#7A756C",
  600: "#5E594F",
  700: "#45403A",
  800: "#2C2924",
  900: "#1B1915",
} as const;

/** Semantiska färger — status, varning, fel, success. */
export const semantic = {
  success: {
    soft: "#E6F5EC",
    line: "#BFE5CF",
    ink: "#176A44",
    solid: "#22996A",
  },
  warning: {
    soft: "#FDF3DF",
    line: "#F3DEAC",
    ink: "#8A5B00",
    solid: "#D9920B",
  },
  danger: {
    soft: "#FCE9E9",
    line: "#F2C4C4",
    ink: "#A32D2D",
    solid: "#D24A4A",
  },
  info: {
    soft: primary[50],
    line: primary[200],
    ink: primary[700],
    solid: primary[500],
  },
} as const;

/**
 * Roller — det som komponenter i praktiken använder. Pekar in i skalorna
 * ovan så att en nyansändring slår igenom överallt.
 */
export const roles = {
  /** Sidbakgrund. */
  canvas: neutral[50],
  /** Kort, paneler, inmatningsfält. */
  surface: neutral[0],
  /** Nedtonad yta inuti ett kort (t.ex. kodchip, sekundär panel). */
  surfaceMuted: neutral[100],
  /** Blåtonad yta — vald nav-post, info, Kollegans pratbubbla. */
  surfaceBrand: primary[50],
  /** Mörk yta — mörka piller, "kontroll-läge". */
  surfaceInk: primary[900],

  border: neutral[200],
  borderStrong: neutral[300],
  borderBrand: primary[200],

  /** Rubriker och starkt innehåll. Navy, inte svart. */
  ink: "#16213A",
  /** Brödtext. */
  text: "#3B4353",
  /** Sekundär text, hjälptexter, tidsstämplar. */
  textMuted: "#6E778A",
  /** Text på mörk/blå bakgrund. */
  textOnBrand: neutral[0],
  /** Länkar och interaktiva texter. */
  textBrand: primary[600],

  focusRing: primary[400],
} as const;

/* ----------------------------------------------------------------------- */
/* Typografi                                                                */
/* ----------------------------------------------------------------------- */

/**
 * DM Sans för allt löpande — geometriskt men vänligt, tydliga svenska
 * diakriter, bra siffror. DM Mono för accesskoder och tekniska värden.
 * Laddas via next/font i app/layout.tsx som --font-dm-sans / --font-dm-mono.
 */
export const fontFamily = {
  sans: "var(--font-dm-sans), 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "var(--font-dm-mono), 'DM Mono', ui-monospace, 'Cascadia Mono', monospace",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/**
 * Typskala. Namnen är roller, inte storlekar — använd `text-h2`, inte
 * `text-2xl`. Varje steg har storlek + radhöjd + spärrning + vikt.
 */
export const typeScale = {
  display: { size: "2.5rem", lineHeight: "2.75rem", tracking: "-0.02em", weight: 700 },
  h1: { size: "2rem", lineHeight: "2.375rem", tracking: "-0.02em", weight: 700 },
  h2: { size: "1.5rem", lineHeight: "1.875rem", tracking: "-0.01em", weight: 600 },
  h3: { size: "1.25rem", lineHeight: "1.625rem", tracking: "-0.01em", weight: 600 },
  h4: { size: "1.0625rem", lineHeight: "1.5rem", tracking: "0", weight: 600 },
  "body-lg": { size: "1.125rem", lineHeight: "1.75rem", tracking: "0", weight: 400 },
  body: { size: "1rem", lineHeight: "1.5rem", tracking: "0", weight: 400 },
  "body-sm": { size: "0.875rem", lineHeight: "1.25rem", tracking: "0", weight: 400 },
  label: { size: "0.875rem", lineHeight: "1.25rem", tracking: "0", weight: 500 },
  button: { size: "0.9375rem", lineHeight: "1.25rem", tracking: "0", weight: 600 },
  caption: { size: "0.75rem", lineHeight: "1rem", tracking: "0", weight: 400 },
  eyebrow: { size: "0.75rem", lineHeight: "1rem", tracking: "0.08em", weight: 600 },
} as const;

/* ----------------------------------------------------------------------- */
/* Mått                                                                     */
/* ----------------------------------------------------------------------- */

/**
 * Spacing: 4px-bas. Tailwinds numeriska skala (`p-4` = 16px) är den vi
 * använder; det här objektet dokumenterar de steg vi håller oss till.
 */
export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
} as const;

/**
 * Radie. Generösa hörn (från Divident/4Schools) — kort är `lg`/`xl`,
 * inmatningsfält `md`, knappar och badges `full` (piller).
 */
export const radius = {
  xs: "6px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "28px",
  full: "9999px",
} as const;

/** Skuggor — mjuka, navy-tonade. Aldrig hårda svarta. */
export const shadow = {
  xs: "0 1px 2px rgba(22, 33, 58, 0.05)",
  sm: "0 1px 2px rgba(22, 33, 58, 0.05), 0 2px 6px rgba(22, 33, 58, 0.05)",
  md: "0 2px 4px rgba(22, 33, 58, 0.04), 0 8px 20px rgba(22, 33, 58, 0.08)",
  lg: "0 4px 8px rgba(22, 33, 58, 0.05), 0 16px 40px rgba(22, 33, 58, 0.12)",
  focus: "0 0 0 4px rgba(42, 91, 215, 0.25)",
} as const;

/* ----------------------------------------------------------------------- */
/* Rörelse                                                                  */
/* ----------------------------------------------------------------------- */

/** Timing. Lugnt och kort — inget som "hoppar". */
export const motion = {
  duration: {
    fast: "120ms",
    base: "200ms",
    slow: "320ms",
    /** Kollegans "done"-bekräftelse ligger kvar så här länge. */
    linger: "2000ms",
  },
  easing: {
    out: "cubic-bezier(0.2, 0, 0, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    /** Samma kurvor i arrayform för Framer Motion (`ease: [...]`). */
    outCurve: [0.2, 0, 0, 1] as const,
    inOutCurve: [0.4, 0, 0.2, 1] as const,
    /** Framer Motion-fjäder för Kollegan och pratbubblor. */
    spring: { type: "spring", stiffness: 320, damping: 26 } as const,
    springSoft: { type: "spring", stiffness: 200, damping: 22 } as const,
  },
} as const;

/* ----------------------------------------------------------------------- */
/* Layout                                                                   */
/* ----------------------------------------------------------------------- */

export const layout = {
  /** Max innehållsbredd i admin-vyer. */
  contentMaxWidth: "64rem",
  /** Smal kolumn: formulär, inloggning, fältrapport. */
  narrowMaxWidth: "28rem",
  sidebarWidth: "16rem",
  topbarHeight: "4rem",
} as const;

/* ----------------------------------------------------------------------- */

export const tokens = {
  color: { primary, neutral, semantic, roles },
  fontFamily,
  fontWeight,
  typeScale,
  spacing,
  radius,
  shadow,
  motion,
  layout,
} as const;

export type Tokens = typeof tokens;
export default tokens;
