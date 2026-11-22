const bcrypt = require("bcrypt");
const { UniqueConstraintError } = require("sequelize");
const authRepository = require("../repositories/auth.repository");
const { generateAccessToken } = require("../utils/token.util");

const SALT_ROUNDS = 12;

const registerUser = async ({ name, email, password }) => {
  // Normalize the email before checking the database
  const normalizedEmail = email.trim().toLowerCase();

  // Check whether the user already exists
  const existingUser = await authRepository.findUserByEmail(normalizedEmail);

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  // Hash password before storing it
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user;

  try {
    user = await authRepository.createUser({
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
    });
  } catch (error) {
    // Handles concurrent registrations with the same email
    if (error instanceof UniqueConstraintError) {
      const conflict = new Error("Email is already registered");
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }

  // Never return the password hash to the client
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.createdAt,
  };
};



const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await authRepository.findUserByEmail(normalizedEmail);

  if (!user || !user.password_hash) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!user.is_active) {
    const error = new Error("Account is disabled");
    error.statusCode = 403;
    throw error;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};



module.exports = {
    registerUser,
    loginUser,
};
