// src/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protected route middleware
 * - expects Authorization: "Bearer <accessToken>" header
 * - optionally accept token in cookies (req.cookies.accessToken) for some setups
 *
 * Responses:
 * - 401 Unauthorized: no token / invalid / expired
 * - 500 Internal Server Error: unexpected server error
 */
export const protectedRoute = async (req, res, next) => {
  try {
    // 1) Grab token: header preferred, fallback to cookies (optional) or query (only for dev/test)
    const authHeader = req.headers?.authorization || "";
    const headerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const cookieToken = req.cookies?.accessToken || req.cookies?.refreshToken || null; // if you store accessToken in cookie (optional)
    const queryToken = req.query?.accessToken || null; // only for debugging/demo; avoid in prod

    const token = headerToken || cookieToken || queryToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: missing access token" });
    }

    // 2) Verify token (synchronous throw on invalid/expired)
    let payload;
    try {
      payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      // payload expected shape: { userId: "...", iat: ..., exp: ... }
    } catch (jwtErr) {
      // token invalid or expired
      console.warn("[authMiddleware] token verification failed:", jwtErr.message);
      return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
    }

    // 3) Load user from DB (exclude sensitive fields)
    const userId = payload?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: invalid token payload" });
    }

    const user = await User.findById(userId).select("-hashedPassword -password -__v");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: user not found" });
    }

    // 4) attach user to request (plain object) and continue
    // Convert to plain object so downstream code can't mutate mongoose doc accidentally
    req.user = user.toObject ? user.toObject() : user;
    return next();
  } catch (error) {
    console.error("[authMiddleware] unexpected error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default protectedRoute;
