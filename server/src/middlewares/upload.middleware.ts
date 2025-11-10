import multer from 'multer';
import path from 'path';
import { Request, RequestHandler } from 'express';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB per file
  }
});

export const uploadFields: RequestHandler = upload.fields([
  { name: 'tenantPhoto', maxCount: 1 },
  { name: 'aadharPhoto', maxCount: 1 },
  { name: 'familyPhoto', maxCount: 1 }
]);

export const validateTotalSize = (req: Request, res: any, next: any) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let totalSize = 0;
  if (files) {
    Object.values(files).forEach(fileArray => {
      fileArray.forEach(file => {
        totalSize += file.size;
      });
    });
  }
  if (totalSize > 6 * 1024 * 1024) { // 6MB total
    return res.status(400).json({ error: 'Total file size exceeds 6MB limit' });
  }
  next();
};
