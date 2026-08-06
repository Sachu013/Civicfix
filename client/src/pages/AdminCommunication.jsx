import React, { useState, useEffect } from 'react';
import {
    Megaphone,
    Bell,
    ShieldAlert,
    MessageSquare,
    Send,
    Plus,
    Trash2,
    Calendar,
    MapPin,
    AlertTriangle,
    CheckCircle,
    Info,
    Loader2,
    Star
} from 'lucide-react';
import api from '../api';

const AdminCommunication = () => {
    const [alerts, setAlerts] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('alerts');

    // Form States
    const [alertForm, setAlertForm] = useState({ title: '', description: '', type: 'Info', severity: 'Moderate', area: '' });
    const [newsForm, setNewsForm] = useState({ title: '', content: '', category: 'General' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [alertsRes, newsRes, feedbackRes] = await Promise.all([
                api.get('/alerts'),
                api.get('/announcements'),
                api.get('/feedback')
            ]);
            setAlerts(alertsRes.data);
            setAnnouncements(newsRes.data);
            setFeedback(feedbackRes.data);
        } catch (error) {
            // Ignore fetch errors
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePostAlert = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/alerts', alertForm);
            setAlertForm({ title: '', description: '', type: 'Info', severity: 'Moderate', area: '' });
            fetchData();
        } catch (error) {
            alert('Failed to post alert');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePostNews = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/announcements', newsForm);
            setNewsForm({ title: '', content: '', category: 'General' });
            fetchData();
        } catch (error) {
            alert('Failed to post announcement');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-500" size={48} />
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight uppercase italic">Broadcast <span className="text-primary-600">Center</span></h1>
                    <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">City Communications & Public Sentiment Analysis</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                    <button onClick={() => setActiveTab('alerts')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'alerts' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400'}`}>Alerts</button>
                    <button onClick={() => setActiveTab('news')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'news' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400'}`}>News</button>
                    <button onClick={() => setActiveTab('feedback')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'feedback' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400'}`}>Feedback</button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Creation Panel */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="card-premium p-8">
                        {activeTab === 'alerts' ? (
                            <form onSubmit={handlePostAlert} className="space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><ShieldAlert size={20} /></div>
                                    <h3 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight">Deploy Alert</h3>
                                </div>
                                <div className="space-y-4">
                                    <input type="text" placeholder="ALERT TITLE" className="input-field" value={alertForm.title} onChange={e => setAlertForm({ ...alertForm, title: e.target.value })} required />
                                    <textarea placeholder="ALERT DESCRIPTION" className="input-field h-32" value={alertForm.description} onChange={e => setAlertForm({ ...alertForm, description: e.target.value })} required />
                                    <input type="text" placeholder="AFFECTED AREA (E.G. SECTOR 4)" className="input-field" value={alertForm.area} onChange={e => setAlertForm({ ...alertForm, area: e.target.value })} required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <select className="input-field" value={alertForm.type} onChange={e => setAlertForm({ ...alertForm, type: e.target.value })}>
                                            <option value="Emergency">EMERGENCY</option>
                                            <option value="Warning">WARNING</option>
                                            <option value="Info">INFO</option>
                                        </select>
                                        <select className="input-field" value={alertForm.severity} onChange={e => setAlertForm({ ...alertForm, severity: e.target.value })}>
                                            <option value="Critical">CRITICAL</option>
                                            <option value="Moderate">MODERATE</option>
                                            <option value="Low">LOW</option>
                                        </select>
                                    </div>
                                    <button type="submit" disabled={submitting} className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={16} /> Broadcast Alert</>}
                                    </button>
                                </div>
                            </form>
                        ) : activeTab === 'news' ? (
                            <form onSubmit={handlePostNews} className="space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center"><Megaphone size={20} /></div>
                                    <h3 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight">Post Announcement</h3>
                                </div>
                                <div className="space-y-4">
                                    <input type="text" placeholder="NEWS TITLE" className="input-field" value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} required />
                                    <textarea placeholder="CONTENT" className="input-field h-32" value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} required />
                                    <select className="input-field" value={newsForm.category} onChange={e => setNewsForm({ ...newsForm, category: e.target.value })}>
                                        <option value="General">GENERAL</option>
                                        <option value="Event">EVENT</option>
                                        <option value="Policy">POLICY</option>
                                        <option value="Public Service">PUBLIC SERVICE</option>
                                    </select>
                                    <button type="submit" disabled={submitting} className="w-full h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={16} /> Publish News</>}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Star size={20} /></div>
                                    <h3 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight">Sentiment Overview</h3>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-5xl font-black text-slate-900 mb-2">{(feedback.reduce((acc, f) => acc + f.rating, 0) / (feedback.length || 1)).toFixed(1)}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Public Rating</p>
                                </div>
                                <div className="space-y-3">
                                    {['App Experience', 'City Services', 'Infrastructure'].map(cat => {
                                        const count = feedback.filter(f => f.category === cat).length;
                                        return (
                                            <div key={cat} className="flex justify-between items-center px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{cat}</span>
                                                <span className="text-xs font-black text-slate-900">{count} reports</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* List Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'alerts' && alerts.map(alert => (
                        <div key={alert._id} className="card-premium p-8 border-l-8 border-l-rose-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${alert.severity === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>{alert.severity}</span>
                                    <h4 className="text-xl font-black text-slate-900 mt-2 font-display">{alert.title}</h4>
                                </div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{new Date(alert.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-600 font-medium mb-6">{alert.description}</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <MapPin size={14} className="text-primary-500" />
                                {alert.area}
                            </div>
                        </div>
                    ))}

                    {activeTab === 'news' && announcements.map(news => (
                        <div key={news._id} className="card-premium p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{news.category}</span>
                                    <h4 className="text-xl font-black text-slate-900 mt-2 font-display">{news.title}</h4>
                                </div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{new Date(news.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-600 font-medium">{news.content}</p>
                        </div>
                    ))}

                    {activeTab === 'feedback' && feedback.map(f => (
                        <div key={f._id} className="card-premium p-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary-600 font-black">
                                    {f.rating}★
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 font-display">{f.user?.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{f.category}</p>
                                </div>
                                <span className="ml-auto text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{new Date(f.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-600 font-medium italic">"{f.comment}"</p>
                        </div>
                    ))}

                    {((activeTab === 'alerts' && alerts.length === 0) || (activeTab === 'news' && announcements.length === 0) || (activeTab === 'feedback' && feedback.length === 0)) && (
                        <div className="py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <Bell size={48} className="mb-4 opacity-20" />
                            <p className="font-black uppercase tracking-widest text-xs">No entries found in this sector</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCommunication;
