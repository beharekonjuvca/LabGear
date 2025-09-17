import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const ITEM_DIR = path.join(UPLOAD_ROOT, "items");
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT);
if (!fs.existsSync(ITEM_DIR)) fs.mkdirSync(ITEM_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ITEM_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `item-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const ok = /image\/(png|jpe?g|webp|gif|bmp|svg\+xml)/i.test(file.mimetype);
  if (!ok) return cb(new Error("Only image files are allowed"));
  cb(null, true);
};

export const uploadItemImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");
