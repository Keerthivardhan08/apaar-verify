import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications, useMarkNotificationRead } from '../../hooks/useApi';
import { Bell, User, LogOut, CheckCheck, Shield, Building2, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';

export const Header: React.FC = () => {
  const { user, logout, isAICTEAdmin, isReviewer, isInstitutionAdmin, isInstitutionOperator } = useAuth();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const isAicteStaff = isAICTEAdmin() || isReviewer();

  const roleLabel = isAICTEAdmin()
    ? 'AICTE National Admin'
    : isReviewer()
    ? 'AICTE Compliance Reviewer'
    : isInstitutionAdmin()
    ? 'Institution Admin'
    : isInstitutionOperator()
    ? 'Institution Operator'
    : 'Platform User';

  return (
    <header className="liquid-glass-subtle sticky top-0 z-30 border-b border-white/60 shadow-xs backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Organization / Workspace indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isAicteStaff ? (
              <span className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50/80 border border-indigo-200/60 px-3 py-1 rounded-xl shadow-xs">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>AICTE Central Command</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-3 py-1 rounded-xl shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Institution Node Portal</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Public Verification Link (Institutional Portal only) */}
          {!isAicteStaff && (
            <Link
              to="/verify"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white/70 hover:bg-white px-3 py-1.5 rounded-xl border border-indigo-200/80 shadow-xs transition-all duration-200"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Public Verifier</span>
            </Link>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-white/60 rounded-xl transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 liquid-glass rounded-2xl shadow-xl border border-white/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-200/50 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100/60">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition-colors ${
                          !n.read_at ? 'bg-indigo-50/50' : 'hover:bg-white/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-bold text-slate-900">{n.title}</p>
                          {!n.read_at && (
                            <button
                              onClick={() => markRead.mutate(n.id)}
                              className="text-indigo-600 hover:text-indigo-800 p-0.5"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-white/60 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-400/40">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.full_name || 'Authenticated User'}
                </span>
                <span className="text-[11px] text-slate-500">{roleLabel}</span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 liquid-glass rounded-2xl shadow-xl border border-white/80 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-200/50">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user?.full_name || 'APAAR Officer'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-2">
                    <Badge variant="primary" size="sm">
                      {roleLabel}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50/60 flex items-center space-x-2 transition-colors rounded-lg mx-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
