'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  HEAD_PASTOR_ROLE_ID,
  type Role,
  type PermissionKey,
} from '@/lib/rbac';
import { HiOutlinePencil, HiOutlineTrash, HiPlus } from 'react-icons/hi';
import { useToast } from '@/lib/toast-context';

const NEW_ROLE_VALUE = '__new_role__';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '??';
}

function UsersAndRolesContent() {
  const {
    user,
    getRoles,
    getUsers,
    getStoredUser,
    getBackendUser,
    addRole,
    updateRole,
    addUser,
    updateUser,
    deleteUser,
    hasPermission,
    refreshRolesAndUsers,
  } = useAuth();
  const { showToast } = useToast();
  const roles = getRoles();
  const users = getUsers();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      refreshRolesAndUsers();
      showToast('Data refreshed successfully.', 'success');
    } catch (error) {
      showToast('Failed to refresh data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole({ ...role });
  };

  const handleSaveRole = () => {
    if (!editingRole) return;
    
    try {
      updateRole(editingRole);
      showToast('Role updated successfully.', 'success');
      setEditingRole(null);
    } catch (error) {
      showToast('Failed to update role.', 'error');
    }
  };

  const handleTogglePermission = (permission: PermissionKey) => {
    if (!editingRole) return;
    
    const newPermissions = editingRole.permissionKeys.includes(permission)
      ? editingRole.permissionKeys.filter(p => p !== permission)
      : [...editingRole.permissionKeys, permission];
    
    setEditingRole({
      ...editingRole,
      permissionKeys: newPermissions
    });
  };

  const isHeadPastorRole = (role: Role | undefined) =>
    role?.id === HEAD_PASTOR_ROLE_ID || role?.isSystemRole;

  const currentUserRole = roles.find((r) => r.id === user?.roleId);
  const canManageUsers = hasPermission('add_user') || isHeadPastorRole(currentUserRole);
  const canCreateNewRole = hasPermission('create_role') || isHeadPastorRole(currentUserRole);

  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [formNewRoleName, setFormNewRoleName] = useState('');
  const [formMenuAccess, setFormMenuAccess] = useState<Set<PermissionKey>>(new Set());

  const isCreatingNewRole = formRoleId === NEW_ROLE_VALUE;
  const selectedRole = roles.find((r) => r.id === formRoleId);

  const permissionsForNewRole = useMemo(
    () => PERMISSION_KEYS.filter((k) => k !== 'create_role'),
    []
  );

  const menuAccessList = isCreatingNewRole ? permissionsForNewRole : [...PERMISSION_KEYS];

  const openAddUser = () => {
    setEditingUserId(null);
    setUserFormOpen(true);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    const firstRoleId = roles[0]?.id ?? '';
    setFormRoleId(firstRoleId);
    setFormNewRoleName('');
    
    // Set predefined permissions for the first role
    const firstRole = roles.find((r) => r.id === firstRoleId);
    if (firstRole) {
      let predefinedPermissions: Set<PermissionKey>;
      
      if (firstRole.name.toLowerCase().includes('church admin')) {
        predefinedPermissions = new Set([
          'dashboard', 'members', 'attendance', 'record_income', 
          'expenditure', 'generate_report', 'welfare', 'communications', 
          'organizations', 'assets_or_equipment', 'add_user', 'create_role'
        ] as PermissionKey[]);
      } else if (firstRole.name.toLowerCase().includes('head pastor')) {
        predefinedPermissions = new Set([
          'dashboard', 'welfare', 'generate_report', 'expenditure', 
          'record_income', 'members', 'attendance'
        ] as PermissionKey[]);
      } else if (firstRole.name.toLowerCase().includes('financial')) {
        predefinedPermissions = new Set([
          'dashboard', 'welfare', 'generate_report', 'record_income', 'expenditure'
        ] as PermissionKey[]);
      } else {
        predefinedPermissions = new Set(firstRole.permissionKeys);
      }
      
      setFormMenuAccess(predefinedPermissions);
    } else {
      setFormMenuAccess(new Set());
    }
  };

  const openEditUser = (id: string) => {
    const u = getStoredUser(id);
    if (!u) return;
    const role = roles.find((r) => r.id === u.roleId);
    setEditingUserId(id);
    setUserFormOpen(true);
    setFormName(u.name);
    setFormUsername(u.email);
    setFormPassword('');
    setFormRoleId(u.roleId);
    setFormNewRoleName('');
    
    // Set predefined permissions based on role name
    if (role) {
      let predefinedPermissions: Set<PermissionKey>;
      
      if (role.name.toLowerCase().includes('church admin')) {
        predefinedPermissions = new Set([
          'dashboard', 'members', 'attendance', 'record_income', 
          'expenditure', 'generate_report', 'welfare', 'communications', 
          'organizations', 'assets_or_equipment', 'add_user', 'create_role'
        ] as PermissionKey[]);
      } else if (role.name.toLowerCase().includes('head pastor')) {
        predefinedPermissions = new Set([
          'dashboard', 'welfare', 'generate_report', 'expenditure', 
          'record_income', 'members', 'attendance'
        ] as PermissionKey[]);
      } else if (role.name.toLowerCase().includes('financial')) {
        predefinedPermissions = new Set([
          'dashboard', 'welfare', 'generate_report', 'record_income', 'expenditure'
        ] as PermissionKey[]);
      } else {
        predefinedPermissions = new Set(role.permissionKeys);
      }
      
      setFormMenuAccess(predefinedPermissions);
    } else {
      setFormMenuAccess(new Set());
    }
  };

  // Get the current user being edited to access their permissions
  const editingUser = editingUserId ? getBackendUser(editingUserId) : null;

  const closeUserForm = () => {
    setUserFormOpen(false);
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRoleId('');
    setFormNewRoleName('');
    setFormMenuAccess(new Set());
  };

  const handleDeleteUser = async (id: string, name: string, roleId: string) => {
    if (roleId === HEAD_PASTOR_ROLE_ID) {
      showToast('The Head Pastor account cannot be deleted.', 'error');
      return;
    }
    if (typeof window === 'undefined') return;
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      showToast('User deleted.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete user.', 'error');
    }
  };

  const toggleMenuAccess = (key: PermissionKey) => {
    setFormMenuAccess((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveUser = async () => {
    const name = formName.trim();
    const username = formUsername.trim().toLowerCase();
    if (!name || !username) {
      showToast('Name and Username are required.', 'error');
      return;
    }

    let roleIdToUse = formRoleId;

    if (isCreatingNewRole) {
      const roleName = formNewRoleName.trim();
      if (!roleName) {
        showToast('Please enter a role name.', 'error');
        return;
      }
      roleIdToUse = 'role_' + Date.now();
      addRole({
        id: roleIdToUse,
        name: roleName,
        permissionKeys: Array.from(formMenuAccess) as PermissionKey[],
      });
    } else if (!formRoleId) {
      showToast('Please select a role.', 'error');
      return;
    } else if (selectedRole) {
      const newPerms = Array.from(formMenuAccess) as PermissionKey[];
      const same =
        selectedRole.permissionKeys.length === newPerms.length &&
        newPerms.every((k) => selectedRole.permissionKeys.includes(k));
      if (!same) {
        updateRole({
          ...selectedRole,
          permissionKeys: newPerms,
        });
      }
    }

    try {
      if (editingUserId) {
        const existing = getStoredUser(editingUserId);
        if (!existing) return;
        const otherWithSameUsername = users.some(
          (u) => u.id !== editingUserId && u.email.toLowerCase() === username
        );
        if (otherWithSameUsername) {
          showToast('Another user already has this username.', 'error');
          return;
        }
        await updateUser({
          ...existing,
          name,
          email: username,
          roleId: roleIdToUse,
          password: formPassword.trim() || existing.password,
          initials: getInitials(name),
        });
        showToast('User updated successfully.', 'success');
      } else {
        if (!formPassword.trim()) {
          showToast('Password is required for new users.', 'error');
          return;
        }
        if (users.some((u) => u.email.toLowerCase() === username)) {
          showToast('A user with this username already exists.', 'error');
          return;
        }
        const id = 'user_' + Date.now();
        await addUser({
          id,
          name,
          email: username,
          roleId: roleIdToUse,
          password: formPassword.trim(),
          initials: getInitials(name),
        });
        showToast('User created successfully.', 'success');
      }
      closeUserForm();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong.', 'error');
    }
  };

  if (!canManageUsers) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-600 mt-1">
            Create and manage users. Set name, username, password, role, and menu access.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button onClick={openAddUser} className="flex items-center gap-2">
            <HiPlus className="h-5 w-5" />
            Add User
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No users found. Try refreshing or check your connection.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-medium">
                          {u.initials}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.roleName}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditUser(u.id)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <HiOutlinePencil className="h-5 w-5" />
                        </button>
                        {u.roleId !== HEAD_PASTOR_ROLE_ID ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name, u.roleId)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <HiOutlineTrash className="h-5 w-5" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 px-2" title="Head Pastor cannot be deleted">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Edit Modal */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Role: {editingRole.name}
              </h2>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  {PERMISSION_KEYS.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={editingRole.permissionKeys.includes(permission)}
                        onChange={() => handleTogglePermission(permission)}
                        disabled={
                          permission === 'create_role' &&
                          editingRole.isSystemRole
                        }
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-60"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {PERMISSION_LABELS[permission]}
                        </span>
                        <p className="text-xs text-gray-500">
                          {permission}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {editingRole.isSystemRole && (
                  <p className="text-xs text-gray-500 mt-2">
                    Head Pastor role always has "Create Role" permission and cannot be removed.
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRole}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add User / Edit User modal */}
      {userFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingUserId ? 'Edit User' : 'Add User'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <Input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Login username"
                  disabled={!!editingUserId}
                />
                {editingUserId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Username cannot be changed when editing.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUserId ? '(leave blank to keep current)' : ''}
                </label>
                <Input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUserId ? '••••••••' : 'Enter password'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formRoleId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormRoleId(val);
                    if (val === NEW_ROLE_VALUE) {
                      setFormNewRoleName('');
                      setFormMenuAccess(new Set());
                    } else {
                      const role = roles.find((r) => r.id === val);
                      if (role) {
                        // Set predefined permissions based on role name
                        let predefinedPermissions: Set<PermissionKey>;
                        
                        if (role.name.toLowerCase().includes('church admin')) {
                          predefinedPermissions = new Set([
                            'dashboard', 'members', 'attendance', 'record_income', 
                            'expenditure', 'generate_report', 'welfare', 'communications', 
                            'organizations', 'assets_or_equipment', 'add_user', 'create_role'
                          ] as PermissionKey[]);
                        } else if (role.name.toLowerCase().includes('head pastor')) {
                          predefinedPermissions = new Set([
                            'dashboard', 'welfare', 'generate_report', 'expenditure', 
                            'record_income', 'members', 'attendance'
                          ] as PermissionKey[]);
                        } else if (role.name.toLowerCase().includes('financial')) {
                          predefinedPermissions = new Set([
                            'dashboard', 'welfare', 'generate_report', 'record_income', 'expenditure'
                          ] as PermissionKey[]);
                        } else {
                          // For other roles, use their existing permissions
                          predefinedPermissions = new Set(role.permissionKeys);
                        }
                        
                        setFormMenuAccess(predefinedPermissions);
                      } else {
                        setFormMenuAccess(new Set());
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!!editingUserId}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                  {canCreateNewRole && !editingUserId && (
                    <option value={NEW_ROLE_VALUE}>Create new role...</option>
                  )}
                </select>
              </div>

              {/* Show user permissions in read-only mode when editing */}
              {editingUserId && editingUser && editingUser.permissions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current User Permissions (Read-only)
                  </label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-56 overflow-y-auto">
                    {editingUser.permissions.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {editingUser.permissions.map((permission) => (
                          <div
                            key={permission}
                            className="flex items-center gap-2 p-2 rounded-lg bg-white"
                          >
                            <div className="w-4 h-4 rounded border border-gray-300 bg-green-100 flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">
                                {PERMISSION_LABELS[permission as PermissionKey] || permission}
                              </span>
                              <p className="text-xs text-gray-500">
                                {permission}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        This user has no permissions assigned.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    These permissions are managed by the backend system and cannot be edited here.
                  </p>
                </div>
              )}

              {isCreatingNewRole && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role name
                  </label>
                  <Input
                    type="text"
                    value={formNewRoleName}
                    onChange={(e) => setFormNewRoleName(e.target.value)}
                    placeholder="e.g. Finance Officer"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu / feature access
                </label>
                <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-56 overflow-y-auto">
                  {menuAccessList.map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formMenuAccess.has(key)}
                        onChange={() => toggleMenuAccess(key)}
                        disabled={
                          !isCreatingNewRole || // Disable for existing roles
                          (key === 'create_role' && isHeadPastorRole(selectedRole))
                        }
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-60"
                      />
                      <span className={`text-sm ${!isCreatingNewRole ? 'text-gray-500' : 'text-gray-700'}`}>
                        {PERMISSION_LABELS[key]}
                      </span>
                    </label>
                  ))}
                </div>
                {!isCreatingNewRole && (
                  <p className="text-xs text-gray-500 mt-1">
                    Feature access is predefined for this role and cannot be modified.
                  </p>
                )}
                {isHeadPastorRole(selectedRole) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Head Pastor role always has &quot;Create Role&quot; and cannot be removed.
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <Button variant="outline" onClick={closeUserForm}>
                Cancel
              </Button>
              <Button onClick={saveUser}>
                {editingUserId ? 'Save changes' : 'Create user'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UsersAndRolesPage() {
  return (
    <ProtectedRoute
      allowedPermissions={['create_role', 'add_user']}
      allowSuperAdmin
    >
      <UsersAndRolesContent />
    </ProtectedRoute>
  );
}
