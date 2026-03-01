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
import { apiFetch } from '@/lib/api';

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
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  roleId?: string;
  email?: string;
  initials?: string;
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
  const roleId =
    b.roleId ?? (b.role === 'admin' ? HEAD_PASTOR_ROLE_ID : 'role_church_admin');
  const role = roles.find((r) => r.id === roleId);
  const initials =
    b.initials ??
    (b.name.trim().split(/\s+/).length >= 2
      ? (b.name.trim().split(/\s+/)[0][0] +
          b.name.trim().split(/\s+/).pop()![0]).toUpperCase()
      : b.name.slice(0, 2).toUpperCase() || b.username.slice(0, 2).toUpperCase());
  return {
    id: b.id,
    name: b.name,
    email: b.email ?? b.username,
    roleId,
    roleName: role?.name ?? (b.role === 'admin' ? 'Head Pastor' : 'User'),
    initials,
  };
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
  const o = data as Record<string, unknown>;
  const user = (o.user as BackendUser) ?? (o as unknown as BackendUser);
  if (
    typeof user?.id === 'string' &&
    typeof user?.username === 'string' &&
    typeof user?.name === 'string'
  ) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role === 'user' ? 'user' : 'admin',
      roleId: typeof user.roleId === 'string' ? user.roleId : undefined,
      email: typeof user.email === 'string' ? user.email : undefined,
      initials: typeof user.initials === 'string' ? user.initials : undefined,
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
    const res = await apiFetch('/api/users');
    if (res.status === 401) {
      setUser(null);
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setBackendUsers(normalizeBackendUsersList(data));
  }, []);

  const refreshRolesAndUsers = useCallback(() => {
    setRoles(loadRoles());
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setRoles(loadRoles());
  }, []);

  // Restore session from localStorage (no backend)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setAuthLoading(false);
      return;
    }
    const session = localStorage.getItem(AUTH_SESSION_KEY);
    if (session === 'pastor') {
      setUser(getPastorUser());
    } else {
      setUser(null);
    }
    setAuthLoading(false);
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_SESSION_KEY);
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
      if (user.roleId === HEAD_PASTOR_ROLE_ID) return true;
      const role = getRole(user.roleId);
      if (!role) return false;
      return role.permissionKeys.includes(key);
    },
    [user, getRole]
  );

  const isSuperAdmin = useCallback(
    (): boolean => user?.roleId === HEAD_PASTOR_ROLE_ID,
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
      const role = roles.find((r) => r.id === (u.roleId ?? ''));
      const roleName =
        role?.name ??
        (u.role === 'admin' ? 'Head Pastor' : 'User');
      return {
        id: u.id,
        name: u.name,
        email: u.email ?? u.username,
        roleId: u.roleId ?? (u.role === 'admin' ? HEAD_PASTOR_ROLE_ID : 'role_church_admin'),
        roleName,
        initials:
          u.initials ??
          (u.name.trim().split(/\s+/).length >= 2
            ? (u.name.trim().split(/\s+/)[0][0] +
                u.name.trim().split(/\s+/).pop()![0]).toUpperCase()
            : u.name.slice(0, 2).toUpperCase() || u.username.slice(0, 2).toUpperCase()),
      };
    });
  }, [backendUsers, roles]);

  const getStoredUser = useCallback(
    (id: string): StoredUser | undefined => {
      const u = backendUsers.find((x) => x.id === id);
      if (!u) return undefined;
      const roleId = u.roleId ?? (u.role === 'admin' ? HEAD_PASTOR_ROLE_ID : 'role_church_admin');
      const role = roles.find((r) => r.id === roleId);
      return {
        id: u.id,
        name: u.name,
        email: u.email ?? u.username,
        roleId,
        password: '',
        initials:
          u.initials ??
          (u.name.trim().split(/\s+/).length >= 2
            ? (u.name.trim().split(/\s+/)[0][0] +
                u.name.trim().split(/\s+/).pop()![0]).toUpperCase()
            : u.name.slice(0, 2).toUpperCase() || u.username.slice(0, 2).toUpperCase()),
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
      const roleId = u.roleId ?? (u.role === 'admin' ? HEAD_PASTOR_ROLE_ID : 'role_church_admin');
      const initials =
        u.initials ??
        (u.name.trim().split(/\s+/).length >= 2
          ? (u.name.trim().split(/\s+/)[0][0] +
              u.name.trim().split(/\s+/).pop()![0]).toUpperCase()
          : u.name.slice(0, 2).toUpperCase() || u.username.slice(0, 2).toUpperCase());
      return {
        id: u.id,
        name: u.name,
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
