const positiveInteger = (value) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;

const validateEnvironment = () => {
  for (const key of ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "JWT_ACCESS_SECRET"]) {
    if (!process.env[key]?.trim()) throw new Error(`${key} is required`);
  }

  for (const key of ["PORT", "DB_PORT", "REFRESH_TOKEN_TTL_DAYS", "SEAT_HOLD_TTL_SECONDS", "BOOKING_TTL_SECONDS"]) {
    if (process.env[key] !== undefined && !positiveInteger(process.env[key])) {
      throw new Error(`${key} must be a positive integer`);
    }
  }
  for (const key of ["PORT", "DB_PORT"]) {
    if (Number(process.env[key]) > 65535) throw new Error(`${key} must be at most 65535`);
  }
};

export { validateEnvironment };
