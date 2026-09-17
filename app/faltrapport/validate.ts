export type FieldName = "access_code" | "job_text";
export type FieldErrors = Partial<Record<FieldName, string>>;

// Accesskoder är antingen seed-siffror ("1001") eller onboardingens
// 6-teckenkoder (A–Z + 2–9), så inputen får inte låsas till siffror.
const ACCESS_CODE_PATTERN = /^[A-Za-z0-9]{4,}$/;
const MIN_JOB_TEXT_LENGTH = 10;

// Klientvalidering med svenska felmeddelanden innan något skickas. Servern
// (/api/faltrapport) validerar fortfarande på sitt håll.
export function validateFaltrapport(values: {
  access_code: string;
  job_text: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const code = values.access_code.trim();
  const text = values.job_text.trim();

  if (!code) {
    errors.access_code = "Ange din kod.";
  } else if (!ACCESS_CODE_PATTERN.test(code)) {
    errors.access_code = "Koden består bara av bokstäver och siffror, minst 4 tecken.";
  }

  if (!text) {
    errors.job_text = "Beskriv jobbet innan du skickar.";
  } else if (text.length < MIN_JOB_TEXT_LENGTH) {
    errors.job_text = `Beskriv jobbet lite mer, minst ${MIN_JOB_TEXT_LENGTH} tecken.`;
  }

  return errors;
}
