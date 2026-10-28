import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Bell, Search as SearchIcon } from 'lucide-react';

import NotificationBell from './NotificationBell';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/citizen-dashboard') return 'Overview';
        if (path === '/submit') return 'Report Incident';
        if (path === '/track') return 'Tracking Vault';
        if (path === '/admin-dashboard') return 'Command Center';
        if (path === '/admin/manage') return 'Incident Vault';
        if (path === '/profile') return 'Identity Node';
        if (path.includes('/admin/complaint/')) return 'Incident Detailed Analysis';
        return 'SmartCity Portal';
    };

    return (
        <div className="flex min-h-screen font-sans selection:bg-primary-100 selection:text-primary-700">
            <Sidebar
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <div className="flex-1 lg:ml-72 bg-slate-50/50 transition-all duration-500">
                <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 lg:px-10 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2.5 lg:hidden text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={22} />
                        </button>
                        <h1 className="text-xl font-extrabold text-slate-900 font-display hidden sm:block">
                            {getPageTitle()}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Universal Search..."
                                className="bg-slate-100/50 border-none rounded-2xl pl-11 pr-4 py-2.5 text-sm w-64 focus:ring-2 focus:ring-primary-500/20 transition-all focus:bg-white focus:shadow-sm"
                            />
                        </div>
                        <NotificationBell />
                        <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden sm:block"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:block">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </header>

                <main className="p-6 lg:p-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
