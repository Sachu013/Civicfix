/**
 * Centralized Category -> Department Routing Configuration & Initial Department Definitions
 * Maps all 20 main taxonomy categories from complaintCategories.js to stable department codes.
 */

const DEFAULT_DEPARTMENTS = [
    {
        name: "Roads & Transportation Department",
        code: "ROADS",
        description: "Manages road repairs, pothole fixing, street paving, bridges, and traffic signals.",
        categories: ["roads_transportation"],
        active: true,
        contactInformation: { email: "roads@smartcity.gov", phone: "+91 11 2345 6701", officeLocation: "Sector 4 Civic Center" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Street Lighting & Electrical Department",
        code: "ELECTRICAL",
        description: "Responsible for streetlights, high-voltage lines, electrical poles, and transformers.",
        categories: ["street_lighting_electrical"],
        active: true,
        contactInformation: { email: "electrical@smartcity.gov", phone: "+91 11 2345 6702", officeLocation: "Power House Complex" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Waste Management Department",
        code: "WASTE",
        description: "Manages solid waste collection, garbage bins, illegal dumping, and recycling.",
        categories: ["waste_management"],
        active: true,
        contactInformation: { email: "waste@smartcity.gov", phone: "+91 11 2345 6703", officeLocation: "Sanitation Depot 1" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Water Supply Department",
        code: "WATER",
        description: "Manages drinking water supply pipelines, water quality, hydrants, and leaks.",
        categories: ["water_supply"],
        active: true,
        contactInformation: { email: "water@smartcity.gov", phone: "+91 11 2345 6704", officeLocation: "Jal Bhavan" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Drainage & Flooding Control",
        code: "DRAINAGE",
        description: "Handles storm drains, rainwater harvesting, waterlogging, and flood prevention.",
        categories: ["drainage_flooding"],
        active: true,
        contactInformation: { email: "drainage@smartcity.gov", phone: "+91 11 2345 6705", officeLocation: "Flood Control Cell" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Sewage & Sanitation Department",
        code: "SANITATION",
        description: "Responsible for underground sewerage, septic tanks, manhole covers, and public toilets.",
        categories: ["sewage_sanitation"],
        active: true,
        contactInformation: { email: "sanitation@smartcity.gov", phone: "+91 11 2345 6706", officeLocation: "Sewerage Board" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Parks & Public Spaces Department",
        code: "PUBLIC_SPACES",
        description: "Maintains public parks, benches, playgrounds, fountains, and recreational centers.",
        categories: ["parks_public_spaces"],
        active: true,
        contactInformation: { email: "parks@smartcity.gov", phone: "+91 11 2345 6707", officeLocation: "Horticulture Division" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Public Infrastructure Department",
        code: "INFRASTRUCTURE",
        description: "Oversees public buildings, bus stops, footbridges, and civic monuments.",
        categories: ["public_buildings_infrastructure"],
        active: true,
        contactInformation: { email: "infrastructure@smartcity.gov", phone: "+91 11 2345 6708", officeLocation: "Public Works Wing B" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Traffic & Road Safety Department",
        code: "TRAFFIC",
        description: "Handles traffic signage, speed bumps, zebra crossings, and parking management.",
        categories: ["traffic_road_safety"],
        active: true,
        contactInformation: { email: "traffic@smartcity.gov", phone: "+91 11 2345 6709", officeLocation: "Traffic Control Room" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Animal Control & Public Safety",
        code: "ANIMAL_CONTROL",
        description: "Responds to stray animals, rabies vaccination drives, pest control, and animal safety.",
        categories: ["animals_public_safety"],
        active: true,
        contactInformation: { email: "animalcontrol@smartcity.gov", phone: "+91 11 2345 6710", officeLocation: "Veterinary Cell" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Environment & Urban Forestry",
        code: "ENVIRONMENT",
        description: "Handles tree trimming, fallen branches, air quality monitoring, and green initiatives.",
        categories: ["trees_environment"],
        active: true,
        contactInformation: { email: "environment@smartcity.gov", phone: "+91 11 2345 6711", officeLocation: "Forest Department Wing" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Public Cleanliness Department",
        code: "CLEANLINESS",
        description: "Manages street sweeping, litter removal, wall de-facing, and market cleaning.",
        categories: ["public_cleanliness"],
        active: true,
        contactInformation: { email: "cleanliness@smartcity.gov", phone: "+91 11 2345 6712", officeLocation: "Swachh Cell" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Public Works Department",
        code: "PUBLIC_WORKS",
        description: "Oversees construction sites, civic engineering works, and structural maintenance.",
        categories: ["construction_public_works"],
        active: true,
        contactInformation: { email: "pwd@smartcity.gov", phone: "+91 11 2345 6713", officeLocation: "PWD HQ" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Public Utilities & Communication",
        code: "UTILITIES",
        description: "Handles telecom cables, gas pipelines, internet ducting, and utility trenches.",
        categories: ["public_utilities_communication"],
        active: true,
        contactInformation: { email: "utilities@smartcity.gov", phone: "+91 11 2345 6714", officeLocation: "Utility Board" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Public Safety & Emergency Hazards",
        code: "PUBLIC_SAFETY",
        description: "Responds to immediate hazards, dangerous structures, chemical spills, and safety risks.",
        categories: ["public_safety_hazards"],
        active: true,
        contactInformation: { email: "safety@smartcity.gov", phone: "+91 11 2345 6715", officeLocation: "Disaster Control Room" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Municipal Housing & Property",
        code: "HOUSING",
        description: "Handles municipal quarters, property tax issues, illegal encroachments, and building permits.",
        categories: ["housing_property"],
        active: true,
        contactInformation: { email: "housing@smartcity.gov", phone: "+91 11 2345 6716", officeLocation: "Housing Board" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Public Services & Administration",
        code: "PUBLIC_SERVICES",
        description: "Manages birth/death certificates, citizen service centers, and municipal records.",
        categories: ["public_services_administration"],
        active: true,
        contactInformation: { email: "services@smartcity.gov", phone: "+91 11 2345 6717", officeLocation: "Citizen Facilitation Center" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Accessibility & Social Welfare",
        code: "ACCESSIBILITY",
        description: "Handles ramps, tactile pavings, accessible public facilities, and disability assistance.",
        categories: ["accessibility"],
        active: true,
        contactInformation: { email: "accessibility@smartcity.gov", phone: "+91 11 2345 6718", officeLocation: "Social Welfare Wing" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "Public Health Department",
        code: "PUBLIC_HEALTH",
        description: "Handles mosquito breeding prevention, disease control, food hygiene, and health hazards.",
        categories: ["health_sanitation_hazards"],
        active: true,
        contactInformation: { email: "health@smartcity.gov", phone: "+91 11 2345 6719", officeLocation: "Chief Medical Officer HQ" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    },
    {
        name: "General Administration",
        code: "GENERAL",
        description: "Fallback department for unclassified civic complaints and general inquiries.",
        categories: ["other_civic_issues"],
        active: true,
        contactInformation: { email: "general@smartcity.gov", phone: "+91 11 2345 6700", officeLocation: "Municipal Commissioner Office" },
        slaConfig: { critical: 24, high: 72, medium: 168, low: 336 }
    }
];

// Direct map from main category ID to department code
const CATEGORY_TO_DEPARTMENT_CODE = {
    'roads_transportation': 'ROADS',
    'street_lighting_electrical': 'ELECTRICAL',
    'waste_management': 'WASTE',
    'water_supply': 'WATER',
    'drainage_flooding': 'DRAINAGE',
    'sewage_sanitation': 'SANITATION',
    'parks_public_spaces': 'PUBLIC_SPACES',
    'public_buildings_infrastructure': 'INFRASTRUCTURE',
    'traffic_road_safety': 'TRAFFIC',
    'animals_public_safety': 'ANIMAL_CONTROL',
    'trees_environment': 'ENVIRONMENT',
    'public_cleanliness': 'CLEANLINESS',
    'construction_public_works': 'PUBLIC_WORKS',
    'public_utilities_communication': 'UTILITIES',
    'public_safety_hazards': 'PUBLIC_SAFETY',
    'housing_property': 'HOUSING',
    'public_services_administration': 'PUBLIC_SERVICES',
    'accessibility': 'ACCESSIBILITY',
    'health_sanitation_hazards': 'PUBLIC_HEALTH',
    'other_civic_issues': 'GENERAL',
};

// Legacy category string mapping to department code
const LEGACY_CATEGORY_TO_DEPARTMENT_CODE = {
    'Road Damage': 'ROADS',
    'Garbage': 'WASTE',
    'Water Leakage': 'WATER',
    'Street Light': 'ELECTRICAL',
    'Electricity': 'ELECTRICAL',
    'Other': 'GENERAL',
};

module.exports = {
    DEFAULT_DEPARTMENTS,
    CATEGORY_TO_DEPARTMENT_CODE,
    LEGACY_CATEGORY_TO_DEPARTMENT_CODE,
};
