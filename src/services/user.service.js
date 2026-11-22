
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");
const userRepository = require("../repositories/user.respsitory");

const SALT_ROUNDS = 12;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone_number: user.phone_number,
  avatar_url: user.avatar_url,
  role: user.role,
  is_active: user.is_active,
  email_verified_at: user.email_verified_at,
  last_login_at: user.last_login_at,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
});

// GET PROFILE
const getProfile = async (userId) => {
  const user = await userRepository.findUserById(userId);

  if (!user || !user.is_active) {
    throw createError("User not found", 404);
  }

  return sanitizeUser(user);
};

// UPDATE PROFILE
const updateProfile = async (userId, payload) => {
  const user = await userRepository.findUserById(userId);

  if (!user || !user.is_active) {
    throw createError("User not found", 404);
  }

  const updates = {};

  if (payload.name !== undefined) {
    updates.name = payload.name.trim();
  }

  if (payload.phone_number !== undefined) {
    updates.phone_number = payload.phone_number;
  }

  if (payload.avatar_url !== undefined) {
    updates.avatar_url = payload.avatar_url;
  }

  if (Object.keys(updates).length === 0) {
    throw createError("No fields provided for update", 400);
  }

  const updatedUser = await userRepository.updateUser(
    user,
    updates
  );

  return sanitizeUser(updatedUser);
};

// CHANGE PASSWORD
const changePassword = async (
  userId,
  { currentPassword, newPassword }
) => {
  await sequelize.transaction(async (transaction) => {
    const user = await userRepository.findUserById(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!user || !user.is_active) {
      throw createError("User not found", 404);
    }

    if (!user.password_hash) {
      throw createError(
        "Password login is not configured for this account",
        400
      );
    }

    const isValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isValid) {
      throw createError("Current password is incorrect", 401);
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash
    );

    if (isSamePassword) {
      throw createError(
        "New password must be different from current password",
        400
      );
    }

    const newPasswordHash = await bcrypt.hash(
      newPassword,
      SALT_ROUNDS
    );

    await userRepository.updateUser(
      user,
      { password_hash: newPasswordHash },
      { transaction }
    );

    // Force re-login on all devices after password change.
    await userRepository.revokeAllSessions(userId, {
      transaction,
    });
  });

  return {
    message: "Password changed successfully. Please log in again.",
  };
};

// LIST ACTIVE SESSIONS
const getSessions = async (userId, currentSessionId) => {
  const sessions = await userRepository.findActiveSessions(userId);

  return sessions.map((session) => ({
    id: session.id,
    userAgent: session.user_agent,
    ipAddress: session.ip_address,
    createdAt: session.createdAt,
    expiresAt: session.expires_at,
    isCurrent: session.id === currentSessionId,
  }));
};

// REVOKE A SESSION
const revokeSession = async (
  userId,
  sessionId
) => {
  const session = await userRepository.findOwnedSession(
    userId,
    sessionId
  );

  if (!session) {
    throw createError("Session not found", 404);
  }

  if (session.revoked_at) {
    throw createError("Session is already revoked", 409);
  }

  await userRepository.revokeUserSession(userId, sessionId);

  return {
    message: "Session revoked successfully",
  };
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getSessions,
  revokeSession,
};
