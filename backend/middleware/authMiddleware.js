const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");

// Rate limiting for authenticated requests
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 100 authenticated requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if available, otherwise IP
    return req.user?.userId || req.ip;
  },
});

// Aggressive rate limiting for failed authentication attempts
const authFailureLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 failed auth attempts per hour
  message: {
    message: "Too many failed authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
});

// Token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

// Enhanced token verification middleware
const verifyToken = async (req, res, next) => {
  try {
    // Apply rate limiting
    await new Promise((resolve, reject) => {
      authRateLimiter(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Apply failure rate limiting
      await new Promise((resolve) => {
        authFailureLimiter(req, res, () => resolve());
      });
      return res.status(401).json({
        message: "Access token required",
        code: "TOKEN_MISSING",
      });
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      await new Promise((resolve) => {
        authFailureLimiter(req, res, () => resolve());
      });
      return res.status(401).json({
        message: "Token has been invalidated",
        code: "TOKEN_BLACKLISTED",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Additional token validation
    if (!decoded.userId || !decoded.email) {
      await new Promise((resolve) => {
        authFailureLimiter(req, res, () => resolve());
      });
      return res.status(401).json({
        message: "Invalid token structure",
        code: "TOKEN_INVALID",
      });
    }

    // Check if token is expired (additional check beyond JWT expiry)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      await new Promise((resolve) => {
        authFailureLimiter(req, res, () => resolve());
      });
      return res.status(401).json({
        message: "Token has expired",
        code: "TOKEN_EXPIRED",
      });
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId).select(
      "+isActive +lastPasswordChange +tokenVersion"
    );

    if (!user) {
      await new Promise((resolve) => {
        authFailureLimiter(req, res, () => resolve());
      });
      return res.status(401).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Check if user account is active
    if (user.isActive === false) {
      await new Promise((resolve) => {
        authFailureLimiter(req, res, () => resolve());
      });
      return res.status(403).json({
        message: "Account has been deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Check if password was changed after token was issued (invalidate old tokens)
    if (
      user.lastPasswordChange &&
      decoded.iat < Math.floor(user.lastPasswordChange.getTime() / 1000)
    ) {
      await new Promise((resolve) => {
        authFailureLimiter(req, res, () => resolve());
      });
      return res.status(401).json({
        message: "Token invalidated due to password change",
        code: "TOKEN_INVALIDATED_PASSWORD_CHANGE",
      });
    }

    // Check token version (for forced logout functionality)
    if (
      user.tokenVersion &&
      decoded.tokenVersion &&
      decoded.tokenVersion < user.tokenVersion
    ) {
      await new Promise((resolve) => {
        authFailureLimiter(req, res, () => resolve());
      });
      return res.status(401).json({
        message: "Token has been invalidated",
        code: "TOKEN_VERSION_MISMATCH",
      });
    }

    // Security headers and logging
    const clientIP =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get("User-Agent") || "Unknown";

    // Check for suspicious activity (optional - implement based on your needs)
    if (decoded.loginIP && decoded.loginIP !== clientIP) {
      console.warn(
        `⚠️ IP mismatch for user ${user.email}: Token IP: ${decoded.loginIP}, Request IP: ${clientIP}`
      );
      // You might want to require re-authentication or send an alert
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId, // ✅ This is the fix!
      userId: decoded.userId, // optional (backward compatibility)
      email: decoded.email,
      fullName: decoded.fullName,
      tokenIssuedAt: decoded.iat,
      loginIP: decoded.loginIP,
      currentIP: clientIP,
      userAgent: userAgent,
    };

    // Update user's last seen timestamp (optional)
    user.lastSeen = new Date();
    user.lastSeenIP = clientIP;
    await user.save();

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);

    // Apply failure rate limiting
    await new Promise((resolve) => {
      authFailureLimiter(req, res, () => resolve());
    });

    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token has expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
        code: "TOKEN_INVALID",
      });
    }

    if (error.name === "NotBeforeError") {
      return res.status(401).json({
        message: "Token not active yet",
        code: "TOKEN_NOT_ACTIVE",
      });
    }

    // Generic error
    res.status(401).json({
      message: "Authentication failed",
      code: "AUTH_FAILED",
    });
  }
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Continue without authentication
  }

  try {
    await verifyToken(req, res, next);
  } catch (error) {
    // Log error but continue
    console.warn("Optional auth failed:", error.message);
    next();
  }
};

// Middleware to check for specific roles/permissions
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        });
      }

      const user = await User.findById(req.user.userId).select(
        "role permissions"
      );

      if (!user) {
        return res.status(401).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      const userRoles = Array.isArray(user.role) ? user.role : [user.role];
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      const hasRole = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          message: "Insufficient permissions",
          code: "INSUFFICIENT_PERMISSIONS",
          required: requiredRoles,
          current: userRoles,
        });
      }

      req.user.roles = userRoles;
      req.user.permissions = user.permissions || [];
      next();
    } catch (error) {
      console.error("Role verification error:", error);
      res.status(500).json({
        message: "Authorization check failed",
        code: "AUTH_CHECK_FAILED",
      });
    }
  };
};

// Middleware to blacklist a token (for logout)
const blacklistToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    tokenBlacklist.add(token);

    // In production, you'd want to store this in Redis with TTL
    // redis.setex(`blacklist:${token}`, decoded.exp - now, 'true');
  }

  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Strict transport security (if using HTTPS)
  if (req.secure || req.get("X-Forwarded-Proto") === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Remove server signature
  res.removeHeader("X-Powered-By");

  next();
};

// Clean up expired blacklisted tokens (run periodically)
const cleanupBlacklist = () => {
  // In production, this would be handled by Redis TTL
  // For in-memory implementation, you'd need to store token expiry times
  console.log("Cleaning up blacklisted tokens...");
};

module.exports = {
  verifyToken,
  optionalAuth,
  requireRole,
  blacklistToken,
  securityHeaders,
  authRateLimiter,
  authFailureLimiter,
  cleanupBlacklist,
};
