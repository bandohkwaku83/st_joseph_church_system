'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

interface AuthContextType {
  user: User | null;
  roles: Role[];
  users: StoredUser[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
  addUser: (u: StoredUser) => void;
  updateUser: (u: StoredUser) => void;
  deleteUser: (id: string) => void;
  refreshRolesAndUsers: () => void;
  /** True when no users exist – show "Create first administrator" on signin */
  needsBootstrap: boolean;
  /** Create first admin (role + user) and log in. Only when needsBootstrap. */
  bootstrapFirstAdmin: (name: string, email: string, password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadRoles(): Role[] {
  if (typeof window === 'undefined') return getDefaultRoles();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROLES);
    if (raw) {
      const parsed = JSON.parse(raw) as Role[];
      if (Array.isArray(parsed)) return parsed;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<StoredUser[]>([]);
  const router = useRouter();

  const refreshRolesAndUsers = useCallback(() => {
    setRoles(loadRoles());
    setUsers(loadUsers());
  }, []);

  useEffect(() => {
    setRoles(loadRoles());
    setUsers(loadUsers());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('church_admin_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as User;
      if (parsed?.id && parsed?.roleId) {
        const rolesList = loadRoles();
        const usersList = loadUsers();
        const found = usersList.find((u) => u.id === parsed.id);
        if (found) {
          setUser(storedUserToUser(found, rolesList));
          return;
        }
      }
    } catch (_) {}
    localStorage.removeItem('church_admin_user');
  }, [roles]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const usersList = loadUsers();
      const rolesList = loadRoles();
      const found = usersList.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!found || found.password !== password) return false;
      const userObj = storedUserToUser(found, rolesList);
      setUser(userObj);
      if (typeof window !== 'undefined') {
        localStorage.setItem('church_admin_user', JSON.stringify(userObj));
      }
      return true;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('church_admin_user');
    }
    router.push('/signin');
  }, [router]);

  const getRole = useCallback(
    (roleId: string): Role | undefined => roles.find((r) => r.id === roleId),
    [roles]
  );

  const hasPermission = useCallback(
    (key: PermissionKey): boolean => {
      if (!user) return false;
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
    return users.map((u) => {
      const role = roles.find((r) => r.id === u.roleId);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        roleId: u.roleId,
        roleName: role?.name ?? 'Unknown',
        initials: u.initials,
      };
    });
  }, [users, roles]);

  const getStoredUser = useCallback(
    (id: string): StoredUser | undefined => users.find((u) => u.id === id),
    [users]
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

  const addUser = useCallback((u: StoredUser) => {
    const next = loadUsers();
    if (next.some((x) => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase())) return;
    next.push(u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
    setUsers(next);
  }, []);

  const updateUser = useCallback((u: StoredUser) => {
    const next = loadUsers().map((x) => (x.id === u.id ? u : x));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
    setUsers(next);
    if (user?.id === u.id) {
      const rolesList = loadRoles();
      setUser(storedUserToUser(u, rolesList));
      if (typeof window !== 'undefined') {
        localStorage.setItem('church_admin_user', JSON.stringify(storedUserToUser(u, rolesList)));
      }
    }
  }, [user?.id]);

  const deleteUser = useCallback((id: string) => {
    const list = loadUsers();
    const toDelete = list.find((x) => x.id === id);
    if (toDelete?.roleId === HEAD_PASTOR_ROLE_ID) return; // never delete Head Pastor
    const next = list.filter((x) => x.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next));
    setUsers(next);
    if (user?.id === id) {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('church_admin_user');
      }
      router.push('/signin');
    }
  }, [user?.id, router]);

  const needsBootstrap = users.length === 0;

  const bootstrapFirstAdmin = useCallback(
    (name: string, email: string, password: string): boolean => {
      if (users.length > 0) return false;
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();
      if (!trimmedName || !trimmedEmail || !trimmedPassword) return false;

      const parts = trimmedName.split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : trimmedName.slice(0, 2).toUpperCase() || '??';

      const firstRole: Role = {
        id: HEAD_PASTOR_ROLE_ID,
        name: 'Head Pastor',
        permissionKeys: [...ALL_PERMISSION_KEYS],
        isSystemRole: true,
      };
      const firstUserId = 'user_' + Date.now();
      const firstUser: StoredUser = {
        id: firstUserId,
        name: trimmedName,
        email: trimmedEmail,
        roleId: HEAD_PASTOR_ROLE_ID,
        password: trimmedPassword,
        initials,
      };

      const rolesList = [firstRole];
      const usersList = [firstUser];
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(rolesList));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
      setRoles(rolesList);
      setUsers(usersList);

      const userObj = storedUserToUser(firstUser, rolesList);
      setUser(userObj);
      localStorage.setItem('church_admin_user', JSON.stringify(userObj));
      return true;
    },
    [users.length]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        users,
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
        needsBootstrap,
        bootstrapFirstAdmin,
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
