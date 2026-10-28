import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    CheckCheck,
    Clock,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    MessageSquare,
    ExternalLink,
    Loader2
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
    const { userInfo } = useAuth();
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchUnreadCount = async () => {
        if (!userInfo?.token) return;
        try {
            const { data } = await api.get('/notifications/unread-count');
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to fetch unread notification count:', err);
        }
    };

    const fetchNotifications = async () => {
        if (!userInfo?.token) return;
        setLoading(true);
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, [userInfo]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        // Mark read
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif._id}/read`);
                setNotifications((prev) =>
                    prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (err) {
                console.error('Failed to mark notification read:', err);
            }
        }

        setIsOpen(false);

        // Navigation logic based on role & complaint
        const complaintTargetId = notif.complaint?._id || notif.complaintId || notif.complaint;
        if (!complaintTargetId) return;

        const role = userInfo?.role;
        if (role === 'citizen') {
            navigate(`/track`);
        } else {
            navigate(`/admin/complaint/${complaintTargetId}`);
        }
    };

    const getPriorityBadge = (priority) => {
        if (priority === 'urgent') return 'bg-red-500 text-white';
        if (priority === 'high') return 'bg-amber-500 text-white';
        return 'bg-blue-500 text-white';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className="p-2.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all relative"
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black text-white bg-red-600 rounded-full border-2 border-white min-w-[18px] h-[18px] leading-none animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell size={18} className="text-primary-400" />
                            <h3 className="text-sm font-black uppercase tracking-wider italic">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-primary-600 text-white rounded-full text-[10px] font-black font-mono">
                                    {unreadCount} Unread
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-black text-slate-300 hover:text-white uppercase flex items-center gap-1 transition-colors"
                            >
                                <CheckCheck size={14} />
                                <span>Mark all read</span>
                            </button>
                        )}
                    </div>

                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                        {loading ? (
                            <div className="py-10 text-center">
                                <Loader2 className="animate-spin text-primary-500 mx-auto" size={24} />
                                <span className="text-xs text-slate-400 font-semibold mt-2 block">Loading updates...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 space-y-2">
                                <Bell size={32} className="mx-auto text-slate-300 opacity-60" />
                                <p className="text-xs font-bold italic">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 relative ${
                                        !n.isRead ? 'bg-primary-50/30' : ''
                                    }`}
                                >
                                    {!n.isRead && (
                                        <span className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 shrink-0"></span>
                                    )}

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-extrabold text-xs text-slate-900 leading-tight">
                                                {n.title}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                                            {n.message}
                                        </p>

                                        {n.complaintId && (
                                            <div className="flex items-center gap-1.5 pt-1">
                                                <span className="text-[9px] font-mono font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                                    #{n.complaintId}
                                                </span>
                                                {n.departmentCode && (
                                                    <span className="text-[9px] font-mono text-slate-400">
                                                        • {n.departmentCode}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
