const jwt = require("jsonwebtoken");
const redis = require("../config/redis");

const ONLINE_TTL_SECS = 10 * 60; // 10 minutes

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    // Non-blocking online heartbeat
    redis
      .set(`user:${payload.userId}:last_seen`, String(Date.now()), {
        EX: ONLINE_TTL_SECS,
      })
      .catch(() => {});
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
