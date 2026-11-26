
import jwt from "jsonwebtoken";

const accessTokenTtl = () => process.env.JWT_ACCESS_TTL || process.env.JWT_ACCESS_EXPIRES_IN || "15m";

const generateAccessToken = (user, sessionId) => {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  if (!sessionId) {
    throw new Error("Session ID is required");
  }

  return jwt.sign(
    {
      role: user.role,
      sid: sessionId,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      subject: String(user.id),
      expiresIn: accessTokenTtl(),
      algorithm: "HS256",
    }
  );
};


const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
  });
};

export {
  accessTokenTtl,
  generateAccessToken,
  verifyAccessToken,
};
