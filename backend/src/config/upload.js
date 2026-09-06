const path = require('path');
const multer = require('multer');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir(path.join(UPLOAD_DIR, 'audio'));
ensureDir(path.join(UPLOAD_DIR, 'images'));
ensureDir(path.join(UPLOAD_DIR, 'docs'));

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dirs = {
      audio: path.join(UPLOAD_DIR, 'audio'),
      image: path.join(UPLOAD_DIR, 'images'),
      document: path.join(UPLOAD_DIR, 'docs'),
    };
    cb(null, dirs[file.fieldname] || dirs.document);
  },
  filename(req, file, cb) {
    const safe = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-')
      .replace(/-+/g, '-');
    const ext = path.extname(safe) || path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|webp|gif|avif/;
  const audioTypes = /mp3|wav|ogg|m4a|aac|flac|opus/;
  const docTypes = /jpeg|jpg|png|webp|pdf/;

  const name = file.fieldname;
  const isOk =
    (name === 'audio' && audioTypes.test(path.extname(file.originalname).toLowerCase())) ||
    ((name === 'albumArt' || name === 'background' || name === 'photo') &&
      imageTypes.test(path.extname(file.originalname).toLowerCase())) ||
    ((name === 'selfPhotoDoc' || name === 'nationalIdDoc') &&
      docTypes.test(path.extname(file.originalname).toLowerCase()));

  cb(isOk ? null : new Error(`Unsupported file type for field "${name}".`), isOk);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

module.exports = upload;
module.exports.upload = upload;
module.exports.UPLOAD_DIR = UPLOAD_DIR;