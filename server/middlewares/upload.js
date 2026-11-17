import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootUploadsDir = path.resolve(__dirname, "../../uploads");

export function generate18DigitId() {
  const timestamp = Date.now().toString(); // 13 digits
  const random5 = crypto.randomInt(10000, 100000).toString(); // 5 digits
  return `${timestamp}${random5}`; // exactly 18 digits
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const isOwner = req.user?.role === "owner" || req.query.folder === "owners" || req.body?.folder === "owners";
    const targetSubfolder = isOwner ? "owners" : "customers";
    const destPath = path.join(rootUploadsDir, targetSubfolder);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    req.uploadSubfolder = targetSubfolder;
    cb(null, destPath);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const unique18DigitName = `${generate18DigitId()}${ext}`;
    cb(null, unique18DigitName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter(_req, file, callback) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
        const error = new Error("Only JPEG, PNG, WebP, and GIF images are accepted");
        error.status = 400;
        return callback(error);
      }
      callback(null, true);
    },
  });

// Single image upload middleware
export const uploadImage = [
    (req, res, next) => {
      upload.fields([{ name: "image", maxCount: 1 }, { name: "file", maxCount: 1 }])(req, res, (err) => {
        if (err) return next(err);
        const file = req.files?.image?.[0] || req.files?.file?.[0] || req.file;
        if (!file) return res.status(400).json({ message: "Select an image to upload" });
        req.file = file;
        next();
      });
    },
      (req, res) => {
        const subfolder = req.uploadSubfolder || (req.user?.role === "owner" ? "owners" : "customers");
        const filename = req.file.filename;
        const url = `/uploads/${subfolder}/${filename}`;
        res.status(201).json({
          filename,
          url,
          folder: subfolder,
        });
      },
];

// Multiple images upload middleware (up to 5 images)
export const uploadImages = [
  (req, res, next) => {
    upload.fields([{ name: "images", maxCount: 5 }, { name: "files", maxCount: 5 }])(req, res, (err) => {
      if (err) return next(err);
      const files = req.files?.images || req.files?.files || [];
      if (!files.length) return res.status(400).json({ message: "Select at least one image to upload" });
      req.filesList = files;
      next();
    });
  },
  (req, res) => {
    const subfolder = req.uploadSubfolder || (req.user?.role === "owner" ? "owners" : "customers");
    const filenames = req.filesList.map((f) => f.filename);
    const urls = filenames.map((name) => `/uploads/${subfolder}/${name}`);
    res.status(201).json({
      filenames,
      urls,
      items: req.filesList.map((f) => ({
        filename: f.filename,
        url: `/uploads/${subfolder}/${f.filename}`,
      })),
      folder: subfolder,
    });
  },
];
