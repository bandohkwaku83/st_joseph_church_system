'use client';

import { useState } from 'react';
import {
  HiOutlineOfficeBuilding,
  HiUserGroup,
  HiOutlineUsers,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, Tag, Space, Button as AntButton, Input as AntInput, Drawer } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';

interface Department {
  id: number;
  name: string;
  leader: string;
  members: number;
  status: 'Active' | 'Inactive';
  description: string;
  type: 'organization';
}

interface Role {
  role: string;
  permissions: string[];
  members: number;
}

interface OrganizationMember {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

export default function DepartmentsPage() {
  const { hasRole, hasPermission, isSuperAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Department | null>(null);
  const [managingOrganization, setManagingOrganization] = useState<Department | null>(null);
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [manageForm, setManageForm] = useState({
    name: '',
    leader: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: 'Christian Mothers Association', leader: 'Mary Johnson', members: 85, status: 'Active', description: 'Christian Mothers Association', type: 'organization' },
    { id: 2, name: 'Knights of St. John International (KSJI)', leader: 'James Wilson', members: 42, status: 'Active', description: 'Knights of St. John International', type: 'organization' },
    { id: 3, name: 'Knights and Ladies of Marshall', leader: 'David Brown', members: 38, status: 'Active', description: 'Knights and Ladies of Marshall', type: 'organization' },
    { id: 4, name: 'Catholic Youth Organization (CYO)', leader: 'Michael Johnson', members: 120, status: 'Active', description: 'Catholic Youth Organization', type: 'organization' },
    { id: 5, name: 'Legion of Mary', leader: 'Patricia Brown', members: 55, status: 'Active', description: 'Legion of Mary', type: 'organization' },
    { id: 6, name: 'Choir', leader: 'Sarah Williams', members: 48, status: 'Active', description: 'Parish choir ministry', type: 'organization' },
    { id: 7, name: 'Altar Servers', leader: 'Emmanuel Osei', members: 22, status: 'Active', description: 'Altar servers ministry', type: 'organization' },
    { id: 8, name: 'Lectors', leader: 'Linda Thompson', members: 18, status: 'Active', description: 'Lectors and readers ministry', type: 'organization' },
  ]);

  const roles: Role[] = [
    { role: 'Priest', permissions: ['Full Access'], members: 2 },
    { role: 'Admin', permissions: ['Members', 'Attendance', 'Finance'], members: 3 },
    { role: 'Treasurer', permissions: ['Finance', 'Reports'], members: 1 },
    { role: 'Department Leader', permissions: ['Department Members', 'Attendance'], members: 12 },
  ];

  // Sample members data for organizations
  const organizationMembers: Record<number, OrganizationMember[]> = {
    1: [
      { id: 1, name: 'Mary Johnson', phone: '+233 24 123 4567', email: 'mary.johnson@gmail.com' },
      { id: 2, name: 'Grace Mensah', phone: '+233 20 234 5678', email: 'grace.mensah@yahoo.com' },
      { id: 3, name: 'Ama Adjei', phone: '+233 26 345 6789', email: 'ama.adjei@hotmail.com' },
    ],
    2: [
      { id: 1, name: 'James Wilson', phone: '+233 24 111 2222', email: 'james.wilson@gmail.com' },
      { id: 2, name: 'David Osei', phone: '+233 20 222 3333', email: 'david.osei@yahoo.com' },
    ],
    3: [
      { id: 1, name: 'David Brown', phone: '+233 24 555 6666', email: 'david.brown@gmail.com' },
      { id: 2, name: 'Patricia Brown', phone: '+233 20 666 7777', email: 'patricia.brown@yahoo.com' },
    ],
    4: [
      { id: 1, name: 'Michael Johnson', phone: '+233 24 999 0000', email: 'michael.johnson@gmail.com' },
      { id: 2, name: 'Prince Owusu', phone: '+233 20 000 1111', email: 'prince.owusu@yahoo.com' },
      { id: 3, name: 'Samuel Tetteh', phone: '+233 26 111 2222', email: 'samuel.tetteh@hotmail.com' },
    ],
    5: [
      { id: 1, name: 'Patricia Brown', phone: '+233 24 222 3333', email: 'patricia.brown@gmail.com' },
      { id: 2, name: 'Ruth Adjei', phone: '+233 20 333 4444', email: 'ruth.adjei@yahoo.com' },
    ],
    6: [
      { id: 1, name: 'Sarah Williams', phone: '+233 24 444 5555', email: 'sarah.williams@gmail.com' },
      { id: 2, name: 'Linda Thompson', phone: '+233 20 555 6666', email: 'linda.thompson@yahoo.com' },
    ],
    7: [
      { id: 1, name: 'Emmanuel Osei', phone: '+233 24 777 8888', email: 'emmanuel.osei@gmail.com' },
      { id: 2, name: 'Daniel Appiah', phone: '+233 20 888 9999', email: 'daniel.appiah@yahoo.com' },
    ],
    8: [
      { id: 1, name: 'Linda Thompson', phone: '+233 24 999 0000', email: 'linda.thompson@gmail.com' },
      { id: 2, name: 'Cynthia Mensah', phone: '+233 20 000 1111', email: 'cynthia.mensah@yahoo.com' },
    ],
  };

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
  const totalOrganizations = departments.length;
  const uniqueLeaders = new Set(departments.map(d => d.leader)).size;

  const stats = [
    { 
      label: 'Total Organizations', 
      value: totalOrganizations.toString(), 
      icon: HiOutlineOfficeBuilding,
      color: 'text-blue-600'
    },
    { 
      label: 'Leaders', 
      value: uniqueLeaders.toString(), 
      icon: HiUserGroup,
      color: 'text-purple-600'
    },
  ];

  // Filter organizations
  const filteredOrganizations = departments.filter((org) =>
    org.name.toLowerCase().includes(organizationSearchTerm.toLowerCase()) ||
    org.leader.toLowerCase().includes(organizationSearchTerm.toLowerCase())
  );

  // Table columns for Organizations
  const organizationColumns: ColumnsType<Department> = [
    {
      title: 'Organization Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span className="text-sm font-semibold text-gray-900">{text}</span>
      ),
    },
    {
      title: 'Leader',
      dataIndex: 'leader',
      key: 'leader',
      render: (text: string) => (
        <span className="text-sm text-gray-900">{text}</span>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members: number) => (
        <span className="text-sm font-semibold text-blue-600">{members}</span>
      ),
      sorter: (a, b) => a.members - b.members,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'green' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <AntButton 
            type="link" 
            icon={<EyeOutlined />} 
            className="text-blue-600"
            title="View"
          />
          <AntButton 
            type="link" 
            icon={<EditOutlined />} 
            className="text-green-600"
            title="Manage"
          />
        </Space>
      ),
    },
  ];

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
        {(hasPermission('departments') || isSuperAdmin) && (
          <Button onClick={() => setShowModal(true)} className="shadow-lg">
            <PlusOutlined className="mr-2" />
            Create Organization
          </Button>
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
          {filteredOrganizations.length === 0 ? (
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
                          Leader
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {org.leader}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <HiOutlineUsers className="h-4 w-4" />
                          Members
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {org.members}
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
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setManagingOrganization(org);
                          setManageForm({
                            name: org.name,
                            leader: org.leader,
                            status: org.status,
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
                <Tag color={selectedOrganization.status === 'Active' ? 'green' : 'default'} className="text-sm">
                  {selectedOrganization.status}
                </Tag>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Leader</p>
                  <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <HiUserGroup className="h-4 w-4 text-gray-500" />
                    {selectedOrganization.leader}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Members</p>
                  <p className="text-base font-semibold text-blue-600 flex items-center gap-2">
                    <HiOutlineUsers className="h-4 w-4 text-blue-500" />
                    {selectedOrganization.members}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Members</h3>
                <Table
                  columns={[
                    {
                      title: 'Name',
                      dataIndex: 'name',
                      key: 'name',
                      render: (text: string) => (
                        <span className="text-sm font-medium text-gray-900">{text}</span>
                      ),
                    },
                    {
                      title: 'Contact',
                      dataIndex: 'phone',
                      key: 'phone',
                      render: (text: string) => (
                        <span className="text-sm text-gray-700">{text}</span>
                      ),
                    },
                  ]}
                  dataSource={organizationMembers[selectedOrganization.id] || []}
                  rowKey={(record) => `member-${record.id}`}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} members`,
                  }}
                />
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
              onSubmit={(e) => {
                e.preventDefault();
                if (managingOrganization) {
                  setDepartments((prev) =>
                    prev.map((dept) =>
                      dept.id === managingOrganization.id
                        ? {
                            ...dept,
                            name: manageForm.name,
                            leader: manageForm.leader,
                            status: manageForm.status,
                          }
                        : dept
                    )
                  );
                  setShowManageModal(false);
                  setManagingOrganization(null);
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
                  Leader *
                </label>
                <select
                  required
                  value={manageForm.leader}
                  onChange={(e) => setManageForm({ ...manageForm, leader: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Leader</option>
                  <option>David Brown</option>
                  <option>Sarah Williams</option>
                  <option>Jane Smith</option>
                  <option>Michael Johnson</option>
                  <option>Robert Taylor</option>
                  <option>Mary Johnson</option>
                  <option>James Wilson</option>
                  <option>Patricia Brown</option>
                  <option>Emily Davis</option>
                  <option>Linda Thompson</option>
                  <option>Thomas Anderson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={manageForm.status}
                  onChange={(e) =>
                    setManageForm({ ...manageForm, status: e.target.value as 'Active' | 'Inactive' })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Choir, Ushers, Youth"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Organization description and purpose..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leader *
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option>Select Leader</option>
                <option>John Doe</option>
                <option>Jane Smith</option>
                <option>Michael Johnson</option>
                <option>Sarah Williams</option>
                <option>David Brown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Organization
              </Button>
            </div>
          </form>
        </div>
      </Drawer>
    </div>
  );
}
