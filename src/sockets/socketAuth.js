const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Socket.io middleware to authenticate the JWT sent in the handshake.
 * Client should connect with:
 *   io("http://localhost:5000", { auth: { token: "Bearer <jwt>" } })
 */
const socketAuth = async (socket, next) => {
  try {
    const raw =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    if (!raw) {
      return next(new Error("Authentication error: No token provided"));
    }

    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    // Attach user to socket for later use
    socket.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch (err) {
    next(new Error("Authentication error: " + err.message));
  }
};

module.exports = socketAuth;