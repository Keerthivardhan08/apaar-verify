import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications, useMarkNotificationRead } from '../../hooks/useApi';
import { Bell, User, LogOut, CheckCheck, Shield, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';

export const Header: React.FC = () => {
  const { user, logout, isAICTEAdmin, isInstitutionAdmin, isInstitutionOperator } = useAuth();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const roleLabel = isAICTEAdmin()
    ? 'AICTE National Admin'
    : isInstitutionAdmin()
    ? 'Institution Admin'
    : isInstitutionOperator()
    ? 'Institution Operator'
    : 'Platform User';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Organization / Workspace indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isAICTEAdmin() ? (
              <span className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
                <Shield className="w-3.5 h-3.5" />
                <span>AICTE Central Command</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <Building2 className="w-3.5 h-3.5" />
                <span>Institution Portal</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Public Verification Link */}
          <Link
            to="/verify"
            className="hidden sm:inline-flex items-center text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50/60 hover:bg-indigo-100/60 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
          >
            Credential Verifier
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-indigo-600 font-medium">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition-colors ${
                          !n.read_at ? 'bg-indigo-50/30' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-semibold text-gray-900">{n.title}</p>
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
                        <p className="text-gray-600 mt-1">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
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
              className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-gray-900 leading-tight">
                  {user?.full_name || 'Authenticated User'}
                </span>
                <span className="text-[11px] text-gray-500">{roleLabel}</span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.full_name || 'APAAR Officer'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
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
