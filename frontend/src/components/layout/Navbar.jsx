'use client';

import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ title, breadcrumbs }) {
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const logout = useAuthStore((state) => state.logout);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border-custom bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
        {/* Left Side - Menu Button & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-primary hover:bg-background-custom md:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            {breadcrumbs && (
              <div className="flex gap-2 text-xs text-text-secondary">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <span>/</span>}
                    <span>{crumb}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Icons & Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-primary hover:bg-background-custom"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border-custom bg-white shadow-lg">
                <div className="border-b border-border-custom p-4">
                  <h3 className="font-bold text-text-primary">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-2 p-4">
                    <div className="rounded-lg bg-[var(--color-info-bg)] p-3">
                      <p className="text-sm font-medium text-text-primary">
                        New loan approval requested
                      </p>
                      <p className="text-xs text-text-secondary">2 minutes ago</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-warning-bg)] p-3">
                      <p className="text-sm font-medium text-text-primary">
                        Payment due reminder
                      </p>
                      <p className="text-xs text-text-secondary">1 hour ago</p>
                    </div>
                    <div className="rounded-lg bg-[var(--color-success-bg)] p-3">
                      <p className="text-sm font-medium text-text-primary">
                        Expense approval completed
                      </p>
                      <p className="text-xs text-text-secondary">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="rounded-lg p-2 text-primary hover:bg-background-custom"
            >
              <User className="h-6 w-6" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border-custom bg-white shadow-lg">
                <div className="space-y-1 p-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}