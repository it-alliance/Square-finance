'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';
import { MENU_ITEMS } from '@/utils/constants';
import * as Icons from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const closeSidebar = useSidebarStore((state) => state.closeSidebar);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [expandedMenus, setExpandedMenus] = useState({});

  // Auto-expand menus that contain the active route on mount
  useEffect(() => {
    const activeMenus = {};
    MENU_ITEMS.forEach((item) => {
      if (item.subItems && item.subItems.some((sub) => pathname?.startsWith(sub.href))) {
        activeMenus[item.id] = true;
      }
    });
    setExpandedMenus(activeMenus);
  }, [pathname]);

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 flex h-screen w-64 flex-col transform bg-primary text-white transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button for Mobile */}
        <button
          onClick={closeSidebar}
          className="absolute right-4 top-4 md:hidden"
        >
          <Icons.ChevronLeft className="h-6 w-6" />
        </button>

        {/* Logo Area */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <span className="text-lg font-bold">SF</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Square</h1>
              <p className="text-xs text-white/70">Finance</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {MENU_ITEMS.map((item) => {
            const Icon = Icons[item.icon] || Icons.Circle;
            const hasSubItems = !!item.subItems;
            
            const isChildActive = hasSubItems && item.subItems.some((sub) => pathname?.startsWith(sub.href));
            const isExactActive = item.href === '/'
              ? pathname === '/'
              : (pathname === item.href || (!hasSubItems && item.href !== '/' && pathname?.startsWith(item.href)));
            const isActive = isExactActive || isChildActive;
            const isExpanded = expandedMenus[item.id];

            return (
              <div key={item.id} className="flex flex-col">
                {hasSubItems ? (
                  <button
                    onClick={() => toggleMenu(item.id)}
                    style={isActive ? { borderLeft: '3px solid #FFFFFF' } : {}}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-white/80 hover:bg-secondary hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    <Icons.ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => closeSidebar()}
                    style={isActive ? { borderLeft: '3px solid #FFFFFF' } : {}}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-white/80 hover:bg-secondary hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )}

                {/* Sub Items Dropdown */}
                {hasSubItems && (
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="flex flex-col gap-1 pl-10 pr-2 border-l border-white/10 ml-6 py-1">
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname?.startsWith(subItem.href);
                        return (
                          <Link
                            key={subItem.id}
                            href={subItem.href}
                            onClick={() => closeSidebar()}
                            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors relative cursor-pointer ${
                              isSubActive
                                ? 'text-white bg-white/20'
                                : 'text-white/70 hover:text-white hover:bg-secondary/50'
                            }`}
                          >
                            {isSubActive && (
                              <span className="absolute -left-[25px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white" />
                            )}
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Section */}
        {user && (
          <div className="border-t border-white/10 p-6">
            <div className="mb-4 flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.username}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{user.username}</p>
                <p className="truncate text-xs text-white/70">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium hover:bg-danger-hover transition-colors"
            >
              <Icons.LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}