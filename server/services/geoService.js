/**
 * Service responsible for geospatial calculations, coordinate validation,
 * location formatting, and future reverse geocoding integration.
 */

/**
 * Validates if latitude and longitude are valid numeric geographic coordinates.
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @param {number} longitude - Longitude in degrees (-180 to 180)
 * @returns {boolean} True if coordinates are valid, false otherwise.
 */
const validateCoordinates = (latitude, longitude) => {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
        return false;
    }
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
        return false;
    }

    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Future reverse geocoding stub integration.
 * Will connect to external provider (Google Maps API / OpenStreetMap Nominatim).
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<Object>} Formatted location components
 */
const reverseGeocode = async (latitude, longitude) => {
    if (!validateCoordinates(latitude, longitude)) {
        throw new Error('Invalid coordinates provided for reverse geocoding.');
    }

    // Modular placeholder for future reverse geocoding provider integration
    return {
        formattedAddress: `Lat: ${latitude}, Lng: ${longitude}`,
        locality: 'Unknown Locality',
        city: 'SmartCity',
        state: 'State',
        country: 'India',
    };
};

/**
 * Formats and normalizes incoming location data (string or object)
 * into standard geospatial attributes and GeoJSON Point representation.
 * @param {string|Object} input - Raw location input from request
 * @returns {Object} Structured geospatial location object
 */
const formatLocationData = (input) => {
    if (!input) {
        return {
            location: 'Location not specified',
            latitude: null,
            longitude: null,
            locationPoint: null,
            formattedAddress: '',
            landmark: '',
            locality: '',
            city: '',
            district: '',
            state: '',
            pincode: '',
            country: 'India',
        };
    }

    // Handle legacy string input
    if (typeof input === 'string') {
        const trimmed = input.trim();
        return {
            location: trimmed,
            latitude: null,
            longitude: null,
            locationPoint: null,
            formattedAddress: trimmed,
            landmark: '',
            locality: '',
            city: '',
            district: '',
            state: '',
            pincode: '',
            country: 'India',
        };
    }

    // Handle structured location object input
    const {
        location,
        latitude,
        longitude,
        formattedAddress,
        landmark = '',
        locality = '',
        city = '',
        district = '',
        state = '',
        pincode = '',
        country = 'India',
    } = input;

    const hasValidCoords = validateCoordinates(latitude, longitude);
    const latNum = hasValidCoords ? Number(latitude) : null;
    const lngNum = hasValidCoords ? Number(longitude) : null;

    const displayLocation = (
        location ||
        formattedAddress ||
        (locality ? `${locality}, ${city}` : city) ||
        (hasValidCoords ? `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}` : 'Specified Location')
    ).trim();

    return {
        location: displayLocation,
        latitude: latNum,
        longitude: lngNum,
        locationPoint: hasValidCoords
            ? {
                  type: 'Point',
                  coordinates: [lngNum, latNum], // GeoJSON standard: [longitude, latitude]
              }
            : null,
        formattedAddress: formattedAddress || displayLocation,
        landmark: landmark || '',
        locality: locality || '',
        city: city || '',
        district: district || '',
        state: state || '',
        pincode: pincode ? String(pincode) : '',
        country: country || 'India',
    };
};

module.exports = {
    validateCoordinates,
    formatLocationData,
    reverseGeocode,
};
