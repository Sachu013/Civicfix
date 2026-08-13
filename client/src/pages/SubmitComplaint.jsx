import React, { useState, useEffect, useCallback } from 'react';
import {
    PlusCircle,
    MapPin,
    Type,
    FileText,
    Image as ImageIcon,
    CheckCircle,
    ArrowRight,
    ShieldAlert,
    HelpCircle,
    Sparkles,
    ChevronRight,
    Copy,
    Check,
    UploadCloud,
    X,
    FileCheck,
    Crosshair,
    Search,
    Loader2,
    Compass,
    Building2,
    Map,
    Target,
    Filter
} from 'lucide-react';
import api from '../api';
import LocationPickerMap from '../components/LocationPickerMap';
import DuplicateWarningModal from '../components/DuplicateWarningModal';
import { reverseGeocode, searchLocation, getAccurateCurrentPosition } from '../services/nominatimService';

const SubmitComplaint = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Roads & Transportation',
        subcategory: 'Pothole',
        location: '',
        imageUrl: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const [loading, setLoading] = useState(false);
    const [submittedId, setSubmittedId] = useState(null);
    const [copied, setCopied] = useState(false);

    // Taxonomy state
    const [categoriesList, setCategoriesList] = useState([]);

    // Map & Geolocation state
    const [position, setPosition] = useState({ lat: 28.6139, lng: 77.2090 }); // Default New Delhi center
    const [geoDetails, setGeoDetails] = useState({
        location: '',
        latitude: 28.6139,
        longitude: 77.2090,
        formattedAddress: '',
        landmark: '',
        locality: '',
        city: '',
        district: '',
        state: '',
        pincode: '',
        country: 'India'
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const [isGeolocating, setIsGeolocating] = useState(false);
    const [gpsAccuracy, setGpsAccuracy] = useState(null);
    const [geoError, setGeoError] = useState(null);
    const [nearbyComplaints, setNearbyComplaints] = useState([]);

    // Duplicate detection modal state
    const [duplicateCandidates, setDuplicateCandidates] = useState([]);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);

    useEffect(() => {
        const loadTaxonomy = async () => {
            try {
                const { data } = await api.get('/categories');
                if (Array.isArray(data) && data.length > 0) {
                    setCategoriesList(data);
                    // Initialize default category/subcategory
                    const firstCat = data[0];
                    setFormData((prev) => ({
                        ...prev,
                        category: firstCat.displayName || firstCat.id,
                        subcategory: firstCat.subcategories?.[0]?.displayName || firstCat.subcategories?.[0]?.id || ''
                    }));
                }
            } catch (err) {
                console.warn('Could not fetch categories from server, fallback taxonomy active:', err);
            }
        };
        loadTaxonomy();
    }, []);

    // Get active subcategories list based on selected category
    const activeCategoryObj = categoriesList.find(
        (c) => c.displayName === formData.category || c.id === formData.category
    ) || categoriesList[0];

    const activeSubcategories = activeCategoryObj ? activeCategoryObj.subcategories || [] : [];

    // Fetch nearby complaints within 500m radius of current position
    const fetchNearbyComplaints = useCallback(async (lat, lng) => {
        if (!lat || !lng) return;
        try {
            const { data } = await api.get('/complaints/nearby', {
                params: { lat, lng, radius: 500 }
            });
            if (Array.isArray(data)) {
                setNearbyComplaints(data);
            }
        } catch (error) {
            console.error('Failed to fetch nearby complaints:', error);
        }
    }, []);

    // Perform initial reverse geocode and nearby fetch on mount
    useEffect(() => {
        let isMounted = true;
        const initLocation = async () => {
            const parsed = await reverseGeocode(position.lat, position.lng);
            if (parsed && isMounted) {
                setGeoDetails(parsed);
                setFormData((prev) => ({ ...prev, location: parsed.location || parsed.formattedAddress }));
            }
            if (isMounted) {
                fetchNearbyComplaints(position.lat, position.lng);
            }
        };
        initLocation();
        return () => {
            isMounted = false;
        };
    }, []);

    // Handler for map clicks & marker dragging
    const handleLocationSelect = async (lat, lng) => {
        const newPos = { lat: Number(lat), lng: Number(lng) };
        setPosition(newPos);
        setGeoError(null);

        const parsed = await reverseGeocode(lat, lng);
        if (parsed) {
            setGeoDetails(parsed);
            setFormData((prev) => ({ ...prev, location: parsed.location || parsed.formattedAddress }));
        }

        fetchNearbyComplaints(lat, lng);
    };

    // High-precision Geolocation API sampler - "Use My Current Location"
    const handleUseMyLocation = async () => {
        setIsGeolocating(true);
        setGeoError(null);

        try {
            const { latitude, longitude, accuracy } = await getAccurateCurrentPosition({
                maxWaitTimeMs: 4500,
                desiredAccuracyMeters: 15,
            });

            setGpsAccuracy(accuracy);
            await handleLocationSelect(latitude, longitude);
        } catch (err) {
            setGpsAccuracy(null);
            setGeoError(err.message || 'Unable to retrieve precise device location. You can drag the pin on the map to set your location.');
        } finally {
            setIsGeolocating(false);
        }
    };

    // Location search with debouncing
    useEffect(() => {
        if (!searchQuery || searchQuery.trim().length < 3) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchLocation(searchQuery);
            setSearchResults(results);
            setIsSearching(false);
            setShowDropdown(results.length > 0);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectSearchResult = (result) => {
        const { lat, lng, parsedLocation, displayName } = result;
        setPosition({ lat, lng });
        setGpsAccuracy(null); // Reset device GPS accuracy on manual search
        setGeoDetails(parsedLocation);
        setFormData((prev) => ({ ...prev, location: parsedLocation.location || displayName }));
        setSearchQuery('');
        setShowDropdown(false);
        fetchNearbyComplaints(lat, lng);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileValidation = (file) => {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type?.toLowerCase())) {
            alert('Invalid file format. Only JPG, JPEG, PNG, and WEBP image files are allowed.');
            return;
        }

        const maxBytes = 5 * 1024 * 1024; // 5 MB
        if (file.size > maxBytes) {
            const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
            alert(`File size (${sizeInMB} MB) exceeds maximum allowed limit of 5 MB.`);
            return;
        }

        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileValidation(e.target.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileValidation(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
    };

    const buildPayload = () => {
        const payload = new FormData();
        payload.append('title', formData.title);
        payload.append('description', formData.description);
        payload.append('category', formData.category);
        payload.append('subcategory', formData.subcategory || '');
        payload.append('location', formData.location);

        payload.append('latitude', position?.lat || '');
        payload.append('longitude', position?.lng || '');
        payload.append('formattedAddress', geoDetails?.formattedAddress || formData.location);
        payload.append('landmark', geoDetails?.landmark || '');
        payload.append('locality', geoDetails?.locality || '');
        payload.append('city', geoDetails?.city || '');
        payload.append('district', geoDetails?.district || '');
        payload.append('state', geoDetails?.state || '');
        payload.append('pincode', geoDetails?.pincode || '');
        payload.append('country', geoDetails?.country || 'India');

        if (selectedFile) {
            payload.append('image', selectedFile);
        } else if (formData.imageUrl) {
            payload.append('imageUrl', formData.imageUrl);
        }
        return payload;
    };

    // Form Submission & Duplicate Intercept Handler
    const handleSubmit = async (e, bypassDuplicateCheck = false) => {
        if (e) e.preventDefault();
        setLoading(true);

        const payload = buildPayload();

        try {
            // Step 1: Check for potential duplicates unless user clicked "Submit New Complaint Anyway"
            if (!bypassDuplicateCheck) {
                try {
                    const { data: dupData } = await api.post('/complaints/check-duplicates', payload, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    if (dupData?.hasPotentialDuplicates && Array.isArray(dupData.candidates) && dupData.candidates.length > 0) {
                        setDuplicateCandidates(dupData.candidates);
                        setShowDuplicateModal(true);
                        setLoading(false);
                        return; // Intercept & present modal to citizen
                    }
                } catch (dupErr) {
                    console.warn('Duplicate check warning (falling back to direct creation):', dupErr);
                    // Safe error fallback: Continue to normal creation if duplicate check API fails
                }
            }

            // Step 2: Final Complaint Creation
            const { data } = await api.post('/complaints', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowDuplicateModal(false);
            setSubmittedId(data.complaintId);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Transmission Error: Deployment failed. Please try again.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleViewComplaint = (complaintId) => {
        window.open(`/track?id=${complaintId}`, '_blank');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(submittedId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (submittedId) {
        return (
            <div className="max-w-2xl mx-auto py-12 animate-in zoom-in duration-500">
                <div className="card-premium p-10 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-lg shadow-green-200 animate-bounce">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 font-display mb-4 tracking-tight">Report Initialized Successfully</h2>
                    <p className="text-slate-500 font-semibold mb-10 max-w-md leading-relaxed">
                        Your grievance has been encrypted and securely transmitted to the municipal command center. Use the ID below to track resolution progress.
                    </p>

                    <div className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-8 mb-10 group relative">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Unique Tracking Identifier</p>
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-4xl font-black text-primary-600 font-display tracking-tighter shimmer rounded-lg">{submittedId}</span>
                            <button
                                onClick={copyToClipboard}
                                className="p-3 text-slate-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button
                            onClick={() => {
                                setSubmittedId(null);
                                handleRemoveFile();
                                setFormData({
                                    title: '',
                                    description: '',
                                    category: 'Garbage',
                                    location: '',
                                    imageUrl: ''
                                });
                            }}
                            className="btn-secondary flex-1 h-[60px]"
                        >
                            Draft Another Report
                        </button>
                        <a
                            href={`/track?id=${submittedId}`}
                            className="btn-primary flex-1 h-[60px]"
                        >
                            Access Tracking Vault
                            <ChevronRight size={20} />
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-5 gap-10 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Duplicate Warning Modal Interceptor */}
            {showDuplicateModal && (
                <DuplicateWarningModal
                    candidates={duplicateCandidates}
                    onSubmitAnyway={() => handleSubmit(null, true)}
                    onViewComplaint={handleViewComplaint}
                    onClose={() => setShowDuplicateModal(false)}
                />
            )}

            {/* Informative Sidebar */}
            <div className="lg:col-span-2 space-y-6">
                <div className="card-premium p-8 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                            <ShieldAlert size={24} />
                        </div>
                        <h3 className="text-2xl font-black font-display mb-3 tracking-tight">Citizen Reporting Intelligence</h3>
                        <p className="text-primary-100 font-medium leading-relaxed mb-6 opacity-80">
                            Our platform automatically checks for duplicate complaints, secures media uploads, and routes issues to the municipal response team.
                        </p>
                        <div className="space-y-3">
                            {['Intelligent Duplicate Detection', 'High-Precision GPS Sampling', 'Building-Level Reverse Geocoding'].map((t, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-400"></div>
                                    {t}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card-premium p-8">
                    <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                        <HelpCircle size={20} className="text-primary-500" />
                        Submission Guide
                    </h4>
                    <div className="space-y-6">
                        {[
                            { step: '01', title: 'Incident Title', desc: 'Clear, concise description of the observed civic anomaly.' },
                            { step: '02', title: 'Interactive Geo-Location', desc: 'Drag map marker, use GPS, or search for precise coordinates.' },
                            { step: '03', title: 'Media Evidence', desc: 'Secure image file upload (JPG, PNG, WEBP max 5MB).' }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <span className="text-3xl font-black text-slate-100 group-hover:text-primary-50 transition-colors leading-none">{item.step}</span>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm mb-1">{item.title}</p>
                                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Nearby Complaints Awareness Panel */}
                <div className="card-premium p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <MapPin size={16} className="text-indigo-600" />
                            Nearby Complaints (500m Radius)
                        </h4>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {nearbyComplaints.length} found
                        </span>
                    </div>

                    {nearbyComplaints.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No existing complaints detected within 500 meters of this location.</p>
                    ) : (
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                            {nearbyComplaints.slice(0, 5).map((item) => (
                                <div key={item._id || item.complaintId} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.category}</span>
                                        <span className={`text-[10px] font-extrabold ${item.status === 'Resolved' ? 'text-emerald-600' : item.status === 'In Progress' ? 'text-blue-600' : 'text-amber-600'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                                    <p className="text-[11px] text-slate-400 truncate">{item.formattedAddress || item.location}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-3 card-premium p-8 lg:p-12 relative overflow-hidden">
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8 relative z-10">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Type size={14} className="text-primary-500" />
                                Incident Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="Ex: Large Pothole Near Bus Stop"
                                required
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={14} className="text-secondary-500" />
                                    Main Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={(e) => {
                                        const selectedCatName = e.target.value;
                                        const foundObj = categoriesList.find((c) => c.displayName === selectedCatName || c.id === selectedCatName);
                                        const firstSub = foundObj?.subcategories?.[0]?.displayName || foundObj?.subcategories?.[0]?.id || '';
                                        setFormData((prev) => ({
                                            ...prev,
                                            category: selectedCatName,
                                            subcategory: firstSub,
                                        }));
                                    }}
                                    className="input-field appearance-none cursor-pointer"
                                >
                                    {categoriesList.map((cat) => (
                                        <option key={cat.id} value={cat.displayName}>
                                            {cat.icon || '📁'} {cat.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Filter size={14} className="text-primary-500" />
                                    Subcategory
                                </label>
                                <select
                                    name="subcategory"
                                    value={formData.subcategory}
                                    onChange={handleInputChange}
                                    className="input-field appearance-none cursor-pointer"
                                >
                                    {activeSubcategories.map((sub) => (
                                        <option key={sub.id} value={sub.displayName}>
                                            {sub.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} className="text-primary-500" />
                            Incident Narrative
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="input-field min-h-[140px] py-4"
                            placeholder="Provide a detailed log of the observed issue..."
                            required
                        />
                    </div>

                    {/* Interactive Location Picker Section */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={14} className="text-primary-500" />
                                    Geo-Location Coordinates & Map
                                </label>
                                {gpsAccuracy !== null && (
                                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Target size={12} className="text-emerald-600" />
                                        GPS Fix: ±{gpsAccuracy}m
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleUseMyLocation}
                                disabled={isGeolocating}
                                className="btn-secondary !py-2 !px-4 text-xs font-bold flex items-center gap-2 shadow-sm shrink-0 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                            >
                                {isGeolocating ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin text-primary-600" />
                                        Sampling High-Precision GPS...
                                    </>
                                ) : (
                                    <>
                                        <Crosshair size={14} className="text-primary-600" />
                                        Use My Current Location
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Search Location Bar */}
                        <div className="relative z-[500]">
                            <div className="relative flex items-center">
                                <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search street, landmark, city, or pincode..."
                                    className="input-field pl-11 pr-10"
                                />
                                {isSearching ? (
                                    <Loader2 size={18} className="absolute right-4 text-primary-500 animate-spin" />
                                ) : searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={16} />
                                    </button>
                                ) : null}
                            </div>

                            {/* Dropdown Suggestions */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[500] max-h-60 overflow-y-auto">
                                    {searchResults.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleSelectSearchResult(item)}
                                            className="w-full text-left p-3.5 hover:bg-primary-50 transition-colors border-b border-slate-100 last:border-none flex items-start gap-3"
                                        >
                                            <Compass size={18} className="text-primary-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.parsedLocation.location}</p>
                                                <p className="text-[11px] text-slate-400 line-clamp-1">{item.displayName}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {geoError && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700 flex items-center gap-2">
                                <ShieldAlert size={16} className="shrink-0 text-amber-600" />
                                {geoError}
                            </div>
                        )}

                        {/* Interactive React Leaflet Map */}
                        <LocationPickerMap
                            position={position}
                            onLocationSelect={handleLocationSelect}
                            nearbyComplaints={nearbyComplaints}
                            height="380px"
                        />

                        {/* Formatted Address & Coordinates Preview */}
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Formatted Location Address</label>
                                    <span className="text-[10px] font-bold text-slate-400 italic">Drag pin on map to fine-tune exact spot</span>
                                </div>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className="input-field bg-white py-2 text-xs font-semibold"
                                    placeholder="Location description"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                                <div className="p-2 bg-white rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block font-bold">Latitude</span>
                                    <span className="font-mono text-slate-700">{position?.lat?.toFixed(6) || 'N/A'}</span>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block font-bold">Longitude</span>
                                    <span className="font-mono text-slate-700">{position?.lng?.toFixed(6) || 'N/A'}</span>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block font-bold">Locality</span>
                                    <span className="text-slate-700 truncate block">{geoDetails?.locality || 'N/A'}</span>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-100">
                                    <span className="text-slate-400 block font-bold">City / State</span>
                                    <span className="text-slate-700 truncate block">
                                        {geoDetails?.city ? `${geoDetails.city}, ${geoDetails.state || ''}` : (geoDetails?.state || 'N/A')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload Zone */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ImageIcon size={14} className="text-secondary-500" />
                            Evidence Media Payload (Cloud Storage)
                        </label>

                        {!imagePreview ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer ${isDragging
                                        ? 'border-primary-500 bg-primary-50/50 scale-[1.01]'
                                        : 'border-slate-200 hover:border-primary-400 bg-slate-50/50 hover:bg-white'
                                    }`}
                            >
                                <input
                                    type="file"
                                    id="image-file-input"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />
                                <label htmlFor="image-file-input" className="cursor-pointer flex flex-col items-center">
                                    <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                        <UploadCloud size={32} />
                                    </div>
                                    <p className="text-sm font-black text-slate-800 mb-1">
                                        Click to upload or drag & drop evidence image
                                    </p>
                                    <p className="text-xs font-semibold text-slate-400">
                                        Supports JPG, JPEG, PNG, WEBP (Max 5 MB)
                                    </p>
                                </label>
                            </div>
                        ) : (
                            <div className="relative rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-50 p-4 flex items-center gap-6">
                                <img
                                    src={imagePreview}
                                    alt="Selected Preview"
                                    className="w-24 h-24 object-cover rounded-2xl shadow-md border border-white"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileCheck size={18} className="text-green-500 shrink-0" />
                                        <p className="text-sm font-black text-slate-900 truncate">
                                            {selectedFile?.name || 'Selected Image'}
                                        </p>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400">
                                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Cloud Transmission
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="p-3 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-slate-100 mr-2"
                                    title="Remove Selected Image"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 btn-primary group/btn !rounded-[2rem]"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin font-semibold flex items-center justify-center">
                                Checking...
                            </div>
                        ) : (
                            <>
                                Confirm Transmission
                                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Shimmer on bottom */}
                {loading && <div className="absolute bottom-0 left-0 w-full h-1 shimmer"></div>}
            </div>
        </div>
    );
};

export default SubmitComplaint;
