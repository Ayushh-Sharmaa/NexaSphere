import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOADS_DIR = path.join(__dirname, 'uploads');
try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (err) {
  console.warn('Failed to create uploads directory:', err.message);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Derive the extension from the validated mimetype, never the untrusted
    // filename, so an attacker can't store executable content as .html/.js/.svg.
    const ext = EXT_BY_MIME[file.mimetype] || '.bin';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const MAGIC_BYTES = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/gif': [[0x47, 0x49, 0x46]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
  'application/zip': [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
    [0x50, 0x4b, 0x07, 0x08],
  ],
  'application/x-zip-compressed': [[0x50, 0x4b, 0x03, 0x04]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4b, 0x03, 0x04],
  ],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    [0x50, 0x4b, 0x03, 0x04],
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4b, 0x03, 0x04]],
  'text/plain': [],
  'text/markdown': [],
  'application/json': [],
};

export function validateMagicBytes(filepath, mimeType) {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures || signatures.length === 0) return true;
  const fd = fs.openSync(filepath, 'r');
  const buffer = Buffer.alloc(8);
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);
  return signatures.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const fileFilter = (_req, file, cb) => {
  if (!file.originalname || file.originalname.includes('..') || file.originalname.includes('/')) {
    return cb(new Error('Invalid file name'), false);
  }
  const allowedMimes = Object.keys(MAGIC_BYTES);
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadWithMagicCheck = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (req.file && !validateMagicBytes(req.file.path, req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'File content does not match its declared type.' });
    }
    next();
  });
};
