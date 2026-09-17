import { OrchestratorRequestError } from "./errors";
import type { OrchestratorErrorBody } from "./types";

/**
 * Base URL of the Track 2 orchestrator service, e.g.
 * "https://officepal-orchestrator.fly.dev". No trailing slash required.
 */
function getBaseUrl(): string {
  const url = process.env.ORCHESTRATOR_URL;
  if (!url) {
    throw new Error("ORCHESTRATOR_URL is not set");
  }
  return url.replace(/\/+$/, "");
}

async function post<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Optional per orchestrator/README.md: required only when the orchestrator
  // deployment has ORCHESTRATOR_SHARED_SECRET set.
  const sharedSecret = process.env.ORCHESTRATOR_SHARED_SECRET;
  if (sharedSecret) {
    headers["x-orchestrator-token"] = sharedSecret;
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const parsed = text ? safeJsonParse(text) : undefined;

  if (!res.ok) {
    throw new OrchestratorRequestError(
      res.status,
      (parsed as OrchestratorErrorBody | undefined) ?? text
    );
  }

  return parsed as TResponse;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const orchestratorClient = { post };
