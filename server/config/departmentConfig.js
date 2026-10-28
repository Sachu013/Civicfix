/**
 * Centralized Department Configuration & Taxonomy Routing
 * Authoritative Single Source of Truth for the 6 Operational Departments, Category Mappings & Scope.
 */

const DEFAULT_DEPARTMENTS = [
    {
        name: "Roads & Infrastructure",
        code: "ROADS",
        description: "Manages road repairs, pothole fixing, sidewalk damage, road obstructions, traffic signs, and pedestrian crossings.",
        responsibilities: [
            "Potholes",
            "Road damage",
            "Sidewalk damage",
            "Road obstruction",
            "Traffic signals & signs",
            "Footpaths & bridges"
        ],
        categories: ["roads_infrastructure"],
        subcategories: [
            "pothole", "road_damage", "broken_pavement", "road_crack", "road_obstruction",
            "damaged_bridge", "damaged_footpath", "damaged_sidewalk", "missing_road_sign",
            "traffic_signal_issue", "illegal_parking"
        ],
        headRole: "department_head",
        verifierRole: "verifier",
        active: true,
        contactInformation: { email: "roads_head@smartcity.gov", phone: "+91 11 2345 6701", officeLocation: "Sector 4 Civic Center", headName: "Roads Department Head" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Water Supply",
        code: "WATER",
        description: "Manages water leakage, broken pipelines, water supply problems, water pressure, contamination, and water distribution infrastructure.",
        responsibilities: [
            "Water leakage",
            "Broken pipelines",
            "Water supply problems",
            "Water pressure issues",
            "Contaminated water supply",
            "Water infrastructure maintenance"
        ],
        categories: ["water_supply"],
        subcategories: [
            "water_leakage", "broken_water_pipe", "no_water_supply", "low_water_pressure",
            "contaminated_water", "water_wastage", "damaged_water_infrastructure"
        ],
        headRole: "department_head",
        verifierRole: "verifier",
        active: true,
        contactInformation: { email: "water_head@smartcity.gov", phone: "+91 11 2345 6704", officeLocation: "Jal Bhavan", headName: "Water Supply Head" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Drainage & Sewerage",
        code: "SANITATION",
        description: "Manages drainage blockages, stormwater runoff, flooding, sewage leaks, sewage overflows, open sewage lines, and manholes.",
        responsibilities: [
            "Drainage blockage",
            "Urban flooding & stormwater",
            "Sewage leakage & spills",
            "Sewage overflow",
            "Open sewage lines",
            "Manhole maintenance"
        ],
        categories: ["drainage_sewerage"],
        subcategories: [
            "blocked_drain", "drain_overflow", "waterlogging", "urban_flooding", "damaged_drain",
            "stormwater_issue", "sewage_leakage", "sewage_overflow", "open_sewage", "manhole_issue", "damaged_manhole"
        ],
        headRole: "department_head",
        verifierRole: "verifier",
        active: true,
        contactInformation: { email: "sanitation_head@smartcity.gov", phone: "+91 11 2345 6705", officeLocation: "Drainage Control Office", headName: "Drainage & Sewerage Head" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Waste Management & Sanitation",
        code: "WASTE",
        description: "Manages garbage dumping, overflowing bins, waste collection, street sweeping, littering, and illegal solid waste dumping.",
        responsibilities: [
            "Garbage dumping",
            "Overflowing garbage bins",
            "Waste collection",
            "Street sweeping & littering",
            "Illegal waste dumping"
        ],
        categories: ["waste_management_sanitation"],
        subcategories: [
            "garbage_dumping", "overflowing_garbage_bin", "missed_garbage_collection", "illegal_dumping",
            "plastic_waste", "construction_waste", "household_waste", "street_sweeping", "public_toilet_sanitation"
        ],
        headRole: "department_head",
        verifierRole: "verifier",
        active: true,
        contactInformation: { email: "waste_head@smartcity.gov", phone: "+91 11 2345 6703", officeLocation: "Sanitation Depot 1", headName: "Waste Management Head" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Streetlights & Electricity",
        code: "ELECTRICAL",
        description: "Responsible for streetlights, broken electrical infrastructure, exposed electrical wires, damaged poles, telecom cables, and unlit public areas.",
        responsibilities: [
            "Streetlights",
            "Broken electrical infrastructure",
            "Exposed electrical wires",
            "Damaged electrical poles",
            "Dark/unlit public areas",
            "Telecom cables & utility trenches"
        ],
        categories: ["streetlights_electricity"],
        subcategories: [
            "streetlight_not_working", "damaged_streetlight", "damaged_electrical_pole", "exposed_wiring",
            "electrical_hazard", "power_infrastructure_damage", "telecom_cable_issue"
        ],
        headRole: "department_head",
        verifierRole: "verifier",
        active: true,
        contactInformation: { email: "electrical_head@smartcity.gov", phone: "+91 11 2345 6702", officeLocation: "Power House Complex", headName: "Electrical Dept Head" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Public Safety & Other Civic Hazards",
        code: "PUBLIC_WORKS",
        description: "Oversees damaged public buildings, dangerous structures, fallen trees, stray animal hazards, accessibility, and general civic safety risks.",
        responsibilities: [
            "Damaged public buildings & shelters",
            "Dangerous structures & public safety hazards",
            "Fallen trees & dangerous branches",
            "Stray animal hazards",
            "Accessibility ramps",
            "General public safety & civic hazards"
        ],
        categories: ["public_safety_other_civic_hazards"],
        subcategories: [
            "damaged_public_building", "dangerous_structure", "fallen_tree", "dangerous_branch",
            "damaged_park_equipment", "stray_animal_hazard", "accessibility_ramp_issue", "public_safety_hazard"
        ],
        headRole: "department_head",
        verifierRole: "verifier",
        active: true,
        contactInformation: { email: "publicworks_head@smartcity.gov", phone: "+91 11 2345 6708", officeLocation: "Public Works HQ", headName: "Public Safety Head" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    }
];

// Direct map from main category ID to one of the 6 operational department codes
const CATEGORY_TO_DEPARTMENT_CODE = {
    'roads_infrastructure': 'ROADS',
    'Roads & Infrastructure': 'ROADS',
    'water_supply': 'WATER',
    'Water Supply': 'WATER',
    'drainage_sewerage': 'SANITATION',
    'Drainage & Sewerage': 'SANITATION',
    'waste_management_sanitation': 'WASTE',
    'Waste Management & Sanitation': 'WASTE',
    'streetlights_electricity': 'ELECTRICAL',
    'Streetlights & Electricity': 'ELECTRICAL',
    'public_safety_other_civic_hazards': 'PUBLIC_WORKS',
    'Public Safety & Other Civic Hazards': 'PUBLIC_WORKS',
};

// Legacy category/department string mapping to the 6 operational department codes
const LEGACY_CATEGORY_TO_DEPARTMENT_CODE = {
    'Road Damage': 'ROADS',
    'Roads & Transportation': 'ROADS',
    'Roads & Infrastructure': 'ROADS',
    'Roads & Footpaths': 'ROADS',
    'roads_transportation': 'ROADS',
    'roads_infrastructure': 'ROADS',
    'Pothole': 'ROADS',
    'Potholes': 'ROADS',
    'ROADS': 'ROADS',
    'TRAFFIC': 'ROADS',

    'Water Leakage': 'WATER',
    'Water Supply': 'WATER',
    'water_supply': 'WATER',
    'WATER': 'WATER',
    'WATER_DRAINAGE': 'WATER',

    'Garbage': 'WASTE',
    'Waste Management': 'WASTE',
    'Waste Management & Sanitation': 'WASTE',
    'waste_management': 'WASTE',
    'waste_management_sanitation': 'WASTE',
    'Public Cleanliness': 'WASTE',
    'public_cleanliness': 'WASTE',
    'WASTE': 'WASTE',
    'WASTE_SANITATION': 'WASTE',
    'CLEANLINESS': 'WASTE',

    'Drainage & Flooding': 'SANITATION',
    'Drainage & Sewerage': 'SANITATION',
    'drainage_flooding': 'SANITATION',
    'drainage_sewerage': 'SANITATION',
    'Sewage & Sanitation': 'SANITATION',
    'sewage_sanitation': 'SANITATION',
    'DRAINAGE': 'SANITATION',
    'SANITATION': 'SANITATION',
    'SEWAGE': 'SANITATION',

    'Street Light': 'ELECTRICAL',
    'Electricity': 'ELECTRICAL',
    'Street Lighting & Electrical': 'ELECTRICAL',
    'Streetlights & Electricity': 'ELECTRICAL',
    'street_lighting_electrical': 'ELECTRICAL',
    'streetlights_electricity': 'ELECTRICAL',
    'ELECTRICAL': 'ELECTRICAL',
    'UTILITIES': 'ELECTRICAL',

    'Parks & Public Spaces': 'PUBLIC_WORKS',
    'parks_public_spaces': 'PUBLIC_WORKS',
    'Environment & Urban Forestry': 'PUBLIC_WORKS',
    'Parks & Environment': 'PUBLIC_WORKS',
    'PARKS_ENVIRONMENT': 'PUBLIC_WORKS',
    'PUBLIC_SPACES': 'PUBLIC_WORKS',
    'ENVIRONMENT': 'PUBLIC_WORKS',

    'Public Infrastructure': 'PUBLIC_WORKS',
    'public_buildings_infrastructure': 'PUBLIC_WORKS',
    'Public Safety & Emergency Hazards': 'PUBLIC_WORKS',
    'Public Infrastructure & Safety': 'PUBLIC_WORKS',
    'Public Works & Infrastructure': 'PUBLIC_WORKS',
    'Public Safety & Other Civic Hazards': 'PUBLIC_WORKS',
    'public_safety_other_civic_hazards': 'PUBLIC_WORKS',
    'INFRASTRUCTURE': 'PUBLIC_WORKS',
    'INFRASTRUCTURE_SAFETY': 'PUBLIC_WORKS',
    'PUBLIC_SAFETY': 'PUBLIC_WORKS',
    'ANIMAL_CONTROL': 'PUBLIC_WORKS',
    'PUBLIC_WORKS': 'PUBLIC_WORKS',
    'HOUSING': 'PUBLIC_WORKS',
    'PUBLIC_SERVICES': 'PUBLIC_WORKS',
    'ACCESSIBILITY': 'PUBLIC_WORKS',
    'PUBLIC_HEALTH': 'PUBLIC_WORKS',
    'GENERAL': 'PUBLIC_WORKS',
    'Other': 'PUBLIC_WORKS',
    'other_civic_issues': 'PUBLIC_WORKS',
};

/**
 * Normalizes any legacy or arbitrary department code to one of the 6 active department codes.
 */
const normalizeDepartmentCode = (code) => {
    if (!code) return 'PUBLIC_WORKS';
    const upper = code.toString().trim().toUpperCase();
    if (DEFAULT_DEPARTMENTS.some(d => d.code === upper)) {
        return upper;
    }
    return LEGACY_CATEGORY_TO_DEPARTMENT_CODE[upper] || LEGACY_CATEGORY_TO_DEPARTMENT_CODE[code] || 'PUBLIC_WORKS';
};

module.exports = {
    DEFAULT_DEPARTMENTS,
    CATEGORY_TO_DEPARTMENT_CODE,
    LEGACY_CATEGORY_TO_DEPARTMENT_CODE,
    normalizeDepartmentCode,
};
