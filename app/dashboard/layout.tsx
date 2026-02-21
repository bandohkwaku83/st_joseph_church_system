'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineClipboardCheck,
  HiOutlineChatAlt,
  HiOutlineOfficeBuilding,
  HiMenu,
  HiOutlineBell,
  HiX,
  HiOutlineSearch,
  HiOutlineLogout,
  HiPlus,
  HiClipboardList,
  HiReceiptRefund,
  HiMinus,
  HiOutlineCube,
  HiOutlineUserAdd,
} from 'react-icons/hi';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import type { PermissionKey } from '@/lib/rbac';
import { HEAD_PASTOR_ROLE_ID } from '@/lib/rbac';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Single permission or array (show if user has any of them) */
  permission: PermissionKey | PermissionKey[];
}

const allNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HiOutlineHome, permission: 'dashboard' },
  { name: 'Members', href: '/dashboard/members', icon: HiOutlineUsers, permission: 'members' },
  { name: 'Attendance', href: '/dashboard/attendance', icon: HiOutlineClipboardCheck, permission: 'attendance' },
  { name: 'Record Income', href: '/dashboard/record-income', icon: HiPlus, permission: 'record_income' },
  { name: 'Expenditure', href: '/dashboard/expenditure', icon: HiMinus, permission: 'expenditure' },
  { name: 'Generate Report', href: '/dashboard/generate-report', icon: HiClipboardList, permission: 'generate_report' },
  { name: 'Tithes', href: '/dashboard/tithes', icon: HiReceiptRefund, permission: 'tithes' },
  { name: 'Communication', href: '/dashboard/communication', icon: HiOutlineChatAlt, permission: 'communication' },
  { name: 'Organizations', href: '/dashboard/departments', icon: HiOutlineOfficeBuilding, permission: 'departments' },
  { name: 'Assets/Equipment', href: '/dashboard/assets', icon: HiOutlineCube, permission: 'assets' },
  { name: 'Add User', href: '/dashboard/users-and-roles', icon: HiOutlineUserAdd, permission: ['add_users', 'manage_roles'] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, hasPermission } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, router]);

  // Strict RBAC: only show menus the user has permission for. Head Pastor always sees Add User.
  const navigation = allNavigation.filter((item) => {
    const p = item.permission;
    const hasAccess = Array.isArray(p) ? p.some((key) => hasPermission(key)) : hasPermission(p);
    const isAddUserItem = Array.isArray(p) && p.includes('add_users') && p.includes('manage_roles');
    const isHeadPastor = user?.roleId === HEAD_PASTOR_ROLE_ID;
    return hasAccess || (isAddUserItem && isHeadPastor);
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Hidden on mobile/tablet, visible on desktop */}
      <aside
        className={cn(
          'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
          'hidden lg:flex', // Hide on mobile and tablet
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src="/images/logos/logo.png" 
                alt="St Joseph Catholic Church" 
                className="w-8 h-8 object-contain flex-shrink-0"
              />
              <span className="text-sm font-semibold text-gray-900 truncate">St Joseph Catholic Church</span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 flex items-center justify-center mx-auto">
              <img 
                src="/images/logos/logo.png" 
                alt="St Joseph Catholic Church" 
                className="w-8 h-8 object-contain"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          >
            <HiMenu className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigation.map((item) => {
            const hrefWithoutQuery = item.href.split('?')[0];
            const isActive = pathname === hrefWithoutQuery || pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(hrefWithoutQuery));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-green-600' : 'text-gray-500')} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-14 md:h-16 flex items-center justify-between px-3 md:px-4 lg:px-6">
          {/* Mobile Menu Button - Visible on mobile/tablet */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <HiX className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2 md:gap-4 flex-1">
            {/* Search - Hidden on mobile, visible on tablet and up */}
            <div className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gray-50 rounded-lg border border-gray-200 max-w-md flex-1">
              <HiOutlineSearch className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400 flex-1"
              />
            </div>
          </div>

          {/* Right Side Icons & Profile */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Notifications Icon */}
            <button className="p-1.5 md:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
              <HiOutlineBell className="h-4 w-4 md:h-5 md:w-5" />
              <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-gray-200">
              <div className="hidden md:block text-right">
                <span className="block text-xs md:text-sm font-medium text-gray-900 truncate max-w-[100px] lg:max-w-none">{user.name}</span>
                <span className="block text-xs text-gray-500">
                  {user.roleName}
                </span>
              </div>
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                {user.initials}
              </div>
              <button
                onClick={logout}
                className="p-1.5 md:p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign out"
              >
                <HiOutlineLogout className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-white w-64 sm:w-80 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/images/logos/logo.png" 
                      alt="St Joseph Catholic Church" 
                      className="w-8 h-8 object-contain"
                    />
                    <span className="text-lg font-semibold text-gray-900">St Joseph Catholic Church</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                  >
                    <HiX className="h-5 w-5" />
                  </button>
                </div>
                {user && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-xs">
                        {user.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.roleName}</p>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <HiOutlineLogout className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
                {navigation.map((item) => {
                  const hrefWithoutQuery = item.href.split('?')[0];
                  const isActive = pathname === hrefWithoutQuery || pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(hrefWithoutQuery));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
                        isActive
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-green-600' : 'text-gray-500')} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
