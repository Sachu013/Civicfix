const multer = require('multer');
const ErrorResponse = require('../utils/errorResponse');

// Memory storage keeps file buffers in memory for direct Cloudinary streaming
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype?.toLowerCase())) {
        cb(null, true);
    } else {
        cb(
            new ErrorResponse(
                `Unsupported file format '${file.mimetype}'. Only JPG, JPEG, PNG, and WEBP images are allowed.`,
                400
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max file size
    },
});

// Middleware for processing a single image upload from the 'image' form field
const uploadSingleImage = (req, res, next) => {
    const singleUpload = upload.single('image');

    singleUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new ErrorResponse('File size exceeds maximum allowed limit of 5 MB.', 400));
            }
            return next(new ErrorResponse(`Upload Error: ${err.message}`, 400));
        } else if (err) {
            return next(err);
        }
        next();
    });
};

module.exports = {
    uploadSingleImage,
};
