'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HiOutlineOfficeBuilding,
  HiUserGroup,
  HiOutlineUsers,
  HiArrowLeft,
  HiCheck,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input as AntInput, message, Spin, Checkbox, Tag } from 'antd';
import { SearchOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';

interface Member {
  id: number;
  name: string;
  email: string;
  parish_number: string;
}

interface Organization {
  id: number;
  name: string;
  description: string;
  members: {
    role: string;
    member_id: number;
    joined_at: string;
  }[];
}

interface CurrentMember {
  id: number;
  name: string;
  parish_number: string;
  role: string;
  joined_at: string;
  member_id: number;
}

interface SelectedMember {
  id: number;
  name: string;
  parish_number: string;
  role: string;
  joined_at: string;
}

interface MemberChanges {
  toAdd: SelectedMember[];
  toRemove: number[]; // member_ids to remove
  toUpdate: { member_id: number; role: string; joined_at: string }[]; // existing members with updated info
}

export default function AddMembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, isSuperAdmin } = useAuth();
  
  const orgId = searchParams.get('orgId');
  const orgName = searchParams.get('orgName');
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [currentMembers, setCurrentMembers] = useState<CurrentMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [removedMemberIds, setRemovedMemberIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if no organization ID
  useEffect(() => {
    if (!orgId) {
      router.push('/dashboard/departments');
      return;
    }
  }, [orgId, router]);

  // Fetch organization details and available members
  useEffect(() => {
    if (orgId) {
      fetchOrganizationAndMembers();
    }
  }, [orgId]);

  const fetchOrganizationAndMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        message.error('No authentication token found');
        return;
      }

      // Fetch organization details and members in parallel
      const [orgResponse, membersResponse] = await Promise.all([
        apiRequest<{ organisations: Organization[] }>('/organisations', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        apiRequest<{ members: any[] }>('/members', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      // Handle organization response
      if (orgResponse.error) {
        message.error(`Failed to fetch organization: ${orgResponse.error.message}`);
        return;
      }

      const org = orgResponse.data?.organisations?.find(o => o.id === parseInt(orgId!));
      if (!org) {
        message.error('Organization not found');
        router.push('/dashboard/departments');
        return;
      }
      setOrganization(org);

      // Handle members response
      if (membersResponse.error) {
        message.error(`Failed to fetch members: ${membersResponse.error.message}`);
        return;
      }

      if (membersResponse.data?.members) {
        const mappedMembers = membersResponse.data.members.map((member: any) => ({
          id: member.id,
          name: `${member.other_names} ${member.surname}`.trim(),
          email: member.email_address || '',
          parish_number: member.parish_number || '',
        }));
        setAvailableMembers(mappedMembers);

        // Map current organization members to include member details
        if (org) {
          const currentMembersWithDetails = org.members.map(orgMember => {
            const memberDetail = mappedMembers.find(m => m.id === orgMember.member_id);
            return {
              id: memberDetail?.id || orgMember.member_id,
              name: memberDetail?.name || `Member #${orgMember.member_id}`,
              parish_number: memberDetail?.parish_number || '',
              role: orgMember.role,
              joined_at: orgMember.joined_at,
              member_id: orgMember.member_id,
            };
          });
          setCurrentMembers(currentMembersWithDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  // Filter members based on search and exclude already selected and current members (not removed)
  const filteredMembers = availableMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.parish_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const notAlreadySelected = !selectedMembers.some(selected => selected.id === member.id);
    const notCurrentMember = !currentMembers.some(current => 
      current.member_id === member.id && !removedMemberIds.includes(current.member_id)
    );
    
    return matchesSearch && notAlreadySelected && notCurrentMember;
  });

  // Add member to selection
  const addMemberToSelection = (member: Member) => {
    const newSelectedMember: SelectedMember = {
      id: member.id,
      name: member.name,
      parish_number: member.parish_number,
      role: 'member',
      joined_at: new Date().toISOString().split('T')[0],
    };
    setSelectedMembers([...selectedMembers, newSelectedMember]);
  };

  // Remove current member (mark for removal)
  const removeCurrentMember = (memberId: number) => {
    setRemovedMemberIds([...removedMemberIds, memberId]);
  };

  // Restore removed member
  const restoreRemovedMember = (memberId: number) => {
    setRemovedMemberIds(removedMemberIds.filter(id => id !== memberId));
  };

  // Update current member details
  const updateCurrentMember = (memberId: number, field: 'role' | 'joined_at', value: string) => {
    setCurrentMembers(currentMembers.map(member =>
      member.member_id === memberId ? { ...member, [field]: value } : member
    ));
  };

  // Remove member from selection
  const removeMemberFromSelection = (memberId: number) => {
    setSelectedMembers(selectedMembers.filter(member => member.id !== memberId));
  };

  // Update member role
  const updateMemberRole = (memberId: number, role: string) => {
    setSelectedMembers(selectedMembers.map(member =>
      member.id === memberId ? { ...member, role } : member
    ));
  };

  // Update member joined date
  const updateMemberJoinedDate = (memberId: number, joined_at: string) => {
    setSelectedMembers(selectedMembers.map(member =>
      member.id === memberId ? { ...member, joined_at } : member
    ));
  };

  // Submit member changes
  const handleSubmit = async () => {
    const hasChanges = selectedMembers.length > 0 || removedMemberIds.length > 0;
    
    if (!hasChanges) {
      message.warning('No changes to save.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        message.error('No authentication token found');
        return;
      }

      // Prepare the complete member list for the organization
      const allMembers = [
        // Existing members that are not removed (with potential updates)
        ...currentMembers
          .filter(member => !removedMemberIds.includes(member.member_id))
          .map(member => ({
            member_id: member.member_id,
            role: member.role,
            joined_at: member.joined_at,
          })),
        // New members to add
        ...selectedMembers.map(member => ({
          member_id: member.id,
          role: member.role,
          joined_at: member.joined_at,
        })),
      ];

      const payload = {
        organisation: {
          name: organization!.name,
          description: organization!.description,
          status: 'active',
          organisation_members: allMembers,
        },
      };

      const response = await apiRequest(`/organisations/${orgId}`, {
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

      const addedCount = selectedMembers.length;
      const removedCount = removedMemberIds.length;
      
      let successMessage = 'Organization updated successfully!';
      if (addedCount > 0 && removedCount > 0) {
        successMessage = `Organization updated! Added ${addedCount} and removed ${removedCount} members.`;
      } else if (addedCount > 0) {
        successMessage = `Organization updated! Added ${addedCount} member(s).`;
      } else if (removedCount > 0) {
        successMessage = `Organization updated! Removed ${removedCount} member(s).`;
      }
      
      message.success(successMessage);
      
      // Navigate back to departments page with refresh parameter
      router.push('/dashboard/departments?refresh=true');
    } catch (error) {
      console.error('Error updating organization:', error);
      message.error('Failed to update organization');
    } finally {
      setSubmitting(false);
    }
  };

  if (!orgId) {
    return null; // Will redirect
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/departments')}
          className="flex items-center gap-2"
        >
          <HiArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Update Members
          </h1>
          <p className="text-gray-600 mt-1">
            Manage members for {orgName || organization?.name || 'organization'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <p className="text-gray-500 mt-4">Loading organization and members...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Current Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiOutlineOfficeBuilding className="h-5 w-5" />
                Current Members ({currentMembers.filter(m => !removedMemberIds.includes(m.member_id)).length})
              </CardTitle>
              {organization && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <HiOutlineOfficeBuilding className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">{organization.name}</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    {removedMemberIds.length > 0 && (
                      <span className="text-red-600">
                        {removedMemberIds.length} marked for removal • 
                      </span>
                    )}
                    {selectedMembers.length > 0 && (
                      <span className="text-green-600">
                        {selectedMembers.length} to be added
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {currentMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HiOutlineUsers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No current members</p>
                  </div>
                ) : (
                  currentMembers.map((member) => (
                    <div
                      key={member.member_id}
                      className={`p-3 border rounded-lg transition-all ${
                        removedMemberIds.includes(member.member_id)
                          ? 'border-red-200 bg-red-50 opacity-60'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className={`font-medium ${
                            removedMemberIds.includes(member.member_id) 
                              ? 'text-red-700 line-through' 
                              : 'text-gray-900'
                          }`}>
                            {member.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Parish: {member.parish_number}
                          </p>
                        </div>
                        {removedMemberIds.includes(member.member_id) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreRemovedMember(member.member_id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeCurrentMember(member.member_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      {!removedMemberIds.includes(member.member_id) && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Role
                            </label>
                            <select
                              value={member.role}
                              onChange={(e) => updateCurrentMember(member.member_id, 'role', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                            >
                              <option value="member">Member</option>
                              <option value="secretary">Secretary</option>
                              <option value="treasurer">Treasurer</option>
                              <option value="leader">Leader</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Joined Date
                            </label>
                            <input
                              type="date"
                              value={member.joined_at}
                              onChange={(e) => updateCurrentMember(member.member_id, 'joined_at', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiOutlineUsers className="h-5 w-5" />
                Available Members
              </CardTitle>
              <div className="mt-4">
                <AntInput
                  placeholder="Search by name, parish number, or email..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
                <div className="text-sm text-gray-600">
                  {filteredMembers.length} of {availableMembers.length} members available
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HiOutlineUsers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>
                      {searchTerm ? `No members found matching "${searchTerm}"` : 'No available members'}
                    </p>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">
                          Parish: {member.parish_number} • {member.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addMemberToSelection(member)}
                        className="flex items-center gap-1"
                      >
                        <HiCheck className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          {/* Selected Members to Add */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiUserGroup className="h-5 w-5" />
                New Members ({selectedMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {selectedMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HiUserGroup className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No new members selected</p>
                    <p className="text-sm">Select members from available list to add them</p>
                  </div>
                ) : (
                  selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 border border-gray-200 rounded-lg bg-green-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">Parish: {member.parish_number}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeMemberFromSelection(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Role
                          </label>
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="member">Member</option>
                            <option value="secretary">Secretary</option>
                            <option value="treasurer">Treasurer</option>
                            <option value="leader">Leader</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Joined Date
                          </label>
                          <input
                            type="date"
                            value={member.joined_at}
                            onChange={(e) => updateMemberJoinedDate(member.id, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      {!loading && (
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/departments')}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedMembers.length === 0 && removedMemberIds.length === 0 || submitting}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
                Updating Members...
              </>
            ) : (
              <>
                <HiCheck className="h-4 w-4" />
                Update Members
                {(selectedMembers.length > 0 || removedMemberIds.length > 0) && (
                  <span className="ml-1">
                    ({selectedMembers.length > 0 && `+${selectedMembers.length}`}
                    {selectedMembers.length > 0 && removedMemberIds.length > 0 && ', '}
                    {removedMemberIds.length > 0 && `-${removedMemberIds.length}`})
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}