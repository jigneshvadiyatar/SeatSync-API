
import * as userService from "../services/user.service.js";

// GET /api/v1/users/me
const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/users/me
const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(
      req.user.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/users/me/password
const changePassword = async (req, res, next) => {
  try {
    const result = await userService.changePassword(
      req.user.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/users/me/sessions
const getSessions = async (req, res, next) => {
  try {
    const sessions = await userService.getSessions(
      req.user.id,
      req.sessionId
    );

    return res.status(200).json({
      success: true,
      message: "Sessions retrieved successfully",
      data: {
        count: sessions.length,
        sessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/users/me/sessions/:sessionId
const revokeSession = async (req, res, next) => {
  try {
    const result = await userService.revokeSession(
      req.user.id,
      req.params.sessionId
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res) => {
  const data = await userService.getUsers(req.query);
  res.json({ success: true, data });
};

export {
  getUsers,
  getProfile,
  updateProfile,
  changePassword,
  getSessions,
  revokeSession,
};
