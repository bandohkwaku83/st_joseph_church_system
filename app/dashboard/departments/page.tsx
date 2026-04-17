'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HiOutlineOfficeBuilding,
  HiUserGroup,
  HiOutlineUsers,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, Tag, Button as AntButton, Input as AntInput, Drawer, message, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EditOutlined, EyeOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';

interface Department {
  id: number;
  name: string;
  description: string;
  inserted_at: string;
  updated_at: string;
  leader_id: number | null;
  members: OrganizationMember[];
}

interface BackendOrganization {
  id: number;
  name: string;
  description: string;
  inserted_at: string;
  updated_at: string;
  leader_id: number | null;
  members: {
    role: string;
    member_id: number;
    joined_at: string;
  }[];
}

interface OrganizationResponse {
  message: string;
  status: string;
  organisations: BackendOrganization[];
}

interface Role {
  role: string;
  permissions: string[];
  members: number;
}

interface OrganizationMember {
  role: string;
  member_id: number;
  joined_at: string;
}

interface CreateOrganizationPayload {
  organisation: {
    name: string;
    description: string;
    status: string;
    organisation_members: {
      member_id: number;
      role: string;
      joined_at: string;
    }[];
  };
}

export default function DepartmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole, hasPermission, isSuperAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Department | null>(null);
  const [managingOrganization, setManagingOrganization] = useState<Department | null>(null);
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    status: 'active',
  });
  const [manageForm, setManageForm] = useState({
    name: '',
    description: '',
    status: 'active',
  });

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await apiRequest<OrganizationResponse>('/organisations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.error) {
        message.error(`Failed to fetch organizations: ${response.error.message}`);
        return;
      }

      if (response.data?.organisations) {
        // Transform backend data to frontend format
        const transformedOrgs: Department[] = response.data.organisations.map(org => ({
          id: org.id,
          name: org.name,
          description: org.description,
          inserted_at: org.inserted_at,
          updated_at: org.updated_at,
          leader_id: org.leader_id,
          members: org.members || [],
        }));
        
        setDepartments(transformedOrgs);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      message.error('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  // Create organization
  const createOrganization = async (formData: typeof createForm) => {
    try {
      setCreating(true);
      const token = localStorage.getItem('auth_token');
      
      const payload: CreateOrganizationPayload = {
        organisation: {
          name: formData.name,
          description: formData.description,
          status: formData.status,
          organisation_members: [], // Empty for now, can be extended later
        },
      };

      const response = await apiRequest('/organisations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.error) {
        message.error(`Failed to create organization: ${response.error.message}`);
        return;
      }

      message.success('Organization created successfully!');
      setShowModal(false);
      setCreateForm({ name: '', description: '', status: 'active' });
      
      // Refresh the organizations list
      await fetchOrganizations();
    } catch (error) {
      console.error('Error creating organization:', error);
      message.error('Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  // Load organizations on component mount and when refresh param is present
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Check for refresh parameter and refetch if present
  useEffect(() => {
    const refresh = searchParams.get('refresh');
    if (refresh === 'true') {
      fetchOrganizations();
      // Clean up the URL parameter
      router.replace('/dashboard/departments');
    }
  }, [searchParams, router]);

  const roles: Role[] = [
    { role: 'Priest', permissions: ['Full Access'], members: 2 },
    { role: 'Admin', permissions: ['Members', 'Attendance', 'Finance'], members: 3 },
    { role: 'Treasurer', permissions: ['Finance', 'Reports'], members: 1 },
    { role: 'Department Leader', permissions: ['Department Members', 'Attendance'], members: 12 },
  ];

  // Pattern styles matching dashboard
  const patternStyles = [
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/svg%3E")',
    },
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
    },
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/svg%3E")',
    },
  ];

  // Calculate stats
  const stats = [
    { 
      label: 'Total Organizations', 
      value: departments.length.toString(), 
      icon: HiOutlineOfficeBuilding,
      color: 'text-blue-600'
    },
    { 
      label: 'Total Members', 
      value: departments.reduce((total, org) => total + org.members.length, 0).toString(), 
      icon: HiUserGroup,
      color: 'text-purple-600'
    },
  ];

  // Filter organizations
  const filteredOrganizations = departments.filter((org) =>
    org.name.toLowerCase().includes(organizationSearchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(organizationSearchTerm.toLowerCase())
  );
  // Role table columns
  const roleColumns: ColumnsType<Role> = [
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => (
        <span className="text-sm font-semibold text-gray-900">{text}</span>
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <div className="flex flex-wrap gap-2">
          {permissions.map((permission, index) => (
            <Tag key={index} color="blue">
              {permission}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members: number) => (
        <span className="text-sm text-gray-900">{members}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <AntButton 
          type="link" 
          icon={<EditOutlined />} 
          className="text-blue-600"
          title="Edit"
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Organizations & Roles
          </h1>
          <p className="text-gray-600 mt-1">
            Manage organizations, assign leaders, and configure role permissions
          </p>
        </div>
        {(hasPermission('organizations') || isSuperAdmin) && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchOrganizations}
              disabled={loading}
            >
              {loading ? <LoadingOutlined spin /> : 'Refresh'}
            </Button>
            <Button onClick={() => setShowModal(true)} className="shadow-lg">
              <PlusOutlined className="mr-2" />
              Create Organization
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const pattern = patternStyles[index % patternStyles.length];
          return (
            <Card key={index} className="relative overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ backgroundImage: pattern.background }}
              />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                    <p className={`text-xl font-semibold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Organizations Cards */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Organizations
            </CardTitle>
            <AntInput
              placeholder="Search organizations..."
              prefix={<SearchOutlined />}
              value={organizationSearchTerm}
              onChange={(e) => setOrganizationSearchTerm(e.target.value)}
              style={{ width: 250 }}
            />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {loading ? (
            <div className="text-center py-12">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <p className="text-gray-500 mt-4">Loading organizations...</p>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <HiOutlineOfficeBuilding className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No organizations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrganizations.map((org) => (
                <Card
                  key={org.id}
                  className="hover:shadow-lg transition-all duration-200 border border-gray-200"
                  style={{ backgroundColor: '#F5F5F5' }}
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                        <HiOutlineOfficeBuilding className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                          {org.name}
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <HiUserGroup className="h-4 w-4" />
                          Description
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                          {org.description}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <HiOutlineUsers className="h-4 w-4" />
                          Members
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {org.members.length}
                        </span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedOrganization(org);
                          setShowViewModal(true);
                        }}
                      >
                        <EyeOutlined className="mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          router.push(`/dashboard/departments/add-members?orgId=${org.id}&orgName=${encodeURIComponent(org.name)}`);
                        }}
                      >
                        <HiUserGroup className="mr-1" />
                        Update Members
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setManagingOrganization(org);
                          setManageForm({
                            name: org.name,
                            description: org.description,
                            status: 'active',
                          });
                          setShowManageModal(true);
                        }}
                      >
                        <EditOutlined className="mr-1" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Role-Based Access - Hidden for head_pastor and church_admin */}
      {!hasRole('head_pastor') && !hasRole('church_admin') && (
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-base font-semibold text-gray-900">
                Role-Based Access Control
              </CardTitle>
              <Button variant="outline" size="sm">
                Manage Roles
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Table
              columns={roleColumns}
              dataSource={roles}
              rowKey={(record) => `role-${record.role}`}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} roles`,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* View Organization Drawer */}
      <Drawer
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedOrganization(null);
        }}
        title="Organization Details"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      >
        {selectedOrganization && (
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <HiOutlineOfficeBuilding className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedOrganization.name}
                </h2>
                <Tag color="green" className="text-sm">
                  Active
                </Tag>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <HiUserGroup className="h-4 w-4 text-gray-500" />
                    {selectedOrganization.description}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Members</p>
                  <p className="text-base font-semibold text-blue-600 flex items-center gap-2">
                    <HiOutlineUsers className="h-4 w-4 text-blue-500" />
                    {selectedOrganization.members.length}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Members</h3>
                {selectedOrganization.members && selectedOrganization.members.length > 0 ? (
                  <Table
                    columns={[
                      {
                        title: 'Member ID',
                        dataIndex: 'member_id',
                        key: 'member_id',
                        render: (member_id: number) => (
                          <span className="text-sm font-medium text-gray-900">{member_id}</span>
                        ),
                      },
                      {
                        title: 'Role',
                        dataIndex: 'role',
                        key: 'role',
                        render: (role: string) => (
                          <Tag color="blue" className="text-sm">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Joined Date',
                        dataIndex: 'joined_at',
                        key: 'joined_at',
                        render: (joined_at: string) => (
                          <span className="text-sm text-gray-700">
                            {new Date(joined_at).toLocaleDateString()}
                          </span>
                        ),
                      },
                    ]}
                    dataSource={selectedOrganization.members}
                    rowKey={(record) => `member-${record.member_id}`}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} members`,
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <HiOutlineUsers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No members found in this organization</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedOrganization(null);
                  }}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
      {/* Manage Organization Modal */}
      <Drawer
        open={showManageModal}
        onClose={() => {
          setShowManageModal(false);
          setManagingOrganization(null);
        }}
        title="Manage Organization"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      >
        {managingOrganization && (
          <div className="p-4 sm:p-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                
                try {
                  const token = localStorage.getItem('auth_token');
                  
                  if (!token) {
                    message.error('No authentication token found');
                    return;
                  }

                  const payload = {
                    organisation: {
                      name: manageForm.name,
                      description: manageForm.description,
                      status: manageForm.status,
                      organisation_members: managingOrganization!.members.map(member => ({
                        member_id: member.member_id,
                        role: member.role,
                        joined_at: member.joined_at,
                      })),
                    },
                  };

                  const response = await apiRequest(`/organisations/${managingOrganization!.id}`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                  });

                  if (response.error) {
                    message.error(`Failed to update organization: ${response.error.message}`);
                    return;
                  }

                  message.success('Organization updated successfully!');
                  setShowManageModal(false);
                  setManagingOrganization(null);
                  
                  // Refresh the organizations list
                  await fetchOrganizations();
                } catch (error) {
                  console.error('Error updating organization:', error);
                  message.error('Failed to update organization');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={manageForm.name}
                  onChange={(e) => setManageForm({ ...manageForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={manageForm.description}
                  onChange={(e) => setManageForm({ ...manageForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Organization description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={manageForm.status}
                  onChange={(e) => setManageForm({ ...manageForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowManageModal(false);
                    setManagingOrganization(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Update Organization
                </Button>
              </div>
            </form>
          </div>
        )}
      </Drawer>
      {/* Create Organization Modal */}
      <Drawer
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Organization"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      >
        <div className="p-4 sm:p-6">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              createOrganization(createForm);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Choir, Ushers, Youth"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                required
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Organization description and purpose..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select 
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
                disabled={creating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Drawer>
    </div>
  );
}