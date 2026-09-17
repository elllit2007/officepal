import { describe, expect, it } from "vitest";
import { validateFaltrapport } from "./validate";

const VALID_TEXT = "Städade kontoret på Storgatan 4 och tvättade fönster.";

describe("validateFaltrapport", () => {
  it("passes a seed-style numeric code and a real description", () => {
    expect(validateFaltrapport({ access_code: "1001", job_text: VALID_TEXT })).toEqual({});
  });

  it("passes an onboarding-style alphanumeric code", () => {
    expect(validateFaltrapport({ access_code: "AB3K7P", job_text: VALID_TEXT })).toEqual({});
  });

  it("flags an empty code in Swedish", () => {
    expect(validateFaltrapport({ access_code: "   ", job_text: VALID_TEXT })).toEqual({
      access_code: "Ange din kod.",
    });
  });

  it("flags a code with spaces or symbols", () => {
    const errors = validateFaltrapport({ access_code: "10 01!", job_text: VALID_TEXT });
    expect(errors.access_code).toMatch(/bokstäver och siffror/);
  });

  it("flags a too-short code", () => {
    expect(validateFaltrapport({ access_code: "12", job_text: VALID_TEXT }).access_code).toBeDefined();
  });

  it("flags an empty description", () => {
    expect(validateFaltrapport({ access_code: "1001", job_text: "" })).toEqual({
      job_text: "Beskriv jobbet innan du skickar.",
    });
  });

  it("flags a description that is too short", () => {
    expect(validateFaltrapport({ access_code: "1001", job_text: "ok" }).job_text).toMatch(
      /minst 10 tecken/,
    );
  });

  it("reports both fields at once", () => {
    const errors = validateFaltrapport({ access_code: "", job_text: "" });
    expect(Object.keys(errors).sort()).toEqual(["access_code", "job_text"]);
  });
});
