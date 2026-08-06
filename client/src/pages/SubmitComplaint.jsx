import React, { useState } from 'react';
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
    FileCheck
} from 'lucide-react';
import api from '../api';

const SubmitComplaint = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Garbage',
        location: '',
        imageUrl: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const [loading, setLoading] = useState(false);
    const [submittedId, setSubmittedId] = useState(null);
    const [copied, setCopied] = useState(false);

    const categories = [
        { name: 'Garbage', icon: '🗑️' },
        { name: 'Road Damage', icon: '🛣️' },
        { name: 'Water Leakage', icon: '💧' },
        { name: 'Electricity', icon: '⚡' },
        { name: 'Street Light', icon: '💡' },
        { name: 'Other', icon: '📁' }
    ];

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = new FormData();
            payload.append('title', formData.title);
            payload.append('description', formData.description);
            payload.append('category', formData.category);
            payload.append('location', formData.location);

            if (selectedFile) {
                payload.append('image', selectedFile);
            } else if (formData.imageUrl) {
                payload.append('imageUrl', formData.imageUrl);
            }

            const { data } = await api.post('/complaints', payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setSubmittedId(data.complaintId);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Transmission Error: Deployment failed. Please try again.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
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
                            Our platform automatically categorizes your reports, secures media uploads, and routes issues to the municipal response team.
                        </p>
                        <div className="space-y-3">
                            {['Cloudinary Media Encryption', 'Automatic Geolocation Tagging', 'Priority Node Routing'].map((t, i) => (
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
                            { step: '02', title: 'Geo-Location', desc: 'Precise coordinates or physical address of the event.' },
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
            </div>

            {/* Main Form */}
            <div className="lg:col-span-3 card-premium p-8 lg:p-12 relative overflow-hidden">
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
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
                                placeholder="Ex: Main Road Maintenance Required"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} className="text-secondary-500" />
                                System Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="input-field appearance-none cursor-pointer"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.name} value={cat.name}>
                                        {cat.icon} {cat.name} Tier
                                    </option>
                                ))}
                            </select>
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

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={14} className="text-primary-500" />
                            Geo-Location Coordinates
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="Ex: Sector 4, Civic Center Block A"
                            required
                        />
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
                                className={`border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer ${
                                    isDragging
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
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
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
