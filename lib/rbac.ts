/**
 * Role-Based Access Control (RBAC)
 * Head Pastor = Super Admin; only they can create/manage roles.
 * All menu access is driven by permissions assigned to roles.
 */

export const PERMISSION_KEYS = [
  'dashboard',
  'members',
  'attendance',
  'record_income',
  'expenditure',
  'generate_report',
  'tithes',
  'communication',
  'departments',
  'assets',
  'add_users',
  'manage_roles',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: 'Dashboard',
  members: 'Members',
  attendance: 'Attendance',
  record_income: 'Record Income',
  expenditure: 'Expenditure',
  generate_report: 'Generate Report',
  tithes: 'Tithes',
  communication: 'Communication',
  departments: 'Organizations',
  assets: 'Assets/Equipment',
  add_users: 'Add Users',
  manage_roles: 'Manage Roles',
};

/** Role stored in DB / localStorage. Head Pastor role is system-built-in. */
export interface Role {
  id: string;
  name: string;
  permissionKeys: PermissionKey[];
  isSystemRole?: boolean; // true = Head Pastor, cannot delete or remove manage_roles
}

/** User as stored (with password for demo; use hashed in production). */
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  password: string; // demo only; backend would store hash
  initials: string;
}

export const HEAD_PASTOR_ROLE_ID = 'role_head_pastor';

/** Default roles on first load. Empty – you add roles yourself via Manage Roles. */
export function getDefaultRoles(): Role[] {
  return [];
}

/** Seed users on first load. Empty – first visitor creates the first administrator. */
export function getSeedUsers(): StoredUser[] {
  return [];
}

/** All permission keys (for creating the first admin role). */
export const ALL_PERMISSION_KEYS: PermissionKey[] = [...PERMISSION_KEYS];

export const STORAGE_KEYS = {
  ROLES: 'church_admin_roles',
  USERS: 'church_admin_users',
} as const;
