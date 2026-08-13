/**
 * Centralized Civic Category Taxonomy (Sprint 6)
 * Single Source of Truth for Complaint Categories, Subcategories, Keywords, and Severity Indicators.
 */

const CATEGORIES = [
    {
        id: 'roads_transportation',
        displayName: 'Roads & Transportation',
        description: 'Issues involving roads, sidewalks, footpaths, bridges, and road signage infrastructure',
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
            { id: 'damaged_road_sign', displayName: 'Damaged Road Sign', keywords: ['damaged road sign', 'broken signpost', 'bent sign'], defaultSeverity: 'Low' },
            { id: 'traffic_signal_issue', displayName: 'Traffic Signal Issue', keywords: ['traffic signal issue', 'traffic light fault', 'signal timing issue'], defaultSeverity: 'High' },
            { id: 'illegal_parking', displayName: 'Illegal Parking', keywords: ['illegal parking', 'unauthorized parking', 'vehicle blocking'], defaultSeverity: 'Low' },
            { id: 'other_road_issue', displayName: 'Other Road Issue', keywords: ['road issue', 'street issue', 'thoroughfare problem'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'street_lighting_electrical',
        displayName: 'Street Lighting & Electrical',
        description: 'Issues involving streetlights, power poles, transformers, and electrical safety hazards',
        icon: '💡',
        subcategories: [
            { id: 'streetlight_not_working', displayName: 'Streetlight Not Working', keywords: ['streetlight not working', 'street light', 'streetlight', 'lamp post', 'lamp out', 'dark street', 'light dead', 'unlit street', 'dark', 'light out'], defaultSeverity: 'Medium' },
            { id: 'damaged_streetlight', displayName: 'Damaged Streetlight', keywords: ['damaged streetlight', 'broken lamp post', 'shattered light bulb', 'broken street light'], defaultSeverity: 'Medium' },
            { id: 'damaged_electrical_pole', displayName: 'Damaged Electrical Pole', keywords: ['damaged pole', 'leaning electric pole', 'broken utility pole', 'electric pole'], defaultSeverity: 'High' },
            { id: 'exposed_wiring', displayName: 'Exposed Wiring', keywords: ['exposed wiring', 'dangling wire', 'open electrical cable', 'live wire', 'hanging wire'], defaultSeverity: 'Critical' },
            { id: 'electrical_hazard', displayName: 'Electrical Hazard', keywords: ['electrical hazard', 'sparking transformer', 'short circuit', 'electrical shock', 'sparking'], defaultSeverity: 'Critical' },
            { id: 'power_infrastructure_damage', displayName: 'Power Infrastructure Damage', keywords: ['power infrastructure', 'substation damage', 'power box open'], defaultSeverity: 'High' },
            { id: 'other_electrical_issue', displayName: 'Other Electrical Issue', keywords: ['electrical problem', 'power line issue'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'waste_management',
        displayName: 'Waste Management',
        description: 'Solid waste, overflowing bins, uncollected trash, and illegal waste dumping',
        icon: '🗑️',
        subcategories: [
            { id: 'garbage_dumping', displayName: 'Garbage Dumping', keywords: ['garbage dumping', 'trash dump', 'rubbish pile', 'waste dump', 'garbage', 'trash', 'rubbish'], defaultSeverity: 'Medium' },
            { id: 'overflowing_garbage_bin', displayName: 'Overflowing Garbage Bin', keywords: ['overflowing bin', 'full trash can', 'waste spill', 'overflowing dumpster'], defaultSeverity: 'Medium' },
            { id: 'missed_garbage_collection', displayName: 'Missed Garbage Collection', keywords: ['missed collection', 'no trash pickup', 'garbage truck missed'], defaultSeverity: 'Medium' },
            { id: 'illegal_dumping', displayName: 'Illegal Dumping', keywords: ['illegal dumping', 'dumping site', 'unauthorized dump'], defaultSeverity: 'High' },
            { id: 'plastic_waste', displayName: 'Plastic Waste', keywords: ['plastic waste', 'plastic litter', 'polybag accumulation'], defaultSeverity: 'Low' },
            { id: 'construction_waste', displayName: 'Construction Waste', keywords: ['construction waste', 'debris pile', 'rubble dump', 'building debris'], defaultSeverity: 'Medium' },
            { id: 'household_waste', displayName: 'Household Waste', keywords: ['household waste', 'domestic trash', 'residential garbage'], defaultSeverity: 'Low' },
            { id: 'other_waste_issue', displayName: 'Other Waste Issue', keywords: ['waste problem', 'garbage complaint'], defaultSeverity: 'Medium' },
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
            { id: 'other_water_issue', displayName: 'Other Water Issue', keywords: ['water problem', 'supply grievance'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'drainage_flooding',
        displayName: 'Drainage & Flooding',
        description: 'Stormwater drains, surface waterlogging, urban flooding, and blocked culverts',
        icon: '🌊',
        subcategories: [
            { id: 'blocked_drain', displayName: 'Blocked Drain', keywords: ['blocked drain', 'clogged drain', 'choked gutter', 'stuck drain'], defaultSeverity: 'Medium' },
            { id: 'drain_overflow', displayName: 'Drain Overflow', keywords: ['drain overflow', 'gutter spill', 'overflowing drain line'], defaultSeverity: 'High' },
            { id: 'waterlogging', displayName: 'Waterlogging', keywords: ['waterlogging', 'standing water on road', 'puddle accumulation', 'submerged street'], defaultSeverity: 'High' },
            { id: 'urban_flooding', displayName: 'Urban Flooding', keywords: ['urban flooding', 'flooded street', 'flooded neighborhood', 'inundation'], defaultSeverity: 'Critical' },
            { id: 'damaged_drain', displayName: 'Damaged Drain', keywords: ['damaged drain', 'broken gutter wall', 'collapsed drain channel'], defaultSeverity: 'Medium' },
            { id: 'stormwater_issue', displayName: 'Stormwater Issue', keywords: ['stormwater drain', 'rain drain blocked'], defaultSeverity: 'Medium' },
            { id: 'other_drainage_issue', displayName: 'Other Drainage Issue', keywords: ['drainage problem', 'gutter issue'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'sewage_sanitation',
        displayName: 'Sewage & Sanitation',
        description: 'Wastewater lines, manholes, sewage spills, and public sanitation hygiene',
        icon: '☣️',
        subcategories: [
            { id: 'sewage_leakage', displayName: 'Sewage Leakage', keywords: ['sewage leakage', 'foul water leak', 'sewer leak', 'sewage smell'], defaultSeverity: 'High' },
            { id: 'sewage_overflow', displayName: 'Sewage Overflow', keywords: ['sewage overflow', 'gushing sewage', 'overflowing sewer line'], defaultSeverity: 'Critical' },
            { id: 'open_sewage', displayName: 'Open Sewage', keywords: ['open sewage', 'uncovered sewer', 'raw sewage stream'], defaultSeverity: 'Critical' },
            { id: 'manhole_issue', displayName: 'Manhole Issue', keywords: ['manhole issue', 'damaged manhole cover', 'loose manhole lid'], defaultSeverity: 'High' },
            { id: 'damaged_manhole', displayName: 'Damaged Manhole', keywords: ['open manhole', 'missing manhole cover', 'hole in road manhole'], defaultSeverity: 'Critical' },
            { id: 'public_toilet_issue', displayName: 'Public Toilet Issue', keywords: ['public toilet', 'dirty washroom', 'broken toilet facility'], defaultSeverity: 'Medium' },
            { id: 'sanitation_problem', displayName: 'Sanitation Problem', keywords: ['sanitation hazard', 'unhygienic area'], defaultSeverity: 'Medium' },
            { id: 'other_sewage_issue', displayName: 'Other Sewage Issue', keywords: ['sewer problem', 'sanitation complaint'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'parks_public_spaces',
        displayName: 'Parks & Public Spaces',
        description: 'Municipal parks, playground equipment, public benches, and recreational spaces',
        icon: '🌳',
        subcategories: [
            { id: 'damaged_playground_equipment', displayName: 'Damaged Playground Equipment', keywords: ['playground damaged', 'broken swing', 'slide broken', 'unsafe play area'], defaultSeverity: 'Medium' },
            { id: 'damaged_park_equipment', displayName: 'Damaged Park Equipment', keywords: ['park equipment broken', 'exercise machine damaged'], defaultSeverity: 'Low' },
            { id: 'park_maintenance', displayName: 'Park Maintenance', keywords: ['park maintenance', 'overgrown grass', 'unkept lawn', 'litter in park'], defaultSeverity: 'Low' },
            { id: 'public_space_damage', displayName: 'Public Space Damage', keywords: ['public space damage', 'damaged plaza', 'broken fountain'], defaultSeverity: 'Medium' },
            { id: 'unsafe_playground', displayName: 'Unsafe Playground', keywords: ['unsafe playground', 'sharp edges on play equipment'], defaultSeverity: 'High' },
            { id: 'public_seating_damage', displayName: 'Public Seating Damage', keywords: ['broken bench', 'damaged seating', 'park bench broken'], defaultSeverity: 'Low' },
            { id: 'other_public_space_issue', displayName: 'Other Public Space Issue', keywords: ['park issue', 'recreational space problem'], defaultSeverity: 'Low' },
        ]
    },
    {
        id: 'public_buildings_infrastructure',
        displayName: 'Public Buildings & Infrastructure',
        description: 'Government offices, municipal facilities, public schools, and community centers',
        icon: '🏛️',
        subcategories: [
            { id: 'government_building_damage', displayName: 'Government Building Damage', keywords: ['government building damage', 'municipal office structural damage'], defaultSeverity: 'Medium' },
            { id: 'school_infrastructure', displayName: 'School Infrastructure', keywords: ['school infrastructure', 'damaged classroom', 'broken school wall'], defaultSeverity: 'High' },
            { id: 'hospital_infrastructure', displayName: 'Hospital Infrastructure', keywords: ['hospital infrastructure', 'clinic damage', 'health center issue'], defaultSeverity: 'High' },
            { id: 'public_facility_damage', displayName: 'Public Facility Damage', keywords: ['public facility damage', 'community center damage'], defaultSeverity: 'Medium' },
            { id: 'damaged_public_structure', displayName: 'Damaged Public Structure', keywords: ['damaged monument', 'public wall damaged', 'bus shelter damage'], defaultSeverity: 'Medium' },
            { id: 'facility_maintenance', displayName: 'Facility Maintenance', keywords: ['facility maintenance', 'building repair needed'], defaultSeverity: 'Low' },
            { id: 'other_infrastructure_issue', displayName: 'Other Infrastructure Issue', keywords: ['public building problem', 'infrastructure complaint'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'traffic_road_safety',
        displayName: 'Traffic & Road Safety',
        description: 'Traffic signals, dangerous intersections, pedestrian crossings, and road hazards',
        icon: '🚦',
        subcategories: [
            { id: 'broken_traffic_signal', displayName: 'Broken Traffic Signal', keywords: ['broken traffic signal', 'traffic light broken', 'red light fail'], defaultSeverity: 'High' },
            { id: 'missing_traffic_sign', displayName: 'Missing Traffic Sign', keywords: ['missing traffic sign', 'speed limit sign missing'], defaultSeverity: 'Medium' },
            { id: 'damaged_traffic_sign', displayName: 'Damaged Traffic Sign', keywords: ['damaged traffic sign', 'bent traffic sign'], defaultSeverity: 'Low' },
            { id: 'dangerous_intersection', displayName: 'Dangerous Intersection', keywords: ['dangerous intersection', 'blind turn hazard', 'high accident spot'], defaultSeverity: 'High' },
            { id: 'pedestrian_safety_issue', displayName: 'Pedestrian Safety Issue', keywords: ['pedestrian safety', 'zebra crossing faded', 'unsafe crossing'], defaultSeverity: 'High' },
            { id: 'road_safety_hazard', displayName: 'Road Safety Hazard', keywords: ['road safety hazard', 'oil slick on road', 'debris on highway'], defaultSeverity: 'Critical' },
            { id: 'traffic_obstruction', displayName: 'Traffic Obstruction', keywords: ['traffic obstruction', 'road blockage', 'traffic bottleneck'], defaultSeverity: 'High' },
            { id: 'other_traffic_issue', displayName: 'Other Traffic Issue', keywords: ['traffic problem', 'road safety complaint'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'animals_public_safety',
        displayName: 'Animals & Public Safety',
        description: 'Stray animal management, animal obstructions, and aggressive/dangerous animals',
        icon: '🐕',
        subcategories: [
            { id: 'stray_animals', displayName: 'Stray Animals', keywords: ['stray dogs', 'stray cattle', 'stray animals', 'roaming dogs'], defaultSeverity: 'Medium' },
            { id: 'dangerous_animal', displayName: 'Dangerous Animal', keywords: ['rabid dog', 'aggressive animal', 'biting animal', 'wild animal threat'], defaultSeverity: 'Critical' },
            { id: 'animal_obstruction', displayName: 'Animal Obstruction', keywords: ['cows blocking road', 'animal obstruction', 'cattle on highway'], defaultSeverity: 'Medium' },
            { id: 'animal_related_hazard', displayName: 'Animal-Related Hazard', keywords: ['dead animal on road', 'animal carcass', 'animal waste hazard'], defaultSeverity: 'High' },
            { id: 'other_animal_issue', displayName: 'Other Animal Issue', keywords: ['animal problem', 'pet animal nuisance'], defaultSeverity: 'Low' },
        ]
    },
    {
        id: 'trees_environment',
        displayName: 'Trees & Environment',
        description: 'Fallen trees, hazardous branches, illegal logging, air pollution, and noise issues',
        icon: '🌱',
        subcategories: [
            { id: 'fallen_tree', displayName: 'Fallen Tree', keywords: ['fallen tree', 'tree blocking road', 'collapsed tree on car'], defaultSeverity: 'High' },
            { id: 'dangerous_tree_branch', displayName: 'Dangerous Tree Branch', keywords: ['dangerous branch', 'hanging branch', 'branch about to fall'], defaultSeverity: 'High' },
            { id: 'tree_maintenance', displayName: 'Tree Maintenance', keywords: ['tree pruning needed', 'overgrown branches', 'tree trimming'], defaultSeverity: 'Low' },
            { id: 'illegal_tree_cutting', displayName: 'Illegal Tree Cutting', keywords: ['illegal tree cutting', 'unauthorized deforestation', 'felling trees'], defaultSeverity: 'High' },
            { id: 'environmental_damage', displayName: 'Environmental Damage', keywords: ['environmental damage', 'wetland destruction', 'greenery damage'], defaultSeverity: 'High' },
            { id: 'air_pollution', displayName: 'Air Pollution', keywords: ['air pollution', 'smoke burning', 'factory emissions', 'toxic fumes'], defaultSeverity: 'High' },
            { id: 'noise_pollution', displayName: 'Noise Pollution', keywords: ['noise pollution', 'loudspeaker nuisance', 'late night noise'], defaultSeverity: 'Low' },
            { id: 'other_environmental_issue', displayName: 'Other Environmental Issue', keywords: ['environmental complaint', 'eco issue'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'public_cleanliness',
        displayName: 'Public Cleanliness',
        description: 'General public area hygiene, littering, foul odors, and maintenance of public zones',
        icon: '🧹',
        subcategories: [
            { id: 'dirty_public_area', displayName: 'Dirty Public Area', keywords: ['dirty street', 'unclean public space', 'filthy market'], defaultSeverity: 'Medium' },
            { id: 'littering', displayName: 'Littering', keywords: ['littering', 'trash scattered', 'garbage strewn about'], defaultSeverity: 'Low' },
            { id: 'foul_smell', displayName: 'Foul Smell', keywords: ['foul smell', 'stench', 'bad odor in public'], defaultSeverity: 'Medium' },
            { id: 'unclean_public_facility', displayName: 'Unclean Public Facility', keywords: ['unclean bus stand', 'filthy railway station plaza'], defaultSeverity: 'Medium' },
            { id: 'public_area_maintenance', displayName: 'Public Area Maintenance', keywords: ['sweeping required', 'cleaning needed'], defaultSeverity: 'Low' },
            { id: 'other_cleanliness_issue', displayName: 'Other Cleanliness Issue', keywords: ['cleanliness complaint', 'hygiene problem'], defaultSeverity: 'Low' },
        ]
    },
    {
        id: 'construction_public_works',
        displayName: 'Construction & Public Works',
        description: 'Unsafe construction worksites, building debris, and public work obstructions',
        icon: '🏗️',
        subcategories: [
            { id: 'unsafe_construction', displayName: 'Unsafe Construction', keywords: ['unsafe construction', 'scaffolding risk', 'falling bricks'], defaultSeverity: 'Critical' },
            { id: 'construction_debris', displayName: 'Construction Debris', keywords: ['construction debris', 'building rubble', 'cement bags on road'], defaultSeverity: 'Medium' },
            { id: 'damaged_public_work', displayName: 'Damaged Public Work', keywords: ['damaged public work', 'incomplete roadwork left open'], defaultSeverity: 'High' },
            { id: 'abandoned_construction', displayName: 'Abandoned Construction', keywords: ['abandoned pit', 'unattended construction pit'], defaultSeverity: 'High' },
            { id: 'construction_obstruction', displayName: 'Construction Obstruction', keywords: ['construction blocking sidewalk', 'materials on road'], defaultSeverity: 'Medium' },
            { id: 'unsafe_worksite', displayName: 'Unsafe Worksite', keywords: ['unsafe worksite', 'no warning signs at trench'], defaultSeverity: 'High' },
            { id: 'other_construction_issue', displayName: 'Other Construction Issue', keywords: ['construction complaint', 'public works issue'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'public_utilities_communication',
        displayName: 'Public Utilities & Communication',
        description: 'Public Wi-Fi, telecom infrastructure, utility boxes, and public equipment damage',
        icon: '📡',
        subcategories: [
            { id: 'damaged_public_equipment', displayName: 'Damaged Public Equipment', keywords: ['damaged public box', 'utility cabinet broken'], defaultSeverity: 'Medium' },
            { id: 'telecom_infrastructure_issue', displayName: 'Telecom Infrastructure Issue', keywords: ['telecom cable down', 'fiber optic line severed'], defaultSeverity: 'Medium' },
            { id: 'public_wifi_issue', displayName: 'Public Wi-Fi Issue', keywords: ['public wifi down', 'city wifi disconnected'], defaultSeverity: 'Low' },
            { id: 'communication_infrastructure_damage', displayName: 'Communication Infrastructure Damage', keywords: ['damaged tower', 'telecom pole leaning'], defaultSeverity: 'High' },
            { id: 'other_utility_issue', displayName: 'Other Utility Issue', keywords: ['utility complaint', 'public equipment issue'], defaultSeverity: 'Low' },
        ]
    },
    {
        id: 'public_safety_hazards',
        displayName: 'Public Safety & Hazards',
        description: 'Immediate safety threats, fire risks, dangerous structures, and open hazards',
        icon: '⚠️',
        subcategories: [
            { id: 'fire_hazard', displayName: 'Fire Hazard', keywords: ['fire hazard', 'flammable trash', 'dry brush near electric box'], defaultSeverity: 'Critical' },
            { id: 'electrical_hazard', displayName: 'Electrical Hazard', keywords: ['electrical hazard', 'high voltage threat', 'live cable'], defaultSeverity: 'Critical' },
            { id: 'dangerous_structure', displayName: 'Dangerous Structure', keywords: ['collapsing wall', 'dilapidated building', 'falling facade'], defaultSeverity: 'Critical' },
            { id: 'accident_hazard', displayName: 'Accident Hazard', keywords: ['accident hazard', 'unmarked pit', 'open trench on highway'], defaultSeverity: 'Critical' },
            { id: 'open_construction_hazard', displayName: 'Open Construction Hazard', keywords: ['open trench', 'unfenced excavation'], defaultSeverity: 'High' },
            { id: 'exposed_infrastructure', displayName: 'Exposed Infrastructure', keywords: ['exposed gas pipe', 'open transformer'], defaultSeverity: 'Critical' },
            { id: 'other_safety_hazard', displayName: 'Other Safety Hazard', keywords: ['safety threat', 'public hazard'], defaultSeverity: 'High' },
        ]
    },
    {
        id: 'housing_property',
        displayName: 'Housing & Property',
        description: 'Public property damage, encroachment on public land, and unsafe public housing',
        icon: '🏠',
        subcategories: [
            { id: 'damaged_public_housing', displayName: 'Damaged Public Housing', keywords: ['public housing damage', 'government quarters wall crack'], defaultSeverity: 'Medium' },
            { id: 'property_encroachment', displayName: 'Property Encroachment', keywords: ['property encroachment', 'illegal structure on footpath'], defaultSeverity: 'Medium' },
            { id: 'abandoned_property', displayName: 'Abandoned Property', keywords: ['abandoned building', 'derelict property hazard'], defaultSeverity: 'Medium' },
            { id: 'public_property_damage', displayName: 'Public Property Damage', keywords: ['public property damage', 'vandalism of public structure'], defaultSeverity: 'Medium' },
            { id: 'unsafe_property', displayName: 'Unsafe Property', keywords: ['unsafe property', 'hazardous balcony'], defaultSeverity: 'High' },
            { id: 'other_property_issue', displayName: 'Other Property Issue', keywords: ['property complaint', 'housing issue'], defaultSeverity: 'Low' },
        ]
    },
    {
        id: 'public_services_administration',
        displayName: 'Public Services & Administration',
        description: 'Municipal service disruptions, facility accessibility, and administrative complaints',
        icon: '📋',
        subcategories: [
            { id: 'public_service_disruption', displayName: 'Public Service Disruption', keywords: ['service disruption', 'municipal office closed'], defaultSeverity: 'Medium' },
            { id: 'facility_closure', displayName: 'Facility Closure', keywords: ['facility closure', 'public office shutdown'], defaultSeverity: 'Low' },
            { id: 'service_accessibility_issue', displayName: 'Service Accessibility Issue', keywords: ['service accessibility', 'long lines', 'desk unmanned'], defaultSeverity: 'Low' },
            { id: 'public_facility_complaint', displayName: 'Public Facility Complaint', keywords: ['facility complaint', 'civic center grievance'], defaultSeverity: 'Low' },
            { id: 'administrative_service_issue', displayName: 'Administrative Service Issue', keywords: ['administrative delay', 'permit delay'], defaultSeverity: 'Low' },
            { id: 'other_public_service_issue', displayName: 'Other Public Service Issue', keywords: ['public service problem'], defaultSeverity: 'Low' },
        ]
    },
    {
        id: 'accessibility',
        displayName: 'Accessibility',
        description: 'Wheelchair ramps, tactile paths, sidewalk barriers, and accessibility features',
        icon: '♿',
        subcategories: [
            { id: 'broken_accessibility_ramp', displayName: 'Broken Accessibility Ramp', keywords: ['broken ramp', 'wheelchair ramp broken', 'damaged handicap ramp'], defaultSeverity: 'High' },
            { id: 'blocked_accessibility_path', displayName: 'Blocked Accessibility Path', keywords: ['blocked ramp', 'obstacle on wheelchair path', 'blocked access'], defaultSeverity: 'High' },
            { id: 'inaccessible_sidewalk', displayName: 'Inaccessible Sidewalk', keywords: ['inaccessible sidewalk', 'no curb ramp', 'steep curb barrier'], defaultSeverity: 'Medium' },
            { id: 'accessibility_infrastructure_damage', displayName: 'Accessibility Infrastructure Damage', keywords: ['tactile paving missing', 'braille sign damaged'], defaultSeverity: 'Medium' },
            { id: 'other_accessibility_issue', displayName: 'Other Accessibility Issue', keywords: ['accessibility complaint', 'disability access issue'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'health_sanitation_hazards',
        displayName: 'Health & Sanitation Hazards',
        description: 'Stagnant water, mosquito breeding sites, public health risks, and unsanitary conditions',
        icon: '🦟',
        subcategories: [
            { id: 'mosquito_breeding', displayName: 'Mosquito Breeding', keywords: ['mosquito breeding', 'mosquito larvae', 'dengue risk', 'malaria risk'], defaultSeverity: 'High' },
            { id: 'stagnant_water', displayName: 'Stagnant Water', keywords: ['stagnant water', 'dirty standing water', 'scum pool'], defaultSeverity: 'High' },
            { id: 'public_health_hazard', displayName: 'Public Health Hazard', keywords: ['public health hazard', 'disease risk', 'epidemic threat'], defaultSeverity: 'Critical' },
            { id: 'unsanitary_condition', displayName: 'Unsanitary Condition', keywords: ['unsanitary condition', 'filth hazard', 'decaying matter'], defaultSeverity: 'High' },
            { id: 'disease_risk', displayName: 'Disease Risk', keywords: ['disease outbreak risk', 'contamination hazard'], defaultSeverity: 'Critical' },
            { id: 'other_health_hazard', displayName: 'Other Health Hazard', keywords: ['health hazard complaint'], defaultSeverity: 'Medium' },
        ]
    },
    {
        id: 'other_civic_issues',
        displayName: 'Other Civic Issues',
        description: 'General civic grievances not covered by specific infrastructure categories',
        icon: '📁',
        subcategories: [
            { id: 'general_civic_issue', displayName: 'General Civic Issue', keywords: ['general civic issue', 'city grievance'], defaultSeverity: 'Low' },
            { id: 'unclassified_issue', displayName: 'Unclassified Issue', keywords: ['unclassified issue', 'miscellaneous problem'], defaultSeverity: 'Low' },
            { id: 'other', displayName: 'Other', keywords: ['other', 'general', 'misc'], defaultSeverity: 'Low' },
        ]
    }
];

// Mapping for legacy Sprint 5 categories to new Taxonomy Category IDs & Display Names
const LEGACY_CATEGORY_MAP = {
    'Garbage': { id: 'waste_management', displayName: 'Waste Management', defaultSubcategory: 'garbage_dumping' },
    'Road Damage': { id: 'roads_transportation', displayName: 'Roads & Transportation', defaultSubcategory: 'road_damage' },
    'Water Leakage': { id: 'water_supply', displayName: 'Water Supply', defaultSubcategory: 'water_leakage' },
    'Electricity': { id: 'street_lighting_electrical', displayName: 'Street Lighting & Electrical', defaultSubcategory: 'electrical_hazard' },
    'Street Light': { id: 'street_lighting_electrical', displayName: 'Street Lighting & Electrical', defaultSubcategory: 'streetlight_not_working' },
    'Other': { id: 'other_civic_issues', displayName: 'Other Civic Issues', defaultSubcategory: 'general_civic_issue' },
};

/**
 * Returns the complete category taxonomy array.
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
    return CATEGORIES.find(
        (c) => c.id.toLowerCase() === searchStr || c.displayName.toLowerCase() === searchStr
    ) || null;
};

/**
 * Validates whether a category ID or display name exists in the taxonomy.
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
 * Normalizes legacy or raw category input into standard Category ID and Display Name.
 * @param {string} categoryInput
 * @param {string} [subcategoryInput]
 * @returns {{ id: string, displayName: string, subcategory: string, subcategoryDisplayName: string }}
 */
const normalizeCategory = (categoryInput = '', subcategoryInput = '') => {
    if (!categoryInput) {
        return {
            id: 'other_civic_issues',
            displayName: 'Other Civic Issues',
            subcategory: 'general_civic_issue',
            subcategoryDisplayName: 'General Civic Issue',
        };
    }

    // Check direct legacy mapping first
    if (LEGACY_CATEGORY_MAP[categoryInput]) {
        const legacy = LEGACY_CATEGORY_MAP[categoryInput];
        const catObj = getCategoryByIdOrName(legacy.id);
        const subObj = catObj.subcategories.find((s) => s.id === legacy.defaultSubcategory);
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
            subObj = catObj.subcategories[catObj.subcategories.length - 1]; // Fallback to last subcategory (usually 'Other...')
        }

        return {
            id: catObj.id,
            displayName: catObj.displayName,
            subcategory: subObj ? subObj.id : (subcategoryInput || 'other'),
            subcategoryDisplayName: subObj ? subObj.displayName : (subcategoryInput || 'Other'),
        };
    }

    // Fallback if unmapped
    return {
        id: 'other_civic_issues',
        displayName: 'Other Civic Issues',
        subcategory: 'unclassified_issue',
        subcategoryDisplayName: 'Unclassified Issue',
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
