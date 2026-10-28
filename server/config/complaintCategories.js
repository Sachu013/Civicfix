/**
 * Centralized Civic Category Taxonomy - Six Canonical Categories Standard
 * Authoritative Single Source of Truth for the 6 Canonical Complaint Categories, Subcategories, Keywords, and Severities.
 */

const CATEGORIES = [
    {
        id: 'roads_infrastructure',
        displayName: 'Roads & Infrastructure',
        description: 'Issues involving roads, potholes, sidewalks, footpaths, bridges, and traffic signals',
        icon: '🛣️',
        subcategories: [
            { id: 'pothole', displayName: 'Pothole', keywords: ['pothole', 'crater', 'road hole', 'asphalt hole'], defaultSeverity: 'High' },
            { id: 'road_damage', displayName: 'Road Damage', keywords: ['road damage', 'broken road', 'caved road', 'asphalt damage'], defaultSeverity: 'Medium' },
            { id: 'broken_pavement', displayName: 'Broken Pavement', keywords: ['broken pavement', 'damaged pavement', 'cracked pavement'], defaultSeverity: 'Medium' },
            { id: 'road_crack', displayName: 'Road Crack', keywords: ['road crack', 'fissure', 'surface crack'], defaultSeverity: 'Low' },
            { id: 'road_obstruction', displayName: 'Road Obstruction', keywords: ['road obstruction', 'blocked road', 'boulder on road', 'road barrier'], defaultSeverity: 'High' },
            { id: 'damaged_bridge', displayName: 'Damaged Bridge', keywords: ['damaged bridge', 'broken flyover', 'bridge crack', 'overpass damage'], defaultSeverity: 'Critical' },
            { id: 'damaged_footpath', displayName: 'Damaged Footpath', keywords: ['damaged footpath', 'broken walkway', 'pedestrian path damage'], defaultSeverity: 'Medium' },
            { id: 'damaged_sidewalk', displayName: 'Damaged Sidewalk', keywords: ['damaged sidewalk', 'broken sidewalk', 'cracked walkway'], defaultSeverity: 'Medium' },
            { id: 'missing_road_sign', displayName: 'Missing Road Sign', keywords: ['missing road sign', 'no stop sign', 'missing direction sign'], defaultSeverity: 'Medium' },
            { id: 'traffic_signal_issue', displayName: 'Traffic Signal Issue', keywords: ['traffic signal issue', 'traffic light fault', 'signal timing issue'], defaultSeverity: 'High' },
            { id: 'illegal_parking', displayName: 'Illegal Parking', keywords: ['illegal parking', 'unauthorized parking', 'vehicle blocking'], defaultSeverity: 'Low' },
        ]
    },
    {
        id: 'water_supply',
        displayName: 'Water Supply',
        description: 'Clean water distribution, pipeline leaks, supply disruptions, and water contamination',
        icon: '💧',
        subcategories: [
            { id: 'water_leakage', displayName: 'Water Leakage', keywords: ['water leakage', 'water leak', 'pipeline leak', 'pipe leak', 'burst pipe', 'pipe burst', 'leaking pipeline', 'water gushing', 'water supply'], defaultSeverity: 'High' },
            { id: 'broken_water_pipe', displayName: 'Broken Water Pipe', keywords: ['broken water pipe', 'main pipe fracture', 'severed water line', 'broken pipe'], defaultSeverity: 'High' },
            { id: 'no_water_supply', displayName: 'No Water Supply', keywords: ['no water supply', 'water cut', 'dry taps', 'no water running', 'no water'], defaultSeverity: 'High' },
            { id: 'low_water_pressure', displayName: 'Low Water Pressure', keywords: ['low water pressure', 'weak water flow', 'trickling tap'], defaultSeverity: 'Low' },
            { id: 'contaminated_water', displayName: 'Contaminated Water', keywords: ['contaminated water', 'dirty water', 'smelly water', 'muddy tap water', 'toxic water'], defaultSeverity: 'Critical' },
            { id: 'water_wastage', displayName: 'Water Wastage', keywords: ['water wastage', 'overflowing tank', 'unattended valve'], defaultSeverity: 'Medium' },
            { id: 'damaged_water_infrastructure', displayName: 'Damaged Water Infrastructure', keywords: ['damaged pump', 'water meter broken', 'valve box damaged'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'drainage_sewerage',
        displayName: 'Drainage & Sewerage',
        description: 'Stormwater drains, surface waterlogging, urban flooding, sewage leaks, open sewers, and manholes',
        icon: '🌊',
        subcategories: [
            { id: 'blocked_drain', displayName: 'Blocked Drain', keywords: ['blocked drain', 'clogged drain', 'choked gutter', 'stuck drain'], defaultSeverity: 'Medium' },
            { id: 'drain_overflow', displayName: 'Drain Overflow', keywords: ['drain overflow', 'gutter spill', 'overflowing drain line'], defaultSeverity: 'High' },
            { id: 'waterlogging', displayName: 'Waterlogging', keywords: ['waterlogging', 'standing water on road', 'puddle accumulation', 'submerged street'], defaultSeverity: 'High' },
            { id: 'urban_flooding', displayName: 'Urban Flooding', keywords: ['urban flooding', 'flooded street', 'flooded neighborhood', 'inundation'], defaultSeverity: 'Critical' },
            { id: 'damaged_drain', displayName: 'Damaged Drain', keywords: ['damaged drain', 'broken gutter wall', 'collapsed drain channel'], defaultSeverity: 'Medium' },
            { id: 'stormwater_issue', displayName: 'Stormwater Issue', keywords: ['stormwater drain', 'rain drain blocked'], defaultSeverity: 'Medium' },
            { id: 'sewage_leakage', displayName: 'Sewage Leakage', keywords: ['sewage leakage', 'foul water leak', 'sewer leak', 'sewage smell'], defaultSeverity: 'High' },
            { id: 'sewage_overflow', displayName: 'Sewage Overflow', keywords: ['sewage overflow', 'gushing sewage', 'overflowing sewer line'], defaultSeverity: 'Critical' },
            { id: 'open_sewage', displayName: 'Open Sewage', keywords: ['open sewage', 'uncovered sewer', 'raw sewage stream'], defaultSeverity: 'Critical' },
            { id: 'manhole_issue', displayName: 'Manhole Issue', keywords: ['manhole issue', 'damaged manhole cover', 'loose manhole lid'], defaultSeverity: 'High' },
            { id: 'damaged_manhole', displayName: 'Damaged Manhole', keywords: ['open manhole', 'missing manhole cover', 'hole in road manhole'], defaultSeverity: 'Critical' },
        ]
    },
    {
        id: 'waste_management_sanitation',
        displayName: 'Waste Management & Sanitation',
        description: 'Solid waste, overflowing bins, uncollected trash, street sweeping, and illegal dumping',
        icon: '🗑️',
        subcategories: [
            { id: 'garbage_dumping', displayName: 'Garbage Dumping', keywords: ['garbage dumping', 'trash dump', 'rubbish pile', 'waste dump', 'garbage', 'trash', 'rubbish'], defaultSeverity: 'Medium' },
            { id: 'overflowing_garbage_bin', displayName: 'Overflowing Garbage Bin', keywords: ['overflowing bin', 'full trash can', 'waste spill', 'overflowing dumpster'], defaultSeverity: 'Medium' },
            { id: 'missed_garbage_collection', displayName: 'Missed Garbage Collection', keywords: ['missed collection', 'no trash pickup', 'garbage truck missed'], defaultSeverity: 'Medium' },
            { id: 'illegal_dumping', displayName: 'Illegal Dumping', keywords: ['illegal dumping', 'dumping site', 'unauthorized dump'], defaultSeverity: 'High' },
            { id: 'plastic_waste', displayName: 'Plastic Waste', keywords: ['plastic waste', 'plastic litter', 'polybag accumulation'], defaultSeverity: 'Low' },
            { id: 'construction_waste', displayName: 'Construction Waste', keywords: ['construction waste', 'debris pile', 'rubble dump', 'building debris'], defaultSeverity: 'Medium' },
            { id: 'household_waste', displayName: 'Household Waste', keywords: ['household waste', 'domestic trash', 'residential garbage'], defaultSeverity: 'Low' },
            { id: 'street_sweeping', displayName: 'Street Sweeping', keywords: ['street sweeping', 'littering', 'unclean street'], defaultSeverity: 'Low' },
            { id: 'public_toilet_sanitation', displayName: 'Public Toilet Sanitation', keywords: ['public toilet', 'dirty washroom', 'sanitation facility'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'streetlights_electricity',
        displayName: 'Streetlights & Electricity',
        description: 'Issues involving streetlights, power poles, transformers, dangling wires, and electrical hazards',
        icon: '💡',
        subcategories: [
            { id: 'streetlight_not_working', displayName: 'Streetlight Not Working', keywords: ['streetlight not working', 'street light', 'streetlight', 'lamp post', 'lamp out', 'dark street', 'light dead', 'unlit street', 'dark', 'light out'], defaultSeverity: 'Medium' },
            { id: 'damaged_streetlight', displayName: 'Damaged Streetlight', keywords: ['damaged streetlight', 'broken lamp post', 'shattered light bulb', 'broken street light'], defaultSeverity: 'Medium' },
            { id: 'damaged_electrical_pole', displayName: 'Damaged Electrical Pole', keywords: ['damaged pole', 'leaning electric pole', 'broken utility pole', 'electric pole'], defaultSeverity: 'High' },
            { id: 'exposed_wiring', displayName: 'Exposed Wiring', keywords: ['exposed wiring', 'dangling wire', 'open electrical cable', 'live wire', 'hanging wire'], defaultSeverity: 'Critical' },
            { id: 'electrical_hazard', displayName: 'Electrical Hazard', keywords: ['electrical hazard', 'sparking transformer', 'short circuit', 'electrical shock', 'sparking'], defaultSeverity: 'Critical' },
            { id: 'power_infrastructure_damage', displayName: 'Power Infrastructure Damage', keywords: ['power infrastructure', 'substation damage', 'power box open'], defaultSeverity: 'High' },
            { id: 'telecom_cable_issue', displayName: 'Telecom Cable Issue', keywords: ['telecom cable', 'dangling wire', 'utility trench'], defaultSeverity: 'Low' },
        ]
    },
    {
        id: 'public_safety_other_civic_hazards',
        displayName: 'Public Safety & Other Civic Hazards',
        description: 'Dangerous structures, public building damage, fallen trees, park hazards, stray animals, and civic safety risks',
        icon: '⚠️',
        subcategories: [
            { id: 'damaged_public_building', displayName: 'Damaged Public Building', keywords: ['damaged public building', 'municipal office structural damage'], defaultSeverity: 'Medium' },
            { id: 'dangerous_structure', displayName: 'Dangerous Structure', keywords: ['dangerous structure', 'collapsing wall', 'unsafe building'], defaultSeverity: 'Critical' },
            { id: 'fallen_tree', displayName: 'Fallen Tree', keywords: ['fallen tree', 'tree blocking road', 'collapsed tree'], defaultSeverity: 'High' },
            { id: 'dangerous_branch', displayName: 'Dangerous Branch', keywords: ['dangerous branch', 'hanging branch', 'branch about to fall'], defaultSeverity: 'High' },
            { id: 'damaged_park_equipment', displayName: 'Damaged Park Equipment', keywords: ['park equipment broken', 'broken bench', 'damaged playground'], defaultSeverity: 'Low' },
            { id: 'stray_animal_hazard', displayName: 'Stray Animal Hazard', keywords: ['stray dogs', 'stray cattle', 'aggressive animal', 'rabid dog'], defaultSeverity: 'High' },
            { id: 'accessibility_ramp_issue', displayName: 'Accessibility Ramp Issue', keywords: ['accessibility ramp', 'wheelchair ramp broken'], defaultSeverity: 'Medium' },
            { id: 'public_safety_hazard', displayName: 'Public Safety Hazard', keywords: ['public safety hazard', 'open trench', 'unfenced excavation', 'civic hazard'], defaultSeverity: 'High' },
        ]
    }
];

// Mapping for legacy categories to new 6 Canonical Category IDs & Display Names
const LEGACY_CATEGORY_MAP = {
    // Roads
    'roads_transportation': { id: 'roads_infrastructure', displayName: 'Roads & Infrastructure', defaultSubcategory: 'road_damage' },
    'Roads & Transportation': { id: 'roads_infrastructure', displayName: 'Roads & Infrastructure', defaultSubcategory: 'road_damage' },
    'Road Damage': { id: 'roads_infrastructure', displayName: 'Roads & Infrastructure', defaultSubcategory: 'road_damage' },
    'Pothole': { id: 'roads_infrastructure', displayName: 'Roads & Infrastructure', defaultSubcategory: 'pothole' },
    'Potholes': { id: 'roads_infrastructure', displayName: 'Roads & Infrastructure', defaultSubcategory: 'pothole' },
    'Roads & Footpaths': { id: 'roads_infrastructure', displayName: 'Roads & Infrastructure', defaultSubcategory: 'road_damage' },

    // Water
    'water_supply': { id: 'water_supply', displayName: 'Water Supply', defaultSubcategory: 'water_leakage' },
    'Water Supply': { id: 'water_supply', displayName: 'Water Supply', defaultSubcategory: 'water_leakage' },
    'Water Leakage': { id: 'water_supply', displayName: 'Water Supply', defaultSubcategory: 'water_leakage' },

    // Drainage & Sewerage
    'drainage_flooding': { id: 'drainage_sewerage', displayName: 'Drainage & Sewerage', defaultSubcategory: 'blocked_drain' },
    'Drainage & Flooding': { id: 'drainage_sewerage', displayName: 'Drainage & Sewerage', defaultSubcategory: 'blocked_drain' },
    'sewage_sanitation': { id: 'drainage_sewerage', displayName: 'Drainage & Sewerage', defaultSubcategory: 'sewage_leakage' },
    'Sewage & Sanitation': { id: 'drainage_sewerage', displayName: 'Drainage & Sewerage', defaultSubcategory: 'sewage_leakage' },

    // Waste Management & Sanitation
    'waste_management': { id: 'waste_management_sanitation', displayName: 'Waste Management & Sanitation', defaultSubcategory: 'garbage_dumping' },
    'Waste Management': { id: 'waste_management_sanitation', displayName: 'Waste Management & Sanitation', defaultSubcategory: 'garbage_dumping' },
    'Garbage': { id: 'waste_management_sanitation', displayName: 'Waste Management & Sanitation', defaultSubcategory: 'garbage_dumping' },
    'public_cleanliness': { id: 'waste_management_sanitation', displayName: 'Waste Management & Sanitation', defaultSubcategory: 'street_sweeping' },
    'Public Cleanliness': { id: 'waste_management_sanitation', displayName: 'Waste Management & Sanitation', defaultSubcategory: 'street_sweeping' },

    // Streetlights & Electricity
    'street_lighting_electrical': { id: 'streetlights_electricity', displayName: 'Streetlights & Electricity', defaultSubcategory: 'streetlight_not_working' },
    'Street Lighting & Electrical': { id: 'streetlights_electricity', displayName: 'Streetlights & Electricity', defaultSubcategory: 'streetlight_not_working' },
    'Street Light': { id: 'streetlights_electricity', displayName: 'Streetlights & Electricity', defaultSubcategory: 'streetlight_not_working' },
    'Electricity': { id: 'streetlights_electricity', displayName: 'Streetlights & Electricity', defaultSubcategory: 'electrical_hazard' },

    // Public Safety & Other Civic Hazards
    'parks_public_spaces': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'damaged_park_equipment' },
    'Parks & Public Spaces': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'damaged_park_equipment' },
    'public_buildings_infrastructure': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'damaged_public_building' },
    'Public Buildings & Infrastructure': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'damaged_public_building' },
    'traffic_road_safety': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'public_safety_hazard' },
    'Traffic & Road Safety': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'public_safety_hazard' },
    'animals_public_safety': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'stray_animal_hazard' },
    'Animals & Public Safety': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'stray_animal_hazard' },
    'trees_environment': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'fallen_tree' },
    'Trees & Environment': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'fallen_tree' },
    'other_civic_issues': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'public_safety_hazard' },
    'Other Civic Issues': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'public_safety_hazard' },
    'Other': { id: 'public_safety_other_civic_hazards', displayName: 'Public Safety & Other Civic Hazards', defaultSubcategory: 'public_safety_hazard' },
};

/**
 * Returns the complete 6 canonical category taxonomy array.
 */
const getAllCategories = () => CATEGORIES;

/**
 * Retrieves a category object by ID or Display Name.
 * @param {string} catIdOrName
 * @returns {Object|null}
 */
const getCategoryByIdOrName = (catIdOrName = '') => {
    if (!catIdOrName) return null;
    const searchStr = catIdOrName.toLowerCase().trim();
    const directMatch = CATEGORIES.find(
        (c) => c.id.toLowerCase() === searchStr || c.displayName.toLowerCase() === searchStr
    );
    if (directMatch) return directMatch;

    const legacy = LEGACY_CATEGORY_MAP[catIdOrName] || Object.values(LEGACY_CATEGORY_MAP).find(l => l.id.toLowerCase() === searchStr || l.displayName.toLowerCase() === searchStr);
    if (legacy) {
        return CATEGORIES.find((c) => c.id === legacy.id) || null;
    }
    return null;
};

/**
 * Validates whether a category ID or display name exists in the canonical taxonomy or legacy map.
 * @param {string} categoryInput
 * @returns {boolean}
 */
const isValidCategory = (categoryInput = '') => {
    if (!categoryInput) return false;
    const cat = getCategoryByIdOrName(categoryInput);
    if (cat) return true;
    return Boolean(LEGACY_CATEGORY_MAP[categoryInput]);
};

/**
 * Validates whether a subcategory ID or display name exists under a category.
 * @param {string} categoryInput
 * @param {string} subcategoryInput
 * @returns {boolean}
 */
const isValidSubcategory = (categoryInput = '', subcategoryInput = '') => {
    if (!categoryInput || !subcategoryInput) return false;
    const cat = getCategoryByIdOrName(categoryInput);
    if (!cat) return false;
    const subStr = subcategoryInput.toLowerCase().trim();
    return cat.subcategories.some(
        (sub) => sub.id.toLowerCase() === subStr || sub.displayName.toLowerCase() === subStr
    );
};

/**
 * Normalizes legacy or raw category input into standard Canonical Category ID and Display Name.
 * @param {string} categoryInput
 * @param {string} [subcategoryInput]
 * @returns {{ id: string, displayName: string, subcategory: string, subcategoryDisplayName: string }}
 */
const normalizeCategory = (categoryInput = '', subcategoryInput = '') => {
    if (!categoryInput) {
        return {
            id: 'roads_infrastructure',
            displayName: 'Roads & Infrastructure',
            subcategory: 'road_damage',
            subcategoryDisplayName: 'Road Damage',
        };
    }

    // Check direct legacy mapping first
    if (LEGACY_CATEGORY_MAP[categoryInput]) {
        const legacy = LEGACY_CATEGORY_MAP[categoryInput];
        const catObj = getCategoryByIdOrName(legacy.id);
        const subObj = catObj ? catObj.subcategories.find((s) => s.id === legacy.defaultSubcategory) : null;
        return {
            id: legacy.id,
            displayName: legacy.displayName,
            subcategory: subcategoryInput || legacy.defaultSubcategory,
            subcategoryDisplayName: subObj ? subObj.displayName : (subcategoryInput || 'General'),
        };
    }

    // Lookup in standard taxonomy
    const catObj = getCategoryByIdOrName(categoryInput);
    if (catObj) {
        let subObj = null;
        if (subcategoryInput) {
            const subStr = subcategoryInput.toLowerCase().trim();
            subObj = catObj.subcategories.find(
                (s) => s.id.toLowerCase() === subStr || s.displayName.toLowerCase() === subStr
            );
        }
        if (!subObj) {
            subObj = catObj.subcategories[0];
        }

        return {
            id: catObj.id,
            displayName: catObj.displayName,
            subcategory: subObj ? subObj.id : (subcategoryInput || 'road_damage'),
            subcategoryDisplayName: subObj ? subObj.displayName : (subcategoryInput || 'General'),
        };
    }

    // Fallback if unmapped
    return {
        id: 'public_safety_other_civic_hazards',
        displayName: 'Public Safety & Other Civic Hazards',
        subcategory: 'public_safety_hazard',
        subcategoryDisplayName: 'Public Safety Hazard',
    };
};

module.exports = {
    CATEGORIES,
    LEGACY_CATEGORY_MAP,
    getAllCategories,
    getCategoryByIdOrName,
    isValidCategory,
    isValidSubcategory,
    normalizeCategory,
};
