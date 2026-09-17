import { describe, expect, it } from "vitest";
import { validateOnboarding } from "./validate";

const VALID = {
  companyName: "Ninas Städ AB",
  adminEmail: "nina@example.com",
  adminPassword: "hemligt123",
};

describe("validateOnboarding", () => {
  it("accepts a complete, valid form", () => {
    expect(validateOnboarding(VALID)).toEqual({});
  });

  it("requires a company name (whitespace does not count)", () => {
    expect(validateOnboarding({ ...VALID, companyName: "  " })).toEqual({
      companyName: "Ange företagsnamn.",
    });
  });

  it("requires an email", () => {
    expect(validateOnboarding({ ...VALID, adminEmail: "" }).adminEmail).toMatch(/e-postadress/);
  });

  it("rejects a malformed email", () => {
    expect(validateOnboarding({ ...VALID, adminEmail: "nina@" }).adminEmail).toBe(
      "Det ser inte ut som en giltig e-postadress.",
    );
    expect(validateOnboarding({ ...VALID, adminEmail: "nina example.com" }).adminEmail).toBeDefined();
  });

  it("requires a password", () => {
    expect(validateOnboarding({ ...VALID, adminPassword: "" })).toEqual({
      adminPassword: "Välj ett lösenord.",
    });
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(validateOnboarding({ ...VALID, adminPassword: "kort1" }).adminPassword).toBe(
      "Lösenordet måste vara minst 8 tecken.",
    );
  });

  it("reports every invalid field at once", () => {
    const errors = validateOnboarding({ companyName: "", adminEmail: "", adminPassword: "" });
    expect(Object.keys(errors).sort()).toEqual(["adminEmail", "adminPassword", "companyName"]);
  });
});
