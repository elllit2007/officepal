export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function wrapEmailHtml(bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px;">
      ${bodyHtml}
    </div>
  `.trim();
}
