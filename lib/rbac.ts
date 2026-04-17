
export const PERMISSION_KEYS = [
  'dashboard',
  'add_user',
  'assets_or_equipment',
  'communications',
  'tithes',
  'generate_report',
  'expenditure',
  'record_income',
  'attendance',
  'members',
  'create_role',
  'organizations',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  dashboard: 'Dashboard',
  add_user: 'Add Users',
  assets_or_equipment: 'Assets/Equipment',
  communications: 'Communications',
  tithes: 'Tithes',
  generate_report: 'Generate Report',
  expenditure: 'Expenditure',
  record_income: 'Record Income',
  attendance: 'Attendance',
  members: 'Members',
  create_role: 'Create Role',
  organizations: 'Organizations',
};

/** Role stored in DB / localStorage. Head Pastor role is system-built-in. */
export interface Role {
  id: string;
  name: string;
  permissionKeys: PermissionKey[];
  isSystemRole?: boolean; // true = Head Pastor, cannot delete or remove create_role
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
export const CHURCH_ADMIN_ROLE_ID = 'role_church_admin';
export const FINANCE_OFFICER_ROLE_ID = 'role_finance_officer';

/** Default roles on first load. Includes Head Pastor, Church Admin, and Financial so they always appear in the role dropdown. */
export function getDefaultRoles(): Role[] {
  const financePermissions: PermissionKey[] = [
    'dashboard',
    'record_income',
    'expenditure',
    'generate_report',
    'tithes',
  ];
  const churchAdminPermissions: PermissionKey[] = PERMISSION_KEYS.filter(
    (k) => k !== 'create_role'
  );
  return [
    {
      id: HEAD_PASTOR_ROLE_ID,
      name: 'Head Pastor',
      permissionKeys: [...ALL_PERMISSION_KEYS],
      isSystemRole: true,
    },
    {
      id: CHURCH_ADMIN_ROLE_ID,
      name: 'Church Admin',
      permissionKeys: churchAdminPermissions,
      isSystemRole: false,
    },
    {
      id: FINANCE_OFFICER_ROLE_ID,
      name: 'Finance Officer',
      permissionKeys: financePermissions,
      isSystemRole: false,
    },
  ];
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
