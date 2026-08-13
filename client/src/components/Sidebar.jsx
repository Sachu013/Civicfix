import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    PlusCircle,
    Search,
    LogOut,
    User,
    Menu,
    X,
    FileText,
    Home,
    ShieldCheck,
    LifeBuoy,
    ChevronRight,
    Megaphone,
    BarChart3
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { userInfo, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const citizenLinks = [
        { name: 'Overview', path: '/citizen-dashboard', icon: Home },
        { name: 'Report Issue', path: '/submit', icon: PlusCircle },
        { name: 'Track Status', path: '/track', icon: Search },
        { name: 'Identity Node', path: '/profile', icon: User },
    ];

    const adminLinks = [
        { name: 'Admin Insights', path: '/admin-dashboard', icon: LayoutDashboard },
        { name: 'Civic Analytics', path: '/admin/analytics', icon: BarChart3 },
        { name: 'Manage Vault', path: '/admin/manage', icon: FileText },
        { name: 'Broadcast Node', path: '/admin/communication', icon: Megaphone },
    ];

    const deptHeadLinks = [
        { name: 'Dept Dashboard', path: '/department/dashboard', icon: LayoutDashboard },
        { name: 'Department Queue', path: '/admin/manage', icon: FileText },
    ];

    const deptStaffLinks = [
        { name: 'Staff Workspace', path: '/staff/dashboard', icon: LayoutDashboard },
    ];

    const isAdminRole = ['admin', 'super_admin', 'department_head', 'department_staff'].includes(userInfo?.role);
    const links = isAdminRole ? adminLinks : citizenLinks;

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={toggleSidebar}
                />
            )}

            <aside className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-100 z-50 transition-all duration-500 lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                <div className="p-8">
                    <Link to={userInfo?.role === 'admin' ? '/admin-dashboard' : '/citizen-dashboard'} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200 group-hover:rotate-12 transition-transform">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-extrabold font-display tracking-tight text-slate-900">
                                SmartCity
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                Gov Portal
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="px-6 space-y-8 mt-4">
                    <div>
                        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
                        <nav className="space-y-1.5">
                            {links.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all duration-300 ${location.pathname === link.path
                                        ? 'bg-primary-600 text-white shadow-xl shadow-primary-200 translate-x-1'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    onClick={() => isOpen && toggleSidebar()}
                                >
                                    <div className="flex items-center gap-3">
                                        <link.icon size={20} className={location.pathname === link.path ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'} />
                                        <span className="font-semibold">{link.name}</span>
                                    </div>
                                    {location.pathname === link.path && <ChevronRight size={16} className="opacity-60" />}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div>
                        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Help & Support</p>
                        <nav className="space-y-1.5">
                            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-all font-semibold">
                                <LifeBuoy size={20} className="text-slate-400" />
                                Help Center
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="absolute bottom-8 left-0 w-full px-6">
                    <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 mb-4 group relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-primary-100 rounded-full opacity-50 group-hover:scale-150 transition-transform"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600 ring-4 ring-slate-100/50">
                                <User size={22} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-slate-900 truncate text-sm">{userInfo?.name || 'Guest'}</p>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${userInfo ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                    <p className="text-[10px] font-bold text-slate-400 capitalize -mt-0.5">{userInfo?.role || 'Visitor'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {userInfo && (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
                        >
                            <LogOut size={20} />
                            Terminate Session
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
