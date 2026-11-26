
import * as authService from "../services/auth.service.js";
import * as sessionService from "../services/session.service.js";
import { accessTokenTtl, generateAccessToken } from "../utils/token.util.js";

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await authService.registerUser({
      name,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await authService.loginUser(req.body);

    const session = await sessionService.createSession(user, {
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });

    const accessToken = generateAccessToken(user, session.sessionId);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken,
        refreshToken: session.refreshToken,
        tokenType: "Bearer",
        expiresIn: accessTokenTtl(),
      },
    });
  } catch (error) {
    next(error);
  }
};



const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authenticated user retrieved successfully",
    data: {
      user: req.user,
    },
  });
};



const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const tokens = await sessionService.refreshSession(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};


const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    const result = await sessionService.logoutSession(refreshToken);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    const result = await sessionService.logoutAllSessions(req.user.id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};



export {
  register,
  login,
  getMe,
  refresh,
  logout,
  logoutAll,
};
