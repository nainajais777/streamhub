import multer from "multer";

export const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max, for now
});