import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  fontFamily,
  motion,
  neutral,
  primary,
  radius,
  roles,
  semantic,
  shadow,
  typeScale,
} from "./tokens";

/**
 * design/tokens.ts är källan till sanning; design/tokens.css är dess spegel
 * för Tailwind. Det här testet ser till att ingen ändrar den ena utan den
 * andra.
 */
const css = readFileSync(path.join(__dirname, "tokens.css"), "utf8");

function expectVar(name: string, value: string | number) {
  const pattern = new RegExp(
    `${name.replace(/[-]/g, "\\-")}:\\s*${String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*;`,
  );
  expect(css, `${name} ska vara ${value} i tokens.css`).toMatch(pattern);
}

describe("tokens.css speglar tokens.ts", () => {
  it("primärskalan", () => {
    for (const [step, hex] of Object.entries(primary)) {
      expectVar(`--color-primary-${step}`, hex);
    }
  });

  it("neutralskalan", () => {
    for (const [step, hex] of Object.entries(neutral)) {
      expectVar(`--color-neutral-${step}`, hex);
    }
  });

  it("semantiska färger", () => {
    for (const [tone, set] of Object.entries(semantic)) {
      expectVar(`--color-${tone}`, set.solid);
      expectVar(`--color-${tone}-soft`, set.soft);
      expectVar(`--color-${tone}-line`, set.line);
      expectVar(`--color-${tone}-ink`, set.ink);
    }
  });

  it("roller", () => {
    expectVar("--color-canvas", roles.canvas);
    expectVar("--color-surface", roles.surface);
    expectVar("--color-surface-muted", roles.surfaceMuted);
    expectVar("--color-surface-brand", roles.surfaceBrand);
    expectVar("--color-surface-ink", roles.surfaceInk);
    expectVar("--color-line", roles.border);
    expectVar("--color-line-strong", roles.borderStrong);
    expectVar("--color-line-brand", roles.borderBrand);
    expectVar("--color-ink", roles.ink);
    expectVar("--color-fg", roles.text);
    expectVar("--color-muted", roles.textMuted);
    expectVar("--color-on-brand", roles.textOnBrand);
    expectVar("--color-link", roles.textBrand);
    expectVar("--color-focus", roles.focusRing);
  });

  it("typografi", () => {
    expectVar("--font-sans", fontFamily.sans);
    expectVar("--font-mono", fontFamily.mono);
    for (const [name, step] of Object.entries(typeScale)) {
      expectVar(`--text-${name}`, step.size);
      expectVar(`--text-${name}--line-height`, step.lineHeight);
      expectVar(`--text-${name}--letter-spacing`, step.tracking);
      expectVar(`--text-${name}--font-weight`, step.weight);
    }
  });

  it("radie och skuggor", () => {
    for (const [name, value] of Object.entries(radius)) {
      expectVar(`--radius-${name}`, value);
    }
    for (const [name, value] of Object.entries(shadow)) {
      expectVar(`--shadow-${name}`, value);
    }
  });

  it("rörelse", () => {
    expectVar("--ease-out", motion.easing.out);
    expectVar("--ease-in-out", motion.easing.inOut);
    for (const [name, value] of Object.entries(motion.duration)) {
      expectVar(`--duration-${name}`, value);
    }
  });
});
