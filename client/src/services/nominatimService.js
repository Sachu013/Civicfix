/**
 * OpenStreetMap Nominatim Geocoding & Reverse Geocoding Service
 * Implements high-precision geolocation sampling, reverse geocoding, and place search.
 */

const reverseCache = new Map();
const searchCache = new Map();

/**
 * High-Precision Device Geolocation Acquisition Helper.
 * Uses watchPosition over a sampling window to acquire the position with highest accuracy (lowest error radius in meters).
 * 
 * @param {Object} options
 * @param {number} options.maxWaitTimeMs - Max duration to wait for best accuracy (default 4000ms)
 * @param {number} options.desiredAccuracyMeters - Target accuracy in meters to stop sampling early (default 15m)
 * @returns {Promise<Object>} Object containing { latitude, longitude, accuracy }
 */
export const getAccurateCurrentPosition = (options = {}) => {
    const { maxWaitTimeMs = 4000, desiredAccuracyMeters = 15 } = options;

    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
            return;
        }

        let bestPosition = null;
        let watchId = null;
        let timerId = null;

        const cleanUp = () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
            if (timerId !== null) {
                clearTimeout(timerId);
                timerId = null;
            }
        };

        const handleSuccess = (pos) => {
            if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
                bestPosition = pos;
            }

            // If we reached desired high precision (e.g. within 15 meters), resolve immediately
            if (pos.coords.accuracy <= desiredAccuracyMeters) {
                cleanUp();
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: Math.round(pos.coords.accuracy),
                });
            }
        };

        const handleError = (err) => {
            // If watchPosition fails immediately and we have no samples yet, attempt single getCurrentPosition fallback
            if (!bestPosition) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        cleanUp();
                        resolve({
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            accuracy: Math.round(pos.coords.accuracy),
                        });
                    },
                    (fallbackErr) => {
                        cleanUp();
                        reject(fallbackErr);
                    },
                    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                );
            } else {
                cleanUp();
                resolve({
                    latitude: bestPosition.coords.latitude,
                    longitude: bestPosition.coords.longitude,
                    accuracy: Math.round(bestPosition.coords.accuracy),
                });
            }
        };

        // Start watching position with high accuracy
        watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: maxWaitTimeMs + 2000,
            maximumAge: 0,
        });

        // Set timer limit to return best sample acquired so far
        timerId = setTimeout(() => {
            cleanUp();
            if (bestPosition) {
                resolve({
                    latitude: bestPosition.coords.latitude,
                    longitude: bestPosition.coords.longitude,
                    accuracy: Math.round(bestPosition.coords.accuracy),
                });
            } else {
                reject(new Error('Location request timed out while acquiring precise coordinates.'));
            }
        }, maxWaitTimeMs);
    });
};

/**
 * Parses Nominatim address structure into CivicFix standardized location object.
 * @param {Object} addr - Nominatim address payload
 * @param {string} displayName - Full display name string
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} CivicFix location data structure
 */
const parseNominatimAddress = (addr = {}, displayName = '', lat = null, lng = null) => {
    const landmark =
        addr.amenity ||
        addr.building ||
        addr.house_number ||
        addr.road ||
        addr.historic ||
        addr.leisure ||
        addr.shop ||
        '';

    const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.quarter ||
        addr.subdistrict ||
        addr.hamlet ||
        '';

    const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        '';

    const district =
        addr.county ||
        addr.state_district ||
        addr.district ||
        '';

    const state = addr.state || '';
    const pincode = addr.postcode || '';
    const country = addr.country || 'India';

    let primaryLocation = '';
    if (landmark && locality) {
        primaryLocation = `${landmark}, ${locality}`;
    } else if (landmark) {
        primaryLocation = `${landmark}, ${city || state}`;
    } else if (locality) {
        primaryLocation = `${locality}, ${city || state}`;
    } else {
        primaryLocation = city || displayName;
    }

    return {
        location: primaryLocation,
        latitude: lat !== null ? Number(lat) : null,
        longitude: lng !== null ? Number(lng) : null,
        formattedAddress: displayName || primaryLocation,
        landmark,
        locality,
        city,
        district,
        state,
        pincode,
        country,
    };
};

/**
 * Reverse geocode coordinates to structured address attributes using OSM Nominatim at building/street level (zoom=18).
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Standardized location data
 */
export const reverseGeocode = async (lat, lng) => {
    if (lat === null || lat === undefined || lng === null || lng === undefined) return null;

    const roundLat = Number(lat).toFixed(6);
    const roundLng = Number(lng).toFixed(6);
    const cacheKey = `${roundLat},${roundLng}`;

    if (reverseCache.has(cacheKey)) {
        return reverseCache.get(cacheKey);
    }

    try {
        // Use zoom=18 to force high-detail street / house / building level reverse geocoding
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundLat}&lon=${roundLng}&addressdetails=1&zoom=18`,
            {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Reverse geocoding error: ${response.statusText}`);
        }

        const data = await response.json();
        const parsed = parseNominatimAddress(
            data.address,
            data.display_name,
            Number(roundLat),
            Number(roundLng)
        );

        reverseCache.set(cacheKey, parsed);
        return parsed;
    } catch (error) {
        console.error('Nominatim Reverse Geocode Exception:', error);
        return {
            location: `Lat: ${Number(lat).toFixed(5)}, Lng: ${Number(lng).toFixed(5)}`,
            latitude: Number(lat),
            longitude: Number(lng),
            formattedAddress: `Lat: ${Number(lat).toFixed(5)}, Lng: ${Number(lng).toFixed(5)}`,
            landmark: '',
            locality: '',
            city: '',
            district: '',
            state: '',
            pincode: '',
            country: 'India',
        };
    }
};

/**
 * Search locations using OSM Nominatim free-text query.
 * @param {string} query - Location, street name, city, landmark, or pincode
 * @returns {Promise<Array>} Array of parsed search location suggestions
 */
export const searchLocation = async (query) => {
    const trimmed = (query || '').trim();
    if (trimmed.length < 3) {
        return [];
    }

    if (searchCache.has(trimmed.toLowerCase())) {
        return searchCache.get(trimmed.toLowerCase());
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&addressdetails=1&limit=5`,
            {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Location search error: ${response.statusText}`);
        }

        const data = await response.json();
        const results = data.map((item) => ({
            id: item.place_id,
            displayName: item.display_name,
            lat: Number(item.lat),
            lng: Number(item.lon),
            parsedLocation: parseNominatimAddress(
                item.address,
                item.display_name,
                Number(item.lat),
                Number(item.lon)
            ),
        }));

        searchCache.set(trimmed.toLowerCase(), results);
        return results;
    } catch (error) {
        console.error('Nominatim Search Location Exception:', error);
        return [];
    }
};
