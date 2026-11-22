
const { User } = require("../models");

const findUserByEmail = async (email) => {
  return User.findOne({
    where: { email },
  });
};

const createUser = async (userData) => {
  return User.create(userData);
};

module.exports = {
  findUserByEmail,
  createUser,
};
