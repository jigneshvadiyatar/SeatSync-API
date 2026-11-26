
import crypto from "node:crypto";

const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7;

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

const getRefreshTokenExpiry = () => {
  const expiresAt = new Date();

  expiresAt.setUTCDate(
    expiresAt.getUTCDate() + REFRESH_TOKEN_DAYS
  );

  return expiresAt;
};

export {
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
};
