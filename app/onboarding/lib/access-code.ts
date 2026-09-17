// Track 7 — genererar korta, lätta-att-skriva-av accesskoder för
// fältpersonal (staff.access_code, se BUILD-CONTRACT.md).
//
// Alfabetet undviker tecken som lätt förväxlas (0/O, 1/I/l) eftersom koden
// ska skrivas av från en lapp/skärm av fältpersonal.

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateAccessCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
