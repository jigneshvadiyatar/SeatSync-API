
const { Op } = require("sequelize");
const { User, UserSession } = require("../models");

const findUserById = async (userId, options = {}) => {
  return User.findByPk(userId, options);
};

const updateUser = async (user, updates, options = {}) => {
  return user.update(updates, options);
};

const findActiveSessions = async (userId) => {
  return UserSession.findAll({
    where: {
      user_id: userId,
      revoked_at: null,
      expires_at: {
        [Op.gt]: new Date(),
      },
    },
    attributes: [
      "id",
      "user_agent",
      "ip_address",
      "createdAt",
      "expires_at",
    ],
    order: [["createdAt", "DESC"]],
  });
};

const findOwnedSession = async (
  userId,
  sessionId,
  options = {}
) => {
  return UserSession.findOne({
    where: {
      id: sessionId,
      user_id: userId,
    },
    ...options,
  });
};

const revokeUserSession = async (
  userId,
  sessionId,
  options = {}
) => {
  return UserSession.update(
    { revoked_at: new Date() },
    {
      where: {
        id: sessionId,
        user_id: userId,
        revoked_at: null,
      },
      ...options,
    }
  );
};

const revokeAllSessions = async (userId, options = {}) => {
  return UserSession.update(
    { revoked_at: new Date() },
    {
      where: {
        user_id: userId,
        revoked_at: null,
      },
      ...options,
    }
  );
};

module.exports = {
  findUserById,
  updateUser,
  findActiveSessions,
  findOwnedSession,
  revokeUserSession,
  revokeAllSessions,
};
