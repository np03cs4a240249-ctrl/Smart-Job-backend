const sanitizeString = (value) => {
  if (typeof value !== "string") return value;

  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^ >]+/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .replace(/[<>]/g, "")
    .trim();
};

const sanitizeObject = (obj = {}) => {
  const clean = {};

  for (const [key, value] of Object.entries(obj || {})) {
    if (typeof value === "string") {
      clean[key] = sanitizeString(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
};

const isStrongPassword = (password = "") => {
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(password));
};

const securityHeaders = (req, res, next) => {
  // Prevent browser MIME sniffing.
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Do NOT set X-Frame-Options or CSP frame-ancestors here.
  // The frontend runs on 127.0.0.1:5500 while the backend runs on localhost:5000.
  // Setting X-Frame-Options blocks PDF resumes inside iframe previews.

  // Keep safe privacy/security headers.
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  next();
};

const memoryRateLimit = ({ windowMs = 15 * 60 * 1000, max = 300 } = {}) => {
  const hits = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();

    const record = hits.get(key) || {
      count: 0,
      reset: now + windowMs,
    };

    if (now > record.reset) {
      record.count = 0;
      record.reset = now + windowMs;
    }

    record.count += 1;
    hits.set(key, record);

    if (record.count > max) {
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
      });
    }

    next();
  };
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  isStrongPassword,
  securityHeaders,
  memoryRateLimit,
};