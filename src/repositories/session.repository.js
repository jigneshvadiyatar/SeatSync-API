
import { UserSession } from "../models/index.js";

const createSession = async (sessionData) => {
  return UserSession.create(sessionData);
};

const findSessionByTokenHash = async (
  refreshTokenHash,
  options = {}
) => {
  return UserSession.findOne({
    where: {
      refresh_token_hash: refreshTokenHash,
    },
    ...options,
  });
};

const findSessionById = async (sessionId) => {
  return UserSession.findByPk(sessionId);
};

const updateSession = async (session, updates, options = {}) => {
  return session.update(updates, options);
};

const revokeSession = async (sessionId) => {
  return UserSession.update(
    { revoked_at: new Date() },
    {
      where: {
        id: sessionId,
        revoked_at: null,
      },
    }
  );
};

const revokeAllUserSessions = async (userId) => {
  return UserSession.update(
    { revoked_at: new Date() },
    {
      where: {
        user_id: userId,
        revoked_at: null,
      },
    }
  );
};

export {
  createSession,
  findSessionByTokenHash,
  findSessionById,
  updateSession,
  revokeSession,
  revokeAllUserSessions,
};
