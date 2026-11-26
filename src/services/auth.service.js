
import argon2 from "argon2";
import sequelizeLibrary from "sequelize";
import * as authRepository from "../repositories/auth.repository.js";

const { UniqueConstraintError } = sequelizeLibrary;

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

  // Hash password using Argon2id before storing
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

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

  // Return a generic error so callers cannot enumerate valid emails.
  if (!user || !user.password_hash) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await argon2.verify(
    user.password_hash,
    password
  );

  if (!isPasswordValid || !user.is_active) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Update last login timestamp (fire-and-forget — do not block the response)
  authRepository.updateLastLogin(user.id).catch(() => {});

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};



export {
    registerUser,
    loginUser,
};
