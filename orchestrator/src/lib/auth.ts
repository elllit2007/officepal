import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { logger } from "./logger.js";

/**
 * The orchestrator is only meant to be called by trusted server-side code
 * (Next.js API routes owned by Track 3/4), never directly by a browser or
 * field-staff device. If ORCHESTRATOR_SHARED_SECRET is set, require it.
 * Logs a warning and allows all requests through if unset, so local dev
 * doesn't require configuring a secret — but this must be set in production.
 */
export function requireSharedSecret(req: Request, res: Response, next: NextFunction) {
  if (!config.sharedSecret) {
    logger.warn("ORCHESTRATOR_SHARED_SECRET not set — skipping auth check (dev only)");
    return next();
  }

  const provided = req.header("x-orchestrator-token");
  if (provided !== config.sharedSecret) {
    return res.status(401).json({ error: "unauthorized" });
  }

  return next();
}
