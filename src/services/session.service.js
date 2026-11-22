
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const sessionRepository = require("../repositories/session.repository");

const {
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} = require("../utils/refreshToken.util");

const { generateAccessToken } = require("../utils/token.util");
const { User } = require("../models");

const createSession = async (user, metadata = {}) => {
  const refreshToken = generateRefreshToken();

  const session = await sessionRepository.createSession({
    user_id: user.id,
    refresh_token_hash: hashRefreshToken(refreshToken),
    user_agent: metadata.userAgent || null,
    ip_address: metadata.ipAddress || null,
    expires_at: getRefreshTokenExpiry(),
  });

  return {
    sessionId: session.id,
    refreshToken,
  };
};

const refreshSession = async (refreshToken) => {
  if (!refreshToken || typeof refreshToken !== "string") {
    const error = new Error("Refresh token is required");
    error.statusCode = 401;
    throw error;
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const nextRefreshToken = generateRefreshToken();
  const nextTokenHash = hashRefreshToken(nextRefreshToken);

  const result = await sequelize.transaction(async (transaction) => {
    const session = await sessionRepository.findSessionByTokenHash(
      tokenHash,
      {
        transaction,
        lock: transaction.LOCK.UPDATE,
      }
    );

    if (!session || session.revoked_at) {
      const error = new Error("Invalid or revoked refresh token");
      error.statusCode = 401;
      throw error;
    }

    if (new Date(session.expires_at) <= new Date()) {
      const error = new Error("Refresh token has expired");
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findByPk(session.user_id, {
      transaction,
    });

    if (!user || !user.is_active) {
      const error = new Error("Account is inactive");
      error.statusCode = 401;
      throw error;
    }

    await sessionRepository.updateSession(
      session,
      {
        refresh_token_hash: nextTokenHash,
        expires_at: getRefreshTokenExpiry(),
      },
      { transaction }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      refreshToken: nextRefreshToken,
    };
  });

  const accessToken = generateAccessToken(result.user);

  return {
    accessToken,
    refreshToken: result.refreshToken,
    tokenType: "Bearer",
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  };
};

const logoutSession = async (refreshToken) => {
  if (!refreshToken || typeof refreshToken !== "string") {
    const error = new Error("Refresh token is required");
    error.statusCode = 400;
    throw error;
  }

  const session = await sessionRepository.findSessionByTokenHash(
    hashRefreshToken(refreshToken)
  );

  if (session && !session.revoked_at) {
    await sessionRepository.revokeSession(session.id);
  }

  return { message: "Logged out successfully" };
};

const logoutAllSessions = async (userId) => {
  await sessionRepository.revokeAllUserSessions(userId);

  return { message: "Logged out from all devices" };
};

module.exports = {
  createSession,
  refreshSession,
  logoutSession,
  logoutAllSessions,
};
