import type { Request, RequestHandler, Response } from "express";

/**
 * Express 4 does not catch a rejected promise returned from an async route
 * handler — it becomes an unhandled rejection and the request just hangs
 * (the client times out; the error middleware in src/index.ts never fires).
 * Wrapping every async handler in this forwards the rejection to `next()`
 * so it actually reaches that middleware and gets a 500 response.
 */
export function asyncHandler(
  handler: (req: Request, res: Response) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}
