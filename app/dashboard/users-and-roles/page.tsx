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
    addRole,
    updateRole,
    addUser,
    updateUser,
    deleteUser,
    hasPermission,
  } = useAuth();
  const { showToast } = useToast();
  const roles = getRoles();
  const users = getUsers();

  const isHeadPastorRole = (role: Role | undefined) =>
    role?.id === HEAD_PASTOR_ROLE_ID || role?.isSystemRole;

  const currentUserRole = roles.find((r) => r.id === user?.roleId);
  const canManageUsers = hasPermission('add_users') || isHeadPastorRole(currentUserRole);
  const canCreateNewRole = hasPermission('manage_roles') || isHeadPastorRole(currentUserRole);

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
    () => PERMISSION_KEYS.filter((k) => k !== 'manage_roles'),
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
    const firstRole = roles.find((r) => r.id === firstRoleId);
    setFormMenuAccess(firstRole ? new Set(firstRole.permissionKeys) : new Set());
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
    setFormMenuAccess(role ? new Set(role.permissionKeys) : new Set());
  };

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

  const handleDeleteUser = (id: string, name: string, roleId: string) => {
    if (roleId === HEAD_PASTOR_ROLE_ID) {
      showToast('The Head Pastor account cannot be deleted.', 'error');
      return;
    }
    if (typeof window === 'undefined') return;
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    deleteUser(id);
    showToast('User deleted.', 'success');
  };

  const toggleMenuAccess = (key: PermissionKey) => {
    setFormMenuAccess((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveUser = () => {
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
      updateUser({
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
      addUser({
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
  };

  if (!canManageUsers) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add User</h1>
        <p className="text-gray-600 mt-1">
          Create and manage users. Set name, username, password, role, and menu access.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openAddUser} className="flex items-center gap-2">
          <HiPlus className="h-5 w-5" />
          Add User
        </Button>
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
              {users.map((u) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                      setFormMenuAccess(role ? new Set(role.permissionKeys) : new Set());
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
                          key === 'manage_roles' &&
                          isHeadPastorRole(selectedRole)
                        }
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-60"
                      />
                      <span className="text-sm text-gray-700">
                        {PERMISSION_LABELS[key]}
                      </span>
                    </label>
                  ))}
                </div>
                {isHeadPastorRole(selectedRole) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Head Pastor role always has &quot;Manage Roles&quot; and cannot be removed.
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
      allowedPermissions={['manage_roles', 'add_users']}
      allowSuperAdmin
    >
      <UsersAndRolesContent />
    </ProtectedRoute>
  );
}
