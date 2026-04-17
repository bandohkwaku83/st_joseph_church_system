'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Role,
  StoredUser,
  PermissionKey,
  getDefaultRoles,
  getSeedUsers,
  STORAGE_KEYS,
  HEAD_PASTOR_ROLE_ID,
  ALL_PERMISSION_KEYS,
} from '@/lib/rbac';
import { apiFetch, apiRequest } from '@/lib/api';

/** Local-only auth: pastor (admin) login credentials */
const PASTOR_USERNAME = 'testPastor';
const PASTOR_PASSWORD = 'poster123';
const AUTH_SESSION_KEY = 'church_auth_session';

/** Current user (no password); roleName resolved for display */
export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  initials: string;
  permissions?: string[]; // Add permissions directly to user object
}

/** User for list display (no password) */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  initials: string;
}

/** Backend API user shape (used for users list when backend is present) */
interface BackendUser {
  id: string | number;
  username: string;
  name?: string; // Optional since your backend doesn't include it
  role: 'admin' | 'user' | 'church_admin' | 'head_pastor' | 'finance' | 'financial';
  roleId?: string | number; // Can be string or number from backend
  email?: string;
  initials?: string;
  permissions?: string[]; // Your backend includes permissions array
}

interface AuthContextType {
  user: User | null;
  roles: Role[];
  users: StoredUser[];
  /** True while restoring session on load */
  authLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (key: PermissionKey) => boolean;
  hasRole: (roleId: string) => boolean;
  isSuperAdmin: boolean;
  getRoles: () => Role[];
  getUsers: () => UserSummary[];
  getStoredUser: (id: string) => StoredUser | undefined;
  addRole: (role: Role) => void;
  updateRole: (role: Role) => void;
  deleteRole: (id: string) => boolean;
  addUser: (u: StoredUser) => Promise<void>;
  updateUser: (u: StoredUser) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshRolesAndUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadRoles(): Role[] {
  if (typeof window === 'undefined') return getDefaultRoles();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROLES);
    if (raw) {
      const parsed = JSON.parse(raw) as Role[];
      if (Array.isArray(parsed)) {
        const defaults = getDefaultRoles();
        const missing = defaults.filter((d) => !parsed.some((p) => p.id === d.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch (_) {}
  const defaultRoles = getDefaultRoles();
  if (defaultRoles.length > 0) {
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(defaultRoles));
  }
  return defaultRoles;
}

function loadUsers(): StoredUser[] {
  if (typeof window === 'undefined') return getSeedUsers();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredUser[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  const seed = getSeedUsers();
  if (seed.length > 0) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seed));
  }
  return seed;
}

function storedUserToUser(u: StoredUser, roles: Role[]): User {
  const role = roles.find((r) => r.id === u.roleId);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    roleId: u.roleId,
    roleName: role?.name ?? 'Unknown',
    initials: u.initials,
  };
}

function backendUserToUser(b: BackendUser): User {
  const roles = getDefaultRoles();
  
  // Map backend role ID to frontend role system
  let roleId: string;
  if (b.role === 'church_admin' || b.roleId === '1') {
    roleId = 'role_church_admin';
  } else if (b.role === 'admin' || b.role === 'head_pastor' || b.roleId === '2') {
    roleId = HEAD_PASTOR_ROLE_ID;
  } else if (b.role === 'finance' || b.role === 'financial' || b.roleId === '3') {
    roleId = 'role_finance_officer';
  } else {
    // Default fallback
    roleId = 'role_church_admin';
  }
  
  const role = roles.find((r) => r.id === roleId);
  
  // Use username as display name since your backend doesn't provide a separate name field
  const displayName = b.name || b.username || 'Unknown User';
  const username = b.username || 'unknown';
  
  // Generate initials from username if no name is provided
  const initials =
    b.initials ??
    (displayName.trim().split(/\s+/).length >= 2
      ? (displayName.trim().split(/\s+/)[0][0] +
          displayName.trim().split(/\s+/).pop()![0]).toUpperCase()
      : displayName.slice(0, 2).toUpperCase());
      
  const user = {
    id: String(b.id),
    name: displayName,
    email: b.email ?? username,
    roleId,
    roleName: role?.name ?? getRoleNameFromId(roleId),
    initials,
    permissions: b.permissions || [], // Include permissions directly in user object
  };
  
  return user;
}

// Helper function to get role name from role ID
function getRoleNameFromId(roleId: string): string {
  switch (roleId) {
    case HEAD_PASTOR_ROLE_ID:
      return 'Head Pastor';
    case 'role_church_admin':
      return 'Church Admin';
    case 'role_finance_officer':
      return 'Finance Officer';
    default:
      return 'Church Admin';
  }
}

/** Local pastor user for admin login (no backend). */
function getPastorUser(): User {
  const roles = getDefaultRoles();
  const role = roles.find((r) => r.id === HEAD_PASTOR_ROLE_ID);
  return {
    id: 'pastor-1',
    name: 'Pastor',
    email: PASTOR_USERNAME,
    roleId: HEAD_PASTOR_ROLE_ID,
    roleName: role?.name ?? 'Head Pastor',
    initials: 'TP',
  };
}

function normalizeBackendUser(data: unknown): BackendUser | null {
  if (!data || typeof data !== 'object') return null;
  const user = data as Record<string, unknown>;
  
  if (
    (typeof user.id === 'string' || typeof user.id === 'number') &&
    typeof user.username === 'string'
  ) {
    // Handle role mapping from numeric IDs
    let role: BackendUser['role'] = 'church_admin'; // default
    if (user.role) {
      role = user.role as BackendUser['role'];
    } else if (user.roleId) {
      // Map numeric role IDs to role names
      const roleIdNum = Number(user.roleId);
      switch (roleIdNum) {
        case 1:
          role = 'church_admin';
          break;
        case 2:
          role = 'head_pastor';
          break;
        case 3:
          role = 'finance';
          break;
        default:
          role = 'church_admin';
      }
    }
    
    return {
      id: String(user.id),
      username: user.username,
      name: typeof user.name === 'string' ? user.name : user.username,
      role: role,
      roleId: typeof user.roleId === 'string' || typeof user.roleId === 'number' ? String(user.roleId) : undefined,
      email: typeof user.email === 'string' ? user.email : undefined,
      initials: typeof user.initials === 'string' ? user.initials : undefined,
      permissions: Array.isArray(user.permissions) ? user.permissions : undefined,
    };
  }
  return null;
}

function normalizeBackendUsersList(data: unknown): BackendUser[] {
  if (!data || typeof data !== 'object') return [];
  const o = data as Record<string, unknown>;
  const list = o.users;
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => normalizeBackendUser(item))
    .filter((u): u is BackendUser => u !== null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [backendUsers, setBackendUsers] = useState<BackendUser[]>([]);
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token available for users request');
        return;
      }
      
      const response = await apiRequest<{ users: BackendUser[] }>('users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.data && response.data.users) {
        setBackendUsers(response.data.users);
      } else if (response.error) {
        console.warn('Failed to fetch users:', response.error.message);
        // Don't throw error, just continue without users list
      } else {
        console.warn('Unexpected users API response format:', response);
      }
    } catch (error) {
      console.warn('Failed to fetch users list:', error);
      // Don't throw error, just continue without users list
    }
  }, []);

  const refreshRolesAndUsers = useCallback(() => {
    setRoles(loadRoles());
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setRoles(loadRoles());
  }, []);

  // Restore session from localStorage or API
  useEffect(() => {
    const restoreSession = async () => {
      if (typeof window === 'undefined') {
        setAuthLoading(false);
        return;
      }
      
      const session = localStorage.getItem(AUTH_SESSION_KEY);
      const token = localStorage.getItem('auth_token');
      
      if (session === 'api_authenticated' && token) {
        // Restore session from stored user data
        try {
          const storedUserData = localStorage.getItem('auth_user_data');
          if (storedUserData) {
            const user = JSON.parse(storedUserData) as User;
            setUser(user);
          } else {
            // No stored user data, clear session
            localStorage.removeItem(AUTH_SESSION_KEY);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_token_expires');
            setUser(null);
          }
        } catch (error) {
          console.warn('Session restoration failed:', error);
          // Clear invalid session
          localStorage.removeItem(AUTH_SESSION_KEY);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token_expires');
          localStorage.removeItem('auth_user_data');
          setUser(null);
        }
      } else if (session === 'pastor') {
        // Restore hardcoded session
        setUser(getPastorUser());
      } else {
        setUser(null);
      }
      
      setAuthLoading(false);
    };
    
    restoreSession();
  }, []);

  // When user is set, fetch users list (for admin)
  useEffect(() => {
    if (!user) {
      setBackendUsers([]);
      return;
    }
    void fetchUsers();
  }, [user?.id, fetchUsers]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const u = username.trim();
      
      // Check if API is configured
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      
      if (apiBase) {
        // Use real API authentication
        try {
          const response = await apiRequest<{
            token: string;
            user: BackendUser;
            message?: string;
            status?: string;
          }>('login', {
            method: 'POST',
            body: JSON.stringify({
              username: u,
              password: password,
            }),
          });
          
          if (response.data) {
            // Store token and user data for session restoration
            if (response.data.token) {
              localStorage.setItem('auth_token', response.data.token);
              if (response.data.expiresAt) {
                localStorage.setItem('auth_token_expires', response.data.expiresAt);
              }
            }
            
            // Convert backend user to local user format
            const user = backendUserToUser(response.data.user);
            
            // Store user data for session restoration
            localStorage.setItem('auth_user_data', JSON.stringify(user));
            
            setUser(user);
            
            if (typeof window !== 'undefined') {
              localStorage.setItem(AUTH_SESSION_KEY, 'api_authenticated');
            }
            
            return true;
          } else if (response.error) {
            console.warn('Login failed:', response.error.message);
            return false;
          } else {
            // No data and no error - unexpected response
            console.warn('Unexpected login response:', response);
            return false;
          }
        } catch (error) {
          console.error('Login API error:', error);
          // Fall through to hardcoded fallback in development
        }
      }
      
      // Fallback to hardcoded authentication for development
      if (u === PASTOR_USERNAME && password === PASTOR_PASSWORD) {
        setUser(getPastorUser());
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_SESSION_KEY, 'pastor');
        }
        return true;
      }
      
      return false;
    },
    []
  );

  const logout = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    
    // If we have an API token, try to logout via API
    if (token) {
      try {
        console.log('Attempting API logout...');
        
        // Try the most common logout endpoint first
        const response = await apiRequest('logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.status === 200 || response.status === 204) {
          console.log('API logout successful');
        } else {
          console.warn('API logout returned status:', response.status);
        }
      } catch (error) {
        console.warn('API logout failed:', error);
        // Continue with local cleanup even if API call fails
      }
    }
    
    // Always clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token_expires');
      localStorage.removeItem('auth_user_data');
    }
    
    setUser(null);
    router.push('/signin');
  }, [router]);

  const getRole = useCallback(
    (roleId: string): Role | undefined => roles.find((r) => r.id === roleId),
    [roles]
  );

  const hasPermission = useCallback(
    (key: PermissionKey): boolean => {
      if (!user) return false;
      
      // Map legacy permission keys to new ones for backward compatibility
      const legacyMapping: Record<string, PermissionKey> = {
        'add_users': 'add_user',
        'manage_roles': 'create_role',
        'communication': 'communications',
        'departments': 'organizations',
        'assets': 'assets_or_equipment',
      };
      
      const mappedKey = legacyMapping[key] || key;
      
      // Check user's permissions directly (from login response)
      if (user.permissions && user.permissions.length > 0) {
        return user.permissions.includes(mappedKey) || 
               user.permissions.includes(key) ||
               // Check reverse mapping too
               Object.entries(legacyMapping).some(([legacy, modern]) => 
                 (key === legacy && user.permissions!.includes(modern)) ||
                 (key === modern && user.permissions!.includes(legacy))
               );
      }
      
      // If user has no permissions, deny access
      return false;
    },
    [user]
  );

  const isSuperAdmin = useCallback(
    (): boolean => {
      // A super admin is someone who has all permissions or is explicitly marked as head pastor with permissions
      if (!user || !user.permissions) return false;
      
      // Check if user has all critical admin permissions
      const adminPermissions = ['create_role', 'add_user'];
      return adminPermissions.every(permission => user.permissions!.includes(permission));
    },
    [user]
  );

  const hasRole = useCallback(
    (roleIdOrSlug: string): boolean => {
      if (!user) return false;
      const roleId =
        roleIdOrSlug === 'head_pastor'
          ? HEAD_PASTOR_ROLE_ID
          : roleIdOrSlug === 'church_admin'
            ? 'role_church_admin'
            : roleIdOrSlug === 'finance_officer'
              ? 'role_finance_officer'
              : roleIdOrSlug;
      return user.roleId === roleId;
    },
    [user]
  );

  const getRoles = useCallback((): Role[] => roles, [roles]);
  const getUsers = useCallback((): UserSummary[] => {
    return backendUsers.map((u) => {
      // Map backend role to frontend role ID
      let roleId: string;
      if (u.role === 'church_admin' || u.roleId === '1') {
        roleId = 'role_church_admin';
      } else if (u.role === 'head_pastor' || u.role === 'admin' || u.roleId === '2') {
        roleId = HEAD_PASTOR_ROLE_ID;
      } else if (u.role === 'finance' || u.roleId === '3') {
        roleId = 'role_finance_officer';
      } else {
        roleId = 'role_church_admin'; // default
      }
      
      const role = roles.find((r) => r.id === roleId);
      const roleName = role?.name ?? getRoleNameFromId(roleId);
      
      const displayName = u.name || u.username || 'Unknown User';
      
      return {
        id: String(u.id),
        name: displayName,
        email: u.email ?? u.username,
        roleId: roleId,
        roleName,
        initials:
          u.initials ??
          (displayName.trim().split(/\s+/).length >= 2
            ? (displayName.trim().split(/\s+/)[0][0] +
                displayName.trim().split(/\s+/).pop()![0]).toUpperCase()
            : displayName.slice(0, 2).toUpperCase() || u.username.slice(0, 2).toUpperCase()),
      };
    });
  }, [backendUsers, roles]);

  const getStoredUser = useCallback(
    (id: string): StoredUser | undefined => {
      const u = backendUsers.find((x) => String(x.id) === id);
      if (!u) return undefined;
      
      // Map backend role to frontend role ID
      let roleId: string;
      if (u.role === 'church_admin' || u.roleId === '1') {
        roleId = 'role_church_admin';
      } else if (u.role === 'head_pastor' || u.role === 'admin' || u.roleId === '2') {
        roleId = HEAD_PASTOR_ROLE_ID;
      } else if (u.role === 'finance' || u.roleId === '3') {
        roleId = 'role_finance_officer';
      } else {
        roleId = 'role_church_admin'; // default
      }
      
      const role = roles.find((r) => r.id === roleId);
      const displayName = u.name || u.username || 'Unknown User';
      
      return {
        id: String(u.id),
        name: displayName,
        email: u.email ?? u.username,
        roleId,
        password: '',
        initials:
          u.initials ??
          (displayName.trim().split(/\s+/).length >= 2
            ? (displayName.trim().split(/\s+/)[0][0] +
                displayName.trim().split(/\s+/).pop()![0]).toUpperCase()
            : displayName.slice(0, 2).toUpperCase() || u.username.slice(0, 2).toUpperCase()),
      };
    },
    [backendUsers, roles]
  );

  const addRole = useCallback((role: Role) => {
    const next = loadRoles();
    if (next.some((r) => r.id === role.id)) return;
    next.push(role);
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(next));
    setRoles(next);
  }, []);

  const updateRole = useCallback((role: Role) => {
    const next = loadRoles().map((r) => (r.id === role.id ? role : r));
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(next));
    setRoles(next);
  }, []);

  const deleteRole = useCallback((id: string): boolean => {
    const systemRole = getDefaultRoles().find((r) => r.id === HEAD_PASTOR_ROLE_ID);
    if (id === HEAD_PASTOR_ROLE_ID || id === systemRole?.id) return false;
    const next = loadRoles().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(next));
    setRoles(next);
    return true;
  }, []);

  const addUser = useCallback(
    async (u: StoredUser): Promise<void> => {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: u.name,
          username: u.email,
          password: u.password,
          roleId: u.roleId,
        }),
      });
      if (res.status === 401) {
        setUser(null);
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? 'Failed to create user');
      }
      await fetchUsers();
    },
    [fetchUsers]
  );

  const updateUser = useCallback(
    async (u: StoredUser): Promise<void> => {
      const body: Record<string, string> = {
        name: u.name,
        username: u.email,
        roleId: u.roleId,
      };
      if (u.password && u.password.trim()) body.password = u.password;
      const res = await apiFetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setUser(null);
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? 'Failed to update user');
      }
      const data = await res.json();
      await fetchUsers();
      if (user?.id === u.id) {
        const backendUser = normalizeBackendUser(data);
        if (backendUser) setUser(backendUserToUser(backendUser));
      }
    },
    [fetchUsers, user?.id]
  );

  const deleteUser = useCallback(
    async (id: string): Promise<void> => {
      const toDelete = backendUsers.find((x) => x.id === id);
      if (toDelete?.roleId === HEAD_PASTOR_ROLE_ID || toDelete?.role === 'admin') {
        const role = roles.find((r) => r.id === (toDelete.roleId ?? ''));
        if (role?.isSystemRole) return; // never delete Head Pastor
      }
      const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.status === 401) {
        setUser(null);
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Failed to delete user');
      await fetchUsers();
      if (user?.id === id) {
        setUser(null);
        router.push('/signin');
      }
    },
    [backendUsers, fetchUsers, user?.id, router, roles]
  );

  const usersForContext = useMemo((): StoredUser[] => {
    return backendUsers.map((u) => {
      // Map backend role to frontend role ID
      let roleId: string;
      if (u.role === 'church_admin' || u.roleId === '1') {
        roleId = 'role_church_admin';
      } else if (u.role === 'head_pastor' || u.role === 'admin' || u.roleId === '2') {
        roleId = HEAD_PASTOR_ROLE_ID;
      } else if (u.role === 'finance' || u.roleId === '3') {
        roleId = 'role_finance_officer';
      } else {
        roleId = 'role_church_admin'; // default
      }
      
      const displayName = u.name || u.username || 'Unknown User';
      
      const initials =
        u.initials ??
        (displayName.trim().split(/\s+/).length >= 2
          ? (displayName.trim().split(/\s+/)[0][0] +
              displayName.trim().split(/\s+/).pop()![0]).toUpperCase()
          : displayName.slice(0, 2).toUpperCase() || u.username.slice(0, 2).toUpperCase());
      return {
        id: String(u.id),
        name: displayName,
        email: u.email ?? u.username,
        roleId,
        password: '',
        initials,
      };
    });
  }, [backendUsers]);

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        users: usersForContext,
        authLoading,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
        hasRole,
        isSuperAdmin: isSuperAdmin(),
        getRoles,
        getUsers,
        getStoredUser,
        addRole,
        updateRole,
        deleteRole,
        addUser,
        updateUser,
        deleteUser,
        refreshRolesAndUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
