import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';

// Custom marker icons
const createCustomIcon = (color = '#0ea5e9') => {
    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    });
};

const AnalyticsMap = ({ complaints = [], hotspots = [], center = [28.6139, 77.2090], zoom = 12 }) => {
    return (
        <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-inner border border-slate-200 relative z-0">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Individual Complaint Markers */}
                {complaints.map((c) => {
                    if (!c.latitude || !c.longitude) return null;
                    const color = c.status === 'Resolved' || c.status === 'Closed' ? '#10b981' :
                                  c.priority === 'Critical' ? '#ef4444' :
                                  c.priority === 'High' ? '#f59e0b' : '#0ea5e9';

                    return (
                        <Marker
                            key={c._id || c.complaintId}
                            position={[c.latitude, c.longitude]}
                            icon={createCustomIcon(color)}
                        >
                            <Popup className="custom-leaflet-popup">
                                <div className="p-2 space-y-1 max-w-xs text-slate-800">
                                    <span className="text-[9px] font-black uppercase text-primary-600 tracking-wider">#{c.complaintId}</span>
                                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{c.title}</h4>
                                    <p className="text-[10px] text-slate-500 font-semibold">{c.category} • {c.subcategory || 'General'}</p>
                                    <div className="flex items-center justify-between text-[9px] font-mono border-t pt-1 mt-1">
                                        <span className="font-bold">{c.assignedDepartment || 'General'}</span>
                                        <span className={`font-black uppercase px-1.5 py-0.5 rounded ${
                                            c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {c.status}
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Hotspot Cluster Overlays */}
                {hotspots.map((hs, idx) => (
                    <Circle
                        key={hs.hotspotId || idx}
                        center={[hs.center.latitude, hs.center.longitude]}
                        radius={Math.min(1500, 500 + hs.complaintCount * 100)}
                        pathOptions={{
                            color: hs.criticalCount > 0 ? '#ef4444' : '#f59e0b',
                            fillColor: hs.criticalCount > 0 ? '#ef4444' : '#f59e0b',
                            fillOpacity: 0.35,
                            weight: 2,
                        }}
                    >
                        <Popup>
                            <div className="p-3 space-y-2 max-w-xs text-slate-900">
                                <div className="flex items-center gap-1.5 border-b pb-1">
                                    <AlertTriangle size={14} className="text-red-500" />
                                    <h4 className="font-black text-xs uppercase tracking-tight">Geospatial Hotspot Cluster</h4>
                                </div>

                                <div className="space-y-1 text-[11px]">
                                    <p className="font-bold text-slate-800">
                                        Density: <span className="text-red-600 font-black">{hs.complaintCount} Complaints</span>
                                    </p>
                                    <p className="text-slate-600 font-semibold">
                                        Dominant Issue: <span className="text-slate-900 font-bold">{hs.dominantCategory}</span>
                                    </p>
                                    {hs.criticalCount > 0 && (
                                        <p className="text-red-600 font-bold text-[10px]">
                                            ⚠️ {hs.criticalCount} Critical Priority Complaints
                                        </p>
                                    )}
                                    {hs.slaBreachedCount > 0 && (
                                        <p className="text-amber-600 font-bold text-[10px]">
                                            🚨 {hs.slaBreachedCount} SLA Breaches in this sector
                                        </p>
                                    )}
                                </div>

                                {hs.affectedDepartments && hs.affectedDepartments.length > 0 && (
                                    <div className="border-t pt-1 text-[9px] text-slate-500">
                                        <span className="font-bold block uppercase text-[8px]">Departments:</span>
                                        {hs.affectedDepartments.join(', ')}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Circle>
                ))}
            </MapContainer>
        </div>
    );
};

export default AnalyticsMap;
