const cloudinary = require('cloudinary').v2;

/**
 * Centralized Cloudinary Configuration Module.
 * Initializes and exports a single reusable Cloudinary client instance.
 */
const configureCloudinary = () => {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    const missingVars = [];
    if (!CLOUDINARY_CLOUD_NAME) missingVars.push('CLOUDINARY_CLOUD_NAME');
    if (!CLOUDINARY_API_KEY) missingVars.push('CLOUDINARY_API_KEY');
    if (!CLOUDINARY_API_SECRET) missingVars.push('CLOUDINARY_API_SECRET');

    if (missingVars.length > 0) {
        console.warn(
            `[Cloudinary Config Warning] Missing environment variable(s): ${missingVars.join(', ')}. Cloudinary upload services may be limited.`
        );
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
    });

    return cloudinary;
};

const configuredCloudinary = configureCloudinary();

module.exports = configuredCloudinary;
