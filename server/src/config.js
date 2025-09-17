import "dotenv/config";

export const config = {
  port: process.env.PORT || 4000,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwt: {
    secret: process.env.JWT_SECRET || "dev_access",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh",
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || "1800", 10), // 30m
    refreshExpiresIn: parseInt(
      process.env.JWT_REFRESH_EXPIRES_IN || "604800",
      10
    ), // 7d
  },
};
