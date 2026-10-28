import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertCircle, MapPin } from 'lucide-react';

// Custom SVG Leaflet DivIcons to prevent default asset bundling issues in Vite/React
const createSelectedPinIcon = () => {
    return L.divIcon({
        className: 'custom-selected-pin',
        html: `
            <div class="relative flex items-center justify-center w-10 h-10 -translate-x-1/2 -translate-y-full">
                <span class="absolute w-10 h-10 bg-primary-500/30 rounded-full animate-ping"></span>
                <div class="relative w-9 h-9 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>
                <div class="absolute -bottom-1 w-2 h-2 bg-indigo-700 rotate-45"></div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
    });
};

const createComplaintStatusIcon = (status) => {
    let colorClass = 'bg-amber-500 border-amber-200 text-white';

    if (status === 'In Progress') {
        colorClass = 'bg-blue-600 border-blue-200 text-white';
    } else if (status === 'Resolved') {
        colorClass = 'bg-emerald-500 border-emerald-200 text-white';
    }

    return L.divIcon({
        className: 'custom-complaint-pin',
        html: `
            <div class="relative flex items-center justify-center w-7 h-7 -translate-x-1/2 -translate-y-full group cursor-pointer">
                <div class="w-7 h-7 ${colorClass} rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-125">
                    <div class="w-2 h-2 rounded-full bg-white"></div>
                </div>
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    });
};

// Component to handle map clicks and move selected pin
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Component to programmatically re-center map view when coordinates change
const MapRecenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center.lat && center.lng) {
            map.flyTo([center.lat, center.lng], map.getZoom() || 15, {
                duration: 1.2,
            });
        }
    }, [center, map]);
    return null;
};

const LocationPickerMap = ({
    position,
    onLocationSelect,
    nearbyComplaints = [],
    height = '380px',
}) => {
    const defaultCenter = position || { lat: 28.6139, lng: 77.2090 }; // Default New Delhi center
    const [tileError, setTileError] = useState(false);

    const handleTileError = useCallback(() => {
        setTileError(true);
    }, []);

    const handleDragEnd = (e) => {
        const marker = e.target;
        const latLng = marker.getLatLng();
        onLocationSelect(latLng.lat, latLng.lng);
    };

    // Deduplicate nearby complaints and generate stable unique string keys
    const validComplaints = useMemo(() => {
        if (!Array.isArray(nearbyComplaints)) return [];
        const seenKeys = new Set();
        const result = [];

        nearbyComplaints.forEach((complaint, index) => {
            if (!complaint || typeof complaint !== 'object') return;

            const lat =
                complaint.latitude ||
                (complaint.locationPoint && complaint.locationPoint.coordinates?.[1]);
            const lng =
                complaint.longitude ||
                (complaint.locationPoint && complaint.locationPoint.coordinates?.[0]);

            if (lat === undefined || lat === null || lng === undefined || lng === null) return;
            const numLat = Number(lat);
            const numLng = Number(lng);
            if (isNaN(numLat) || isNaN(numLng)) return;

            // Extract a clean string key (preventing [object Object] or undefined)
            let key = '';
            if (typeof complaint._id === 'string' && complaint._id.trim()) {
                key = complaint._id.trim();
            } else if (typeof complaint._id === 'number') {
                key = String(complaint._id);
            } else if (typeof complaint._id === 'object' && complaint._id !== null) {
                key = complaint._id.$oid || (typeof complaint._id.toString === 'function' && complaint._id.toString() !== '[object Object]' ? complaint._id.toString() : '');
            }

            if (!key && typeof complaint.complaintId === 'string' && complaint.complaintId.trim()) {
                key = complaint.complaintId.trim();
            } else if (!key && typeof complaint.id === 'string' && complaint.id.trim()) {
                key = complaint.id.trim();
            }

            if (!key) {
                key = `complaint-loc-${numLat.toFixed(5)}-${numLng.toFixed(5)}-${index}`;
            }

            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                result.push({ complaint, lat: numLat, lng: numLng, key });
            }
        });

        return result;
    }, [nearbyComplaints]);

    return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-slate-50">
            <MapContainer
                center={[defaultCenter.lat, defaultCenter.lng]}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: height, width: '100%', zIndex: 1 }}
                className="rounded-2xl"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    subdomains={['a', 'b', 'c']}
                    maxZoom={19}
                    eventHandlers={{ tileerror: handleTileError }}
                />

                {/* Recenter helper */}
                <MapRecenter center={position} />

                {/* Click listener */}
                <MapClickHandler onLocationSelect={onLocationSelect} />

                {/* Selected Location Draggable Pin */}
                {position && position.lat && position.lng && (
                    <React.Fragment key={`selected-location-${position.lat}-${position.lng}`}>
                        <Marker
                            position={[position.lat, position.lng]}
                            draggable={true}
                            eventHandlers={{ dragend: handleDragEnd }}
                            icon={createSelectedPinIcon()}
                        >
                            <Popup className="rounded-xl shadow-lg">
                                <div className="p-1">
                                    <p className="text-xs font-black uppercase text-primary-600 tracking-wider mb-1 flex items-center gap-1">
                                        <MapPin size={12} /> Target Incident Location
                                    </p>
                                    <p className="text-xs font-semibold text-slate-700">
                                        Drag pin or click anywhere on the map to re-position.
                                    </p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Visual 500 Meter Nearby Radius Circle */}
                        <Circle
                            center={[position.lat, position.lng]}
                            radius={500}
                            pathOptions={{
                                color: '#4f46e5',
                                fillColor: '#6366f1',
                                fillOpacity: 0.12,
                                weight: 2,
                                dashArray: '6, 6',
                            }}
                        />
                    </React.Fragment>
                )}

                {/* Render Deduplicated Nearby Complaint Markers */}
                {validComplaints.map(({ complaint, lat, lng, key }) => (
                    <Marker
                        key={key}
                        position={[lat, lng]}
                        icon={createComplaintStatusIcon(complaint.status)}
                    >
                        <Popup className="rounded-2xl shadow-xl">
                            <div className="p-2 max-w-xs">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {complaint.category || 'Incident'}
                                    </span>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            complaint.status === 'Resolved'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : complaint.status === 'In Progress'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {complaint.status}
                                    </span>
                                </div>
                                <h5 className="font-bold text-sm text-slate-900 leading-tight mb-1">
                                    {complaint.title}
                                </h5>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                    {complaint.description}
                                </p>
                                <div className="text-[10px] text-slate-400 font-medium">
                                    {complaint.formattedAddress || complaint.location || 'Nearby Location'}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Map Info Overlay Header */}
            <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Resolved</span>
                </div>
            </div>

            {/* Tile Error / Timeout Banner Notification */}
            {tileError && (
                <div className="absolute bottom-3 left-3 right-3 z-[400] bg-amber-500/95 text-white backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-400/80 shadow-lg flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0 text-white" />
                        <span>Map tiles taking long to load. Pin selection, GPS & address search remain fully functional.</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setTileError(false)}
                        className="text-amber-100 hover:text-white ml-2 text-xs font-bold underline shrink-0"
                    >
                        Dismiss
                    </button>
                </div>
            )}
        </div>
    );
};

export default LocationPickerMap;

