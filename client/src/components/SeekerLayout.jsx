import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { getSocket } from '../utils/socket';
import {
  Briefcase, LayoutDashboard, FileText, User,
  Settings, LogOut, Building2, Menu, X, Bell, Calendar,
  CheckCircle, Info, Clock, XCircle, MessageSquare
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const statusIcon = (status) => {
  switch (status) {
    case 'hired':     return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
    case 'interview': return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    case 'rejected':  return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
    default:          return <Clock className="h-4 w-4 text-amber-400 shrink-0" />;
  }
};

const SeekerLayout = ({ children, profile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef();

  const unreadCount = notifications.filter(n => !n.read).length;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  useEffect(() => {
    if (!user?.token) return;
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${API}/notifications`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
  }, [user?.token]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleStatusUpdate = (data) => {
      const newNotif = {
        _id: Date.now().toString(),
        message: `Your application status changed to ${data.status}`,
        jobTitle: data.jobTitle,
        status: data.status,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    };
    socket.on('status_update', handleStatusUpdate);
    return () => socket?.off('status_update', handleStatusUpdate);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleBellOpen = async () => {
    setBellOpen(prev => !prev);
    if (!bellOpen && unreadCount > 0) {
      try {
        await axios.put(`${API}/notifications/read-all`, {}, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error('Failed to mark notifications as read', err);
      }
    }
  };

  const navLinks = [
    { to: '/seeker/dashboard',  icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { to: '/jobs',              icon: <Briefcase className="h-5 w-5" />,       label: 'Find Jobs' },
    { to: '/companies',         icon: <Building2 className="h-5 w-5" />,       label: 'Companies' },
    { to: '/applications',      icon: <FileText className="h-5 w-5" />,        label: 'My Applications' },
    { to: '/seeker/interviews', icon: <Calendar className="h-5 w-5" />,        label: 'Interviews' },
    { to: '/messages',          icon: <MessageSquare className="h-5 w-5" />,   label: 'Messages' },
    { to: '/seeker/profile',    icon: <User className="h-5 w-5" />,            label: 'My Profile' },
    { to: '/seeker/settings',   icon: <Settings className="h-5 w-5" />,        label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-dark-bg text-dark-primary">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-dark-border bg-dark-sidebar transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 border-b border-dark-border px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-500">
            <Briefcase className="h-5 w-5 text-dark-bg" />
          </div>
          <span className="text-xl font-bold text-lime-500">JobHub</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-lime-500/20 text-lime-500'
                  : 'text-dark-secondary hover:bg-dark-card hover:text-dark-primary'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-dark-secondary transition-colors hover:bg-dark-card hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>

        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute right-4 top-4 text-dark-secondary lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header — z-40 so it sits above page content but below mobile sidebar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-dark-border bg-dark-card px-4 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-dark-secondary">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-lime-500">
                <Briefcase className="h-4 w-4 text-dark-bg" />
              </div>
              <span className="text-lg font-bold text-lime-500">JobHub</span>
            </div>
          </div>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {/* Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={handleBellOpen}
                className="relative rounded-lg p-2 text-dark-secondary transition-colors hover:text-lime-500"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-lime-500 text-[9px] font-bold text-dark-bg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-11 w-80 rounded-xl border border-dark-border bg-dark-card shadow-xl z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
                    <p className="text-sm font-semibold text-dark-primary">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="text-xs text-lime-500 font-medium">{unreadCount} unread</span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-dark-border">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-8 w-8 text-dark-secondary/30 mx-auto mb-2" />
                        <p className="text-xs text-dark-secondary">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id}
                          className={`flex items-start gap-3 px-4 py-3 transition hover:bg-dark-bg ${!n.read ? 'bg-lime-500/10' : ''}`}
                        >
                          {statusIcon(n.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-dark-primary truncate">{n.jobTitle || 'Job Update'}</p>
                            <p className="text-xs text-dark-secondary mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-dark-secondary/60 mt-1">
                              {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-lime-500 shrink-0 mt-1" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden h-8 w-px bg-dark-border md:block" />

            <button
              onClick={() => navigate('/seeker/profile')}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-dark-card"
            >
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-lime-500/30" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-lime-500/30 bg-lime-500/10 text-sm font-bold text-lime-500">
                  {initials}
                </div>
              )}
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold text-dark-primary">{user?.name}</p>
                <p className="text-xs text-dark-secondary">Job Seeker</p>
              </div>
            </button>
          </div>
        </header>

       <main className="flex-1 bg-dark-bg p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SeekerLayout;