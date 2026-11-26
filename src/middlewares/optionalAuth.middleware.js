
import { authenticate } from "./auth.middleware.js";

/**
 * Optional authentication middleware.
 * If an Authorization header is present it must be a valid Bearer token.
 * If no header is provided, the request continues as unauthenticated (req.user is undefined).
 */
const optionalAuthenticate = (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }

  return authenticate(req, res, next);
};

export { optionalAuthenticate };
