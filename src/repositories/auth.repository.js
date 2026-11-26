
import { User } from "../models/index.js";

const findUserByEmail = async (email) => {
  return User.findOne({
    where: { email },
  });
};

const createUser = async (userData) => {
  return User.create(userData);
};

/**
 * Updates the last_login_at timestamp for a user.
 * Called fire-and-forget after a successful login.
 */
const updateLastLogin = async (userId) => {
  return User.update(
    { last_login_at: new Date() },
    { where: { id: userId } }
  );
};

export {
  findUserByEmail,
  createUser,
  updateLastLogin,
};
