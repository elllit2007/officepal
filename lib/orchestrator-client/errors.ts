import type { OrchestratorErrorBody } from "./types";

/**
 * Thrown for any non-2xx response from the orchestrator. `body` is the
 * parsed JSON error payload (see OrchestratorErrorBody) when the response
 * was JSON, otherwise the raw response text.
 */
export class OrchestratorRequestError extends Error {
  readonly status: number;
  readonly body: OrchestratorErrorBody | string;

  constructor(status: number, body: OrchestratorErrorBody | string) {
    const code = typeof body === "string" ? body : body.error;
    super(`orchestrator request failed (${status}): ${code}`);
    this.name = "OrchestratorRequestError";
    this.status = status;
    this.body = body;
  }
}
