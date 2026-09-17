function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  // Optional on purpose: fail open with a startup warning rather than crash,
  // so local dev without the secret still boots. checked per-request in
  // src/middleware/auth.ts.
  sharedSecret: process.env.ORCHESTRATOR_SHARED_SECRET ?? null,
};
