
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        error: "Authentication required. Provide a Bearer token.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        error: "Authentication is not configured on the server",
      });
    }

    const payload = jwt.verify(token, secret);

    if (typeof payload.userId !== "string") {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        error: "The account associated with this token no longer exists",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: "Invalid or expired authentication token",
      });
    }

    next(error);
  }
};
