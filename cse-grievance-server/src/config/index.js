import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/cse_grievance",
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  institutionalDomains: (process.env.INSTITUTIONAL_DOMAINS || "ruet.ac.bd")
    .split(",")
    .map((d) => d.trim()),
  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10),
    uploadDir: process.env.UPLOAD_DIR || "./uploads",
  },
  email: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "CSE Grievance System <no-reply@cse.ruet.ac.bd>",
  },
  captcha: {
    // Math captcha. When disabled, login/register still accept the fields but
    // do NOT enforce them (nice for local dev and test scripts).
    enabled: process.env.CAPTCHA_ENABLED !== "false",
  },
  system: {
    maxEvidenceSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10),
  },
};
