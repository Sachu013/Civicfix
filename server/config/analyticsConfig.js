/**
 * Centralized Configuration for Civic Analytics, Hotspot Detection & Anomaly Engine
 */

module.exports = {
    // Hotspot Detection Parameters
    HOTSPOT_MIN_COMPLAINTS: 5,        // Minimum complaints required to classify a geographic cluster as a hotspot
    HOTSPOT_GRID_SIZE_KM: 1.5,        // Spatial cell dimension (in kilometers) for grid-based clustering
    HOTSPOT_RADIUS_METERS: 1500,      // Cluster radius for proximity grouping

    // Anomaly Detection Parameters
    ANOMALY_STD_DEV_THRESHOLD: 2.0,   // Number of standard deviations above baseline to flag an anomaly spike
    ANOMALY_BASELINE_DAYS: 30,        // Historical rolling baseline period (days)

    // Trend & Time Window Parameters
    DEFAULT_TREND_PERIOD_DAYS: 30,
    SLA_WARNING_PERCENT: 0.20,
};
