
import sequelizeLibrary from "sequelize";
import { User, UserSession } from "../models/index.js";

const { Op } = sequelizeLibrary;

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

const findUsers = ({ page, limit, search }) => {
  const where = {};
  if (search) {
    const pattern = '%' + search.replace(/[\\%_]/g, "\\$&") + '%';
    where[Op.or] = [{ name: { [Op.iLike]: pattern } }, { email: { [Op.iLike]: pattern } }];
  }
  return User.findAndCountAll({
    where,
    attributes: ["id", "name", "email", "role", "is_active", "createdAt"],
    order: [["createdAt", "DESC"], ["id", "ASC"]],
    limit,
    offset: (page - 1) * limit,
  });
};

export {
  findUsers,
  findUserById,
  updateUser,
  findActiveSessions,
  findOwnedSession,
  revokeUserSession,
  revokeAllSessions,
};
