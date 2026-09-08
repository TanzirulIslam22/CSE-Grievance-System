import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "..", "..", config.upload.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "video/mp4",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error("File type not allowed");
      err.statusCode = 400;
      cb(err);
    }
  },
});

export { uploadDir, ALLOWED_MIME_TYPES };
