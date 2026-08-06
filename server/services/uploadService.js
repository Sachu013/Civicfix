const cloudinary = require('../config/cloudinary');
const ErrorResponse = require('../utils/errorResponse');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

/**
 * Validates image file type, MIME type, and size constraints.
 * @param {Object} file - Express/Multer file object
 */
const validateImageFile = (file) => {
    if (!file) {
        throw new ErrorResponse('No image file provided for validation.', 400);
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype?.toLowerCase())) {
        throw new ErrorResponse(
            `Invalid file format '${file.mimetype}'. Only JPG, JPEG, PNG, and WEBP image files are allowed.`,
            400
        );
    }

    // Check file extension
    const extension = file.originalname ? file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase() : '';
    if (extension && !ALLOWED_EXTENSIONS.includes(extension)) {
        throw new ErrorResponse(
            `Invalid file extension '${extension}'. Only .jpg, .jpeg, .png, and .webp files are supported.`,
            400
        );
    }

    // Check file size limit (5 MB)
    if (file.size > MAX_FILE_SIZE) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        throw new ErrorResponse(
            `File size (${sizeInMB} MB) exceeds maximum allowed limit of 5 MB.`,
            400
        );
    }

    return true;
};

/**
 * Uploads an image buffer directly to Cloudinary using centralized configuration.
 * Applies quality and format optimizations.
 * @param {Object} file - Express/Multer file object containing buffer
 * @param {Object} customOptions - Additional Cloudinary upload parameters
 * @returns {Promise<Object>} Structured Cloudinary image metadata
 */
const uploadImage = async (file, customOptions = {}) => {
    validateImageFile(file);

    // If Cloudinary credentials are not configured or set to placeholder in local dev, provide clean fallback metadata
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloudinary_cloud_name') {
        const fakePublicId = `civicfix_mock_${Date.now()}`;
        return {
            url: `https://res.cloudinary.com/demo/image/upload/v1234567890/${fakePublicId}.jpg`,
            publicId: fakePublicId,
            originalFilename: file.originalname || 'evidence.jpg',
            mimeType: file.mimetype || 'image/jpeg',
            fileSize: file.size || 102400,
            uploadedAt: new Date()
        };
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'civicfix_complaints',
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' } // Image optimization
                ],
                ...customOptions,
            },
            (error, result) => {
                if (error) {
                    return reject(new ErrorResponse(`Cloudinary Upload Failure: ${error.message}`, 500));
                }

                // Return structured image metadata object
                const metadata = {
                    url: result.secure_url,
                    publicId: result.public_id,
                    originalFilename: file.originalname || result.original_filename || 'uploaded_image',
                    mimeType: file.mimetype || `image/${result.format}`,
                    fileSize: file.size || result.bytes,
                    uploadedAt: new Date(result.created_at || Date.now()),
                };

                resolve(metadata);
            }
        );

        uploadStream.end(file.buffer);
    });
};

/**
 * Deletes an image from Cloudinary by its public ID.
 * @param {string} publicId - Cloudinary public ID of the asset to delete
 */
const deleteImage = async (publicId) => {
    if (!publicId) return null;

    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloudinary_cloud_name') {
        return { result: 'ok_mock' };
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new ErrorResponse(`Cloudinary Deletion Failure: ${error.message}`, 500);
    }
};

/**
 * Replaces an existing image on Cloudinary with a new file.
 * Deletes the old image and uploads the new file.
 * @param {string} oldPublicId - Existing Cloudinary public ID
 * @param {Object} newFile - New file to upload
 * @returns {Promise<Object>} New image metadata
 */
const replaceImage = async (oldPublicId, newFile) => {
    if (oldPublicId) {
        await deleteImage(oldPublicId);
    }
    return await uploadImage(newFile);
};

/**
 * Documented Placeholder Hook for Future AI Features.
 * Extensible for AI duplicate detection, image classification, OCR, embeddings, and severity prediction.
 * DO NOT IMPLEMENT AI LOGIC IN THIS SPRINT.
 * @param {Object} imageMetadata - Structured image metadata
 */
const preprocessImageForAI = async (imageMetadata) => {
    // Extension point: Future AI preprocessing, embeddings generation, and classification trigger
    return {
        preprocessed: true,
        imageMetadata,
        aiHooksReady: true,
    };
};

module.exports = {
    validateImageFile,
    uploadImage,
    deleteImage,
    replaceImage,
    preprocessImageForAI,
};
