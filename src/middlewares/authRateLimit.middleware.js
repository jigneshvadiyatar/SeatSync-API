const windowMs = 15 * 60 * 1000;
const attemptsPerWindow = 10;
const maxTrackedAddresses = 10_000;
const attempts = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [address, attempt] of attempts) {
    if (attempt.resetAt <= now) attempts.delete(address);
  }
}, 60_000).unref();

const limitLogin = (req, res, next) => {
  const address = req.ip;
  const now = Date.now();
  let attempt = attempts.get(address);
  if (!attempt || attempt.resetAt <= now) {
    if (!attempt && attempts.size >= maxTrackedAddresses) {
      return res.set("Retry-After", "60").status(429).json({
        success: false,
        message: "Too many login attempts. Try again later.",
      });
    }
    attempt = { count: 0, resetAt: now + windowMs };
    attempts.set(address, attempt);
  }

  attempt.count++;
  if (attempt.count > attemptsPerWindow) {
    return res.set("Retry-After", String(Math.ceil((attempt.resetAt - now) / 1000))).status(429).json({
      success: false,
      message: "Too many login attempts. Try again later.",
    });
  }
  next();
};

export { limitLogin };
