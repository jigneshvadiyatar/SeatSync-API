
import { verifyAccessToken } from "../utils/token.util.js";
import { User, UserSession } from "../models/index.js";

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
      });
    }

    const token = authorization.split(/\s+/)[1];
    const decoded = verifyAccessToken(token);

    // Step 1: Validate JWT payload
    if (!decoded.sub || !decoded.sid) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    // Step 2: Verify that the session exists and is active
    const session = await UserSession.findOne({
      where: {
        id: decoded.sid,
        user_id: decoded.sub,
        revoked_at: null,
      },
    });

    if (!session || new Date(session.expires_at) <= new Date()) {
      return res.status(401).json({
        success: false,
        message: "Session expired or revoked",
      });
    }

    // Step 3: Check the current user status in the database
    const user = await User.findByPk(decoded.sub, {
      attributes: ["id", "name", "email", "role", "is_active"],
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Account not found or inactive",
      });
    }

    // Step 4: Attach authenticated user and session to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.sessionId = session.id;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token has expired",
      });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    next(error);
  }
};

export {
  authenticate,
};
