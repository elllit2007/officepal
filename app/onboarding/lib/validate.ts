// Klientvalidering för onboarding-formuläret med svenska felmeddelanden.
// Server-actionen (actions.ts) validerar fortfarande på sitt håll — det här
// finns för att användaren ska få besked innan formuläret skickas.

export const MIN_PASSWORD_LENGTH = 8;

// Medvetet enkel: "något@något.något". Supabase Auth avgör slutgiltigt.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type OnboardingField = "companyName" | "adminEmail" | "adminPassword";
export type OnboardingFieldErrors = Partial<Record<OnboardingField, string>>;

export function validateOnboarding(values: {
  companyName: string;
  adminEmail: string;
  adminPassword: string;
}): OnboardingFieldErrors {
  const errors: OnboardingFieldErrors = {};

  if (!values.companyName.trim()) {
    errors.companyName = "Ange företagsnamn.";
  }

  const email = values.adminEmail.trim();
  if (!email) {
    errors.adminEmail = "Ange en e-postadress för admin-kontot.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.adminEmail = "Det ser inte ut som en giltig e-postadress.";
  }

  if (!values.adminPassword) {
    errors.adminPassword = "Välj ett lösenord.";
  } else if (values.adminPassword.length < MIN_PASSWORD_LENGTH) {
    errors.adminPassword = `Lösenordet måste vara minst ${MIN_PASSWORD_LENGTH} tecken.`;
  }

  return errors;
}
