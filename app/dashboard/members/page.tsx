'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  HiOutlineUsers,
  HiUserAdd,
  HiOutlineCalendar,
  HiTrendingUp,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, Tag, Input, Select, Space, Button as AntButton, Steps, Form, DatePicker, Row, Col, Drawer, Upload, Radio } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd';
import { SearchOutlined, FilterOutlined, DownloadOutlined, EyeOutlined, EditOutlined, UploadOutlined, CameraOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { apiRequest, getServerBase } from '@/lib/api';

type Gender = 'male' | 'female' | 'child';
type Status = 'Active' | 'Inactive';

/** Ghana's 16 administrative regions (post-2019). */
const GHANA_REGIONS: { label: string; value: string }[] = [
  { label: 'Ahafo Region', value: 'Ahafo Region' },
  { label: 'Ashanti Region', value: 'Ashanti Region' },
  { label: 'Bono Region', value: 'Bono Region' },
  { label: 'Bono East Region', value: 'Bono East Region' },
  { label: 'Central Region', value: 'Central Region' },
  { label: 'Eastern Region', value: 'Eastern Region' },
  { label: 'Greater Accra Region', value: 'Greater Accra Region' },
  { label: 'North East Region', value: 'North East Region' },
  { label: 'Northern Region', value: 'Northern Region' },
  { label: 'Oti Region', value: 'Oti Region' },
  { label: 'Savannah Region', value: 'Savannah Region' },
  { label: 'Upper East Region', value: 'Upper East Region' },
  { label: 'Upper West Region', value: 'Upper West Region' },
  { label: 'Volta Region', value: 'Volta Region' },
  { label: 'Western Region', value: 'Western Region' },
  { label: 'Western North Region', value: 'Western North Region' },
];

// Helper component for displaying info rows
const InfoRow = ({ label, value, breakWords, showEmpty = true }: { label: string; value?: string | number | boolean | null | undefined; breakWords?: boolean; showEmpty?: boolean }) => {
  const displayValue = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '-';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  const finalValue = displayValue(value);
  
  if (!showEmpty && finalValue === '-') return null;
  
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium text-right max-w-[60%] ${breakWords ? 'break-words' : ''} ${finalValue === '-' ? 'text-gray-400' : 'text-gray-900'}`}>
        {finalValue}
      </span>
    </div>
  );
};

interface Member {
  id: number;
  churchNumber: string; // Unique church number for each member
  name: string;
  email: string;
  phone: string;
  department: string;
  status: Status;
  joinDate: string;
  gender: Gender;
  age?: number;
  // Updated fields from new registration form
  surname?: string;
  otherNames?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  nationality?: string;
  hometown?: string;
  region?: string;
  residentialAddress?: string;
  digitalAddress?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  membershipStatus?: string; // Full Member, Catechumen, Adherent, Child
  dateJoinedSociety?: string;
  transferredFromAnotherSociety?: boolean;
  formerSocietyName?: string;
  baptised?: boolean;
  baptismDate?: string;
  baptismPlace?: string;
  confirmed?: boolean;
  confirmationDate?: string;
  confirmationPlace?: string;
  organisations?: Array<{
    id: number;
    name: string;
    role: string;
    joined_at: string;
  }>;
  otherOrganisation?: string;
  occupation?: string;
  placeOfWork?: string;
  skillsTalents?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  nextOfKinAddress?: string;
  profileImage?: string; // Base64 encoded image or URL
}

export default function MembersPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const drawerBodyRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const regionSelectOptions = useMemo(() => {
    const saved = editingMember?.region?.trim();
    if (saved && !GHANA_REGIONS.some((r) => r.value === saved)) {
      return [{ label: `${saved} (current)`, value: saved }, ...GHANA_REGIONS];
    }
    return GHANA_REGIONS;
  }, [editingMember?.region]);

  // API integration for members
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([]);

  // Backend member interface to match API response
  interface BackendMember {
    id: number;
    parish_number: string;
    profile_pic?: string;
    surname: string;
    other_names: string;
    gender: 'male' | 'female';
    date_of_birth: string;
    marital_status: string;
    nationality?: string;
    hometown: string;
    region: string;
    residential_address: string;
    digital_address: string;
    mobile_number: string;
    whatsapp_number: string;
    email_address: string;
    membership_status: string;
    date_joined_society: string;
    transferred_from_another_society: boolean;
    former_society?: string;
    baptised: boolean;
    date_of_baptism?: string;
    place_of_baptism?: string;
    confirmed: boolean;
    date_of_confirmation?: string;
    place_of_confirmation?: string;
    natal_group?: string;
    occupation: string;
    place_of_work_or_school: string;
    skills_or_talent: string;
    organisations?: Array<{
      id: number;
      name: string;
      status: string;
      description: string;
      role: string;
      joined_at: string;
    }>;
    next_of_kin: {
      name: string;
      relationship: string;
      mobile_number: string;
      address: string;
    };
    is_active?: boolean | null;
  }

  // Convert backend member to frontend member format
  const mapBackendMember = (backendMember: BackendMember): Member => {
    const fullName = [backendMember.surname, backendMember.other_names]
      .filter(Boolean)
      .join(' ');

    // Calculate age from date of birth
    let age: number | undefined;
    if (backendMember.date_of_birth) {
      const birthDate = new Date(backendMember.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Map membership status
    const membershipStatusMap: Record<string, string> = {
      'full_member': 'Full Member',
      'catechumen': 'Catechumen',
      'adherent': 'Adherent',
      'child': 'Child'
    };

    const membershipStatus = membershipStatusMap[backendMember.membership_status] || 'Full Member';

    // Determine status based on is_active field
    // Show "Active" for all cases except when is_active is explicitly false
    const status: Status = backendMember.is_active === false ? 'Inactive' : 'Active';

    // Map gender to include child option
    let gender: Gender;
    if (backendMember.membership_status === 'child') {
      gender = 'child';
    } else {
      gender = backendMember.gender as Gender;
    }

    return {
      id: backendMember.id,
      churchNumber: backendMember.parish_number,
      name: fullName,
      email: backendMember.email_address || '',
      phone: backendMember.mobile_number || '',
      department: 'General', // Default department since backend doesn't have this
      status: status,
      joinDate: backendMember.date_joined_society || new Date().toISOString().split('T')[0],
      gender: gender,
      age: age,
      // Map all backend fields
      surname: backendMember.surname,
      otherNames: backendMember.other_names,
      dateOfBirth: backendMember.date_of_birth,
      maritalStatus: backendMember.marital_status,
      nationality: backendMember.nationality,
      hometown: backendMember.hometown,
      region: backendMember.region,
      residentialAddress: backendMember.residential_address,
      digitalAddress: backendMember.digital_address,
      mobileNumber: backendMember.mobile_number,
      whatsappNumber: backendMember.whatsapp_number,
      membershipStatus: membershipStatus,
      dateJoinedSociety: backendMember.date_joined_society,
      transferredFromAnotherSociety: backendMember.transferred_from_another_society,
      formerSocietyName: backendMember.former_society,
      baptised: backendMember.baptised,
      baptismDate: backendMember.date_of_baptism,
      baptismPlace: backendMember.place_of_baptism,
      confirmed: backendMember.confirmed,
      confirmationDate: backendMember.date_of_confirmation,
      confirmationPlace: backendMember.place_of_confirmation,
      occupation: backendMember.occupation,
      placeOfWork: backendMember.place_of_work_or_school,
      skillsTalents: backendMember.skills_or_talent,
      organisations: backendMember.organisations?.map(org => ({
        id: org.id,
        name: org.name,
        role: org.role,
        joined_at: org.joined_at,
      })) || [],
      nextOfKinName: backendMember.next_of_kin?.name,
      nextOfKinRelationship: backendMember.next_of_kin?.relationship,
      nextOfKinPhone: backendMember.next_of_kin?.mobile_number,
      nextOfKinAddress: backendMember.next_of_kin?.address,
      profileImage: backendMember.profile_pic 
        ? (backendMember.profile_pic.startsWith('data:') 
            ? backendMember.profile_pic 
            : `${getServerBase()}${backendMember.profile_pic}`)
        : undefined,
    };
  };

  // Fetch members from API
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await apiRequest<{ members: BackendMember[] }>('members', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.members) {
        const mappedMembers = response.data.members.map(mapBackendMember);
        setMembers(mappedMembers);
      } else if (response.error) {
        console.error('Failed to fetch members:', response.error.message || response.error);
        setError(response.error.message || 'Failed to fetch members');
      } else {
        console.warn('Unexpected API response format:', response);
        setError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Network error occurred while fetching members');
    } finally {
      setLoading(false);
    }
  };

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found for fetching organizations');
        return;
      }

      const response = await apiRequest<{ organisations: { id: number; name: string; description: string }[] }>('/organisations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.organisations) {
        const orgs = response.data.organisations.map(org => ({ id: org.id, name: org.name }));
        setOrganizations(orgs);
      } else if (response.error) {
        console.error('Error fetching organizations:', response.error);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  // Fetch members and organizations on component mount
  useEffect(() => {
    fetchMembers();
    fetchOrganizations();
  }, []);

  // Scroll drawer content to top when step changes so the current step is visible
  useEffect(() => {
    if (showModal && drawerBodyRef.current) {
      drawerBodyRef.current.scrollTop = 0;
    }
  }, [currentStep, showModal]);

  // Watch DOB to auto-fill the Natal Group (day born) field
  const watchedDob = Form.useWatch('dateOfBirth', form);
  useEffect(() => {
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (watchedDob) {
      const d = dayjs.isDayjs(watchedDob) ? watchedDob : dayjs(watchedDob);
      if (d.isValid()) {
        form.setFieldsValue({ natalGroup: DAY_NAMES[d.day()] });
        return;
      }
    }
    form.setFieldsValue({ natalGroup: undefined });
  }, [watchedDob, form]);

  // Function to generate unique church number
  const generateChurchNumber = (existingMembers: Member[]): string => {
    // Find the highest existing church number
    const existingNumbers = existingMembers
      .map(m => m.churchNumber)
      .filter(num => num && num.startsWith('CH-'))
      .map(num => {
        const match = num.match(/CH-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = maxNumber + 1;
    
    // Format as CH-0001, CH-0002, etc.
    return `CH-${String(nextNumber).padStart(4, '0')}`;
  };

  // Function to open edit member modal
  const openEditMember = (member: Member) => {
    setEditingMember(member);
    setShowModal(true);
    setCurrentStep(0);
    
    // Calculate age from date of birth if available
    let calculatedAge: number | undefined;
    if (member.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(member.dateOfBirth);
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }
    
    // Populate form with existing member data (including calculated age)
    form.setFieldsValue({
      profileImage: member.profileImage,
      surname: member.surname,
      otherNames: member.otherNames,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth ? dayjs(member.dateOfBirth) : undefined,
      age: calculatedAge,
      maritalStatus: member.maritalStatus,
      nationality: member.nationality,
      hometown: member.hometown,
      region: member.region,
      occupation: member.occupation,
      placeOfWork: member.placeOfWork,
      skillsTalents: member.skillsTalents,
      nextOfKinName: member.nextOfKinName,
      nextOfKinRelationship: member.nextOfKinRelationship,
      nextOfKinPhone: member.nextOfKinPhone,
      nextOfKinAddress: member.nextOfKinAddress,
      residentialAddress: member.residentialAddress,
      digitalAddress: member.digitalAddress,
      mobileNumber: member.mobileNumber,
      whatsappNumber: member.whatsappNumber,
      email: member.email,
      membershipStatus: member.membershipStatus,
      dateJoinedSociety: member.dateJoinedSociety ? dayjs(member.dateJoinedSociety) : undefined,
      transferredFromAnotherSociety: member.transferredFromAnotherSociety,
      formerSocietyName: member.formerSocietyName,
      organisations: member.organisations?.map(org => org.id) || [],
      baptised: member.baptised,
      baptismDate: member.baptismDate ? dayjs(member.baptismDate) : undefined,
      baptismPlace: member.baptismPlace,
      confirmed: member.confirmed,
      confirmationDate: member.confirmationDate ? dayjs(member.confirmationDate) : undefined,
      confirmationPlace: member.confirmationPlace,
    });

    // Set profile image preview if exists
    if (member.profileImage) {
      setProfileImagePreview(member.profileImage);
    }
  };

  // Function to open add member modal
  const openAddMember = () => {
    setEditingMember(null);
    setShowModal(true);
    setCurrentStep(0);
    setProfileImagePreview(null);
    setFileList([]);
    form.resetFields();
  };

  const filteredMembers = members
    .filter((member) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        member.department.toLowerCase().includes(searchLower) ||
        member.churchNumber?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => b.id - a.id); // Sort by ID descending (latest first)

  // Calculate stats from members data
  const total = loading ? 0 : members.length;
  const active = loading ? 0 : members.filter(m => m.status === 'Active').length;
  const children = loading ? 0 : members.filter(m => m.gender === 'child' || m.membershipStatus === 'Child').length;
  const men = loading ? 0 : members.filter(m => m.gender === 'male').length;
  const women = loading ? 0 : members.filter(m => m.gender === 'female').length;

  // Pattern SVG definitions (matching dashboard style)
  const patternStyles = [
    // Pattern 1: Dots
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
    // Pattern 2: Grid
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/svg%3E")',
    },
    // Pattern 3: Waves
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
    },
    // Pattern 4: Diagonal lines
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/svg%3E")',
    },
    // Pattern 5: Circles
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.12\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'3\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
  ];

  const stats = [
    { label: 'Total Members', value: loading ? '...' : total.toLocaleString(), icon: HiOutlineUsers },
    { label: 'Active Members', value: loading ? '...' : active.toLocaleString(), icon: HiTrendingUp },
    { label: 'Children', value: loading ? '...' : children.toLocaleString(), icon: HiUserAdd },
    { label: 'Men', value: loading ? '...' : men.toLocaleString(), icon: HiOutlineUsers },
    { label: 'Women', value: loading ? '...' : women.toLocaleString(), icon: HiOutlineUsers },
  ];

  // Define table columns
  const columns: ColumnsType<Member> = [
    {
      title: 'Parish Number',
      dataIndex: 'churchNumber',
      key: 'churchNumber',
      width: 120,
      render: (churchNumber: string) => (
        <span className="text-sm font-semibold text-gray-900">{churchNumber}</span>
      ),
    },
    {
      title: 'Member',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Member) => (
        <div className="flex items-center gap-3">
          {record.profileImage ? (
            <img
              src={record.profileImage}
              alt={text}
              className="w-9 h-9 rounded-full object-cover shadow-sm flex-shrink-0 border-2 border-gray-200"
            />
          ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-sm flex-shrink-0">
            <UserOutlined className="text-white text-base" />
          </div>
          )}
          <div className="text-sm font-medium text-gray-900">{text}</div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record: Member) => {
        const phone = record.mobileNumber || record.phone || '-';
        const location = record.residentialAddress || record.hometown || record.region || '-';
        return (
          <div>
            <div className="text-xs text-gray-900 mb-1">{phone}</div>
            <div className="text-xs text-gray-600">{location}</div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Member) => (
        <Space>
          <AntButton 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMember(record);
              setShowMemberDetail(true);
            }}
          />
          <AntButton 
            type="text" 
            icon={<EditOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              openEditMember(record);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Member Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage parish members and their information</p>
        </div>
        {(hasPermission('members') || isSuperAdmin) && (
          <div className="flex gap-2">
            <Button 
              onClick={fetchMembers} 
              variant="outline" 
              disabled={loading}
              className="shadow-lg"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button onClick={openAddMember} className="shadow-lg">
              <HiUserAdd className="h-4 w-4 mr-2" />
              Register New Member
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards - Matching Dashboard Style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const pattern = patternStyles[index % patternStyles.length];
          return (
            <Card key={index} className="relative overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{ backgroundImage: pattern.background }}
              />
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 mb-1 truncate">{stat.label}</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 ml-2">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Search */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            <div className="w-full">
              <Input
                placeholder="Search by name, parish number, email..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                size="large"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <Select
                defaultValue="All Status"
                className="w-full sm:w-auto"
                style={{ minWidth: 120 }}
                size="large"
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
              <AntButton icon={<FilterOutlined />} size="large" className="w-full sm:w-auto">
                Filter
              </AntButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table - Using Ant Design Table */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Members</CardTitle>
            <Button variant="outline" size="sm">
              <DownloadOutlined className="mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 overflow-x-auto">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">
                <HiOutlineUsers className="h-12 w-12 mx-auto mb-2 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load members</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchMembers} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredMembers}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} members`,
                responsive: true,
              }}
              scroll={{ x: 'max-content' }}
              onRow={(record) => ({
                onClick: () => {
                  setSelectedMember(record);
                  setShowMemberDetail(true);
                },
                style: { cursor: 'pointer' },
                className: 'hover:bg-gray-50 transition-colors',
              })}
              rowClassName={() => 'hover:bg-gray-50'}
              locale={{
                emptyText: loading ? 'Loading members...' : 'No members found'
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Registration Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <HiUserAdd className="h-5 w-5 text-green-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              {editingMember ? 'Edit Member' : 'Register New Member'}
            </span>
          </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
        onClose={() => {
          setShowModal(false);
          setCurrentStep(0);
          setProfileImagePreview(null);
          setFileList([]);
          setSubmitting(false);
          setEditingMember(null);
          form.resetFields();
        }}
        open={showModal}
        styles={{
          body: { padding: '16px sm:24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        }}
      >
          <div
            ref={drawerBodyRef}
            className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2"
            style={{ paddingRight: '8px', marginRight: '-8px' }}
          >
          <Steps
            current={currentStep}
            items={[
              { title: 'Personal Information' },
              { title: 'Occupation & Details' },
              { title: 'Contact & Membership' },
            ]}
            className="mb-8"
          />
          
          <Form
            form={form}
            layout="vertical"
            preserve={true}
            onFinishFailed={({ errorFields }) => {
              const name = errorFields[0]?.name;
              if (name) form.scrollToField(name);
            }}
            onFinish={async (values) => {
              try {
                setSubmitting(true);
                
                // Helper function to format date from dayjs or string
                const formatDate = (date: any): string | undefined => {
                  if (!date) return undefined;
                  if (dayjs.isDayjs(date)) return date.format('YYYY-MM-DD');
                  if (typeof date === 'string') return date;
                  return undefined;
                };

                // Helper function to clean payload (remove undefined/null/empty values, but keep required fields and arrays)
                const cleanPayload = (obj: any): any => {
                  const cleaned: any = {};
                  const requiredFields = [
                    'next_of_kin_name',
                    'next_of_kin_relationship',
                    'next_of_kin_mobile_number',
                    'next_of_kin_address',
                  ];
                  
                  for (const [key, value] of Object.entries(obj)) {
                    if (Array.isArray(value)) {
                      // Keep arrays (including empty ones if they were explicitly set)
                      if (value.length > 0) {
                        cleaned[key] = value;
                      }
                    } else if (typeof value === 'object' && value !== null) {
                      const cleanedNested = cleanPayload(value);
                      if (Object.keys(cleanedNested).length > 0) {
                        cleaned[key] = cleanedNested;
                      }
                    } else if (value !== undefined && value !== null && (value !== '' || requiredFields.includes(key))) {
                      cleaned[key] = value;
                    }
                  }
                  return cleaned;
                };

                // Prepare the API payload according to the backend structure
                const memberPayload = cleanPayload({
                  member: {
                    profile_pic: values.profileImage || undefined,
                    surname: values.surname,
                    other_names: values.otherNames,
                    gender: values.gender || 'male',
                    date_of_birth: formatDate(values.dateOfBirth),
                    marital_status: values.maritalStatus,
                    nationality: values.nationality || 'Ghanaian',
                    hometown: values.hometown,
                    region: values.region,
                    residential_address: values.residentialAddress,
                    digital_address: values.digitalAddress?.trim() || undefined,
                    mobile_number: values.mobileNumber,
                    whatsapp_number: values.whatsappNumber?.trim() || undefined,
                    email_address: values.email?.trim() || undefined,
                    membership_status: values.membershipStatus?.toLowerCase().replace(' ', '_') || 'full_member',
                    date_joined_society: formatDate(values.dateJoinedSociety),
                    transferred_from_another_society: values.transferredFromAnotherSociety || false,
                    natal_group: values.natalGroup?.toLowerCase(),
                    baptised: values.baptised || false,
                    date_of_baptism: values.baptised ? formatDate(values.baptismDate) : undefined,
                    place_of_baptism: values.baptised ? values.baptismPlace : undefined,
                    confirmed: values.confirmed || false,
                    date_of_confirmation: values.confirmed ? formatDate(values.confirmationDate) : undefined,
                    place_of_confirmation: values.confirmed ? values.confirmationPlace : undefined,
                    former_society: values.transferredFromAnotherSociety ? values.formerSocietyName : undefined,
                    occupation: values.occupation,
                    place_of_work_or_school: values.placeOfWork,
                    skills_or_talent: values.skillsTalents,
                    next_of_kin_name: values.nextOfKinName,
                    next_of_kin_relationship: values.nextOfKinRelationship,
                    next_of_kin_mobile_number: values.nextOfKinPhone,
                    next_of_kin_address: values.nextOfKinAddress,
                    organisation_ids: values.organisations && values.organisations.length > 0 ? values.organisations : undefined,
                  }
                });

                console.log('=== MEMBER PAYLOAD BEING SENT ===');
                // Log payload with truncated profile_pic for readability
                const payloadForLog = JSON.parse(JSON.stringify(memberPayload));
                if (payloadForLog.member?.profile_pic) {
                  const picLength = payloadForLog.member.profile_pic.length;
                  payloadForLog.member.profile_pic = `[BASE64 IMAGE - ${picLength} characters]`;
                }
                console.log(JSON.stringify(payloadForLog, null, 2));
                console.log('=== END PAYLOAD ===');
                if (memberPayload.member?.profile_pic) {
                  console.log(`Profile picture included: ${memberPayload.member.profile_pic.substring(0, 50)}... (${memberPayload.member.profile_pic.length} total characters)`);
                }

                // Get authentication token
                const token = localStorage.getItem('auth_token');
                if (!token) {
                  throw new Error('No authentication token found');
                }

                let response;
                if (editingMember) {
                  // Update existing member
                  response = await apiRequest(`members/${editingMember.id}`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(memberPayload),
                  });
                } else {
                  // Create new member
                  response = await apiRequest('members', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(memberPayload),
                  });
                }

                if (response.error) {
                  console.error('=== MEMBER REGISTRATION ERROR ===');
                  console.error('Error object:', response.error);
                  console.error('Error message:', response.error.message);
                  console.error('=== END ERROR ===');
                  throw new Error(response.error.message || `Failed to ${editingMember ? 'update' : 'register'} member`);
                }

                // Success - refresh the members list
                await fetchMembers();
                
                // Close modal and reset form
                setShowModal(false);
                setCurrentStep(0);
                setProfileImagePreview(null);
                setFileList([]);
                setSubmitting(false);
                setEditingMember(null);
                form.resetFields();

                // Show success message
                showToast(
                  editingMember ? 'Member updated successfully!' : 'Member registered successfully!', 
                  'success'
                );

              } catch (error) {
                // Show error message
                showToast(
                  error instanceof Error ? error.message : `Failed to ${editingMember ? 'update' : 'register'} member`,
                  'error'
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {/* Step 1: Personal Information */}
            <div style={{ display: currentStep === 0 ? 'block' : 'none' }} className="space-y-4">
                {/* Profile Image Upload */}
                    <Form.Item
                  label="Profile Photo"
                  name="profileImage"
                >
                  <div className="flex flex-col items-center gap-4">
                    {profileImagePreview ? (
                      <div className="relative">
                        <img
                          src={profileImagePreview}
                          alt="Profile preview"
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProfileImagePreview(null);
                            setFileList([]);
                            form.setFieldValue('profileImage', null);
                          }}
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0 bg-white border-red-300 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                        <UserOutlined className="text-4xl text-gray-400" />
                      </div>
                    )}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="sr-only"
                      aria-hidden
                      tabIndex={-1}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = reader.result as string;
                            setProfileImagePreview(base64String);
                            // Use setFieldsValue to avoid circular reference warning
                            form.setFieldsValue({ profileImage: base64String });
                            setFileList([
                              {
                                uid: String(Date.now()),
                                name: file.name || 'camera.jpg',
                                status: 'done',
                                url: base64String,
                              },
                            ]);
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Upload
                        name="profileImage"
                        listType="picture"
                        maxCount={1}
                        fileList={fileList}
                        beforeUpload={(file) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = reader.result as string;
                            setProfileImagePreview(base64String);
                            // Use setFieldsValue to avoid circular reference warning
                            form.setFieldsValue({ profileImage: base64String });
                          };
                          reader.readAsDataURL(file);
                          return false; // Prevent automatic upload
                        }}
                        onRemove={() => {
                          setProfileImagePreview(null);
                          setFileList([]);
                          form.setFieldsValue({ profileImage: null });
                          return true;
                        }}
                        onChange={(info) => {
                          setFileList(info.fileList);
                        }}
                        accept="image/*"
                        className="flex-1 w-full min-w-0"
                      >
                        <AntButton icon={<UploadOutlined />} className="w-full">
                          {profileImagePreview ? 'Change from files' : 'Upload photo'}
                        </AntButton>
                      </Upload>
                      <AntButton
                        icon={<CameraOutlined />}
                        className="flex-1 w-full"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        Take picture
                      </AntButton>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Recommended: Square image, max 2MB
                    </p>
                  </div>
                    </Form.Item>

                    <Form.Item
                  label="Surname"
                  name="surname"
                  rules={[{ required: true, message: 'Please input surname' }]}
                >
                  <Input placeholder="Enter surname" size="large" />
                    </Form.Item>
                
                    <Form.Item
                  label="Other Names"
                  name="otherNames"
                  rules={[{ required: true, message: 'Please input other names' }]}
                    >
                  <Input placeholder="Enter other names" size="large" />
                    </Form.Item>

                <Form.Item
                  label="Gender"
                  name="gender"
                  rules={[{ required: true, message: 'Please select gender' }]}
                >
                  <Radio.Group size="large">
                    <Radio value="male">Male</Radio>
                    <Radio value="female">Female</Radio>
                  </Radio.Group>
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Date of Birth"
                      name="dateOfBirth"
                      rules={[{ required: true, message: 'Please select date of birth' }]}
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        size="large"
                        format="DD/MM/YYYY"
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                        onChange={(date) => {
                          if (date) {
                            const age = dayjs().diff(date, 'year');
                            form.setFieldsValue({ age });
                          } else {
                            form.setFieldsValue({ age: undefined });
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Age"
                      name="age"
                    >
                      <Input type="number" placeholder="Auto-calculated from date of birth" size="large" readOnly />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Natal Group (Day Born)"
                  name="natalGroup"
                  tooltip="Automatically determined from Date of Birth"
                >
                  <Input
                    size="large"
                    readOnly
                    placeholder="Auto-filled from Date of Birth"
                  />
                </Form.Item>

                    <Form.Item
                      label="Marital Status"
                      name="maritalStatus"
                      rules={[{ required: true, message: 'Please select marital status' }]}
                    >
                  <Radio.Group size="large">
                    <Radio value="single">Single</Radio>
                    <Radio value="married">Married</Radio>
                    <Radio value="solemnized">Solemnized</Radio>
                    <Radio value="divorced">Divorced</Radio>
                    <Radio value="widowed">Widowed</Radio>
                  </Radio.Group>
                    </Form.Item>

                <Form.Item
                  label="Nationality"
                  name="nationality"
                  rules={[{ required: true, message: 'Please enter nationality' }]}
                  initialValue="Ghanaian"
                >
                  <Input placeholder="Enter nationality" size="large" />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Hometown"
                      name="hometown"
                      rules={[{ required: true, message: 'Please enter hometown' }]}
                    >
                      <Input placeholder="Enter hometown" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Region"
                      name="region"
                      rules={[{ required: true, message: 'Please select region' }]}
                    >
                      <Select
                        placeholder="Select region"
                        size="large"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={regionSelectOptions}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            {/* Step 3: Contact & Membership */}
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }} className="space-y-6">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">CONTACT DETAILS</h4>
              <div className="space-y-4">
                    <Form.Item
                      label="Residential Address"
                      name="residentialAddress"
                      rules={[{ required: true, message: 'Please enter residential address' }]}
                    >
                      <Input.TextArea rows={2} placeholder="Enter residential address" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Digital Address (Ghana Post GPS)"
                      name="digitalAddress"
                    >
                      <Input placeholder="Optional — e.g., GA-123-4567" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Mobile Number"
                      name="mobileNumber"
                      rules={[{ required: true, message: 'Please input mobile number' }]}
                    >
                      <Input placeholder="e.g., 0244123456" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="WhatsApp Number (optional)"
                      name="whatsappNumber"
                    >
                      <Input placeholder="e.g., 0244123456" size="large" />
                    </Form.Item>

                <Form.Item
                      label="Email Address (optional)"
                      name="email"
                      rules={[
                        {
                          validator: async (_, value) => {
                            const v = typeof value === 'string' ? value.trim() : '';
                            if (!v) return;
                            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                            if (!emailOk) throw new Error('Please enter a valid email address');
                          },
                        },
                      ]}
                    >
                      <Input placeholder="email@example.com" size="large" />
                </Form.Item>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">MEMBERSHIP STATUS</h4>
                  <div className="space-y-4">
                    <Form.Item
                      label="Membership Status"
                      name="membershipStatus"
                      rules={[{ required: true, message: 'Please select membership status' }]}
                    >
                      <Radio.Group size="large">
                        <Radio value="Full Member">Full Member</Radio>
                        <Radio value="Catechumen">Catechumen</Radio>
                        <Radio value="Adherent">Adherent</Radio>
                        <Radio value="Child">Child</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      label="Date Joined this parish"
                      name="dateJoinedSociety"
                      rules={[{ required: true, message: 'Please select date joined' }]}
                    >
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                      label="Transferred from another parish?"
                      name="transferredFromAnotherSociety"
                      initialValue={false}
                      rules={[{ required: true, message: 'Please select Yes or No' }]}
                    >
                      <Radio.Group size="large">
                        <Radio value={true}>Yes</Radio>
                        <Radio value={false}>No</Radio>
                      </Radio.Group>
                    </Form.Item>

                <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) => 
                        prevValues.transferredFromAnotherSociety !== currentValues.transferredFromAnotherSociety
                      }
                    >
                      {({ getFieldValue }) => 
                        getFieldValue('transferredFromAnotherSociety') === true ? (
                          <Form.Item
                            label="Name of former parish"
                            name="formerSocietyName"
                            rules={[{ required: true, message: 'Please enter the name of the former parish' }]}
                          >
                            <Input placeholder="Enter former parish name" size="large" />
                </Form.Item>
                        ) : null
                      }
                    </Form.Item>

                    <Form.Item
                      label="Organizations (Optional)"
                      name="organisations"
                      tooltip="Select the organizations this member belongs to"
                    >
                      <Select
                        mode="multiple"
                        placeholder="Search and select organizations..."
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        size="large"
                        className="w-full"
                        options={organizations.map(org => ({
                          value: org.id,
                          label: org.name
                        }))}
                      />
                    </Form.Item>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">BAPTISM</h4>
                  <div className="space-y-4">
                      <Form.Item
                      label="Baptised?"
                      name="baptised"
                      initialValue={false}
                      rules={[{ required: true, message: 'Please select Yes or No' }]}
                      >
                      <Radio.Group size="large">
                        <Radio value={true}>Yes</Radio>
                        <Radio value={false}>No</Radio>
                      </Radio.Group>
                      </Form.Item>

                      <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) => 
                        prevValues.baptised !== currentValues.baptised
                      }
                    >
                      {({ getFieldValue }) => 
                        getFieldValue('baptised') === true ? (
                          <>
                      <Form.Item
                              label="Date of Baptism"
                              name="baptismDate"
                              rules={[{ required: true, message: 'Please select baptism date' }]}
                      >
                              <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                      </Form.Item>
                      <Form.Item
                              label="Place of Baptism"
                              name="baptismPlace"
                              rules={[{ required: true, message: 'Please enter place of baptism' }]}
                      >
                              <Input placeholder="Enter place of baptism" size="large" />
                      </Form.Item>
                          </>
                        ) : null
                      }
                    </Form.Item>
                </div>
              </div>

                <div className="border-t pt-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">CONFIRMATION</h4>
              <div className="space-y-4">
                    <Form.Item
                      label="Confirmed?"
                      name="confirmed"
                      initialValue={false}
                      rules={[{ required: true, message: 'Please select Yes or No' }]}
                    >
                      <Radio.Group size="large">
                        <Radio value={true}>Yes</Radio>
                        <Radio value={false}>No</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) => 
                        prevValues.confirmed !== currentValues.confirmed
                      }
                    >
                      {({ getFieldValue }) => 
                        getFieldValue('confirmed') === true ? (
                          <>
                      <Form.Item
                              label="Date of Confirmation"
                              name="confirmationDate"
                              rules={[{ required: true, message: 'Please select confirmation date' }]}
                      >
                              <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                <Form.Item
                              label="Place of Confirmation"
                              name="confirmationPlace"
                              rules={[{ required: true, message: 'Please enter place of confirmation' }]}
                      >
                              <Input placeholder="Enter place of confirmation" size="large" />
                </Form.Item>
                          </>
                        ) : null
                      }
                    </Form.Item>
                  </div>
                </div>
              </div>
            {/* Step 2: Occupation & Details */}
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }} key="step-2" className="space-y-6">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">OCCUPATION & SKILLS (OPTIONAL)</h4>
                  <div className="space-y-4">
                      <Form.Item
                      label="Occupation"
                      name="occupation"
                      >
                      <Input placeholder="Enter occupation" size="large" />
                      </Form.Item>

                      <Form.Item
                      label="Place of Work/School"
                      name="placeOfWork"
                      >
                      <Input placeholder="Enter place of work or school" size="large" />
                      </Form.Item>

                      <Form.Item
                      label="Skills/Talents (e.g. music, teaching, IT, carpentry)"
                      name="skillsTalents"
                      >
                      <Input.TextArea rows={3} placeholder="Enter skills and talents" size="large" />
                      </Form.Item>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">NEXT OF KIN / EMERGENCY CONTACT</h4>
                  <div className="space-y-4">
                      <Form.Item
                      label="Name"
                      name="nextOfKinName"
                      rules={[{ required: true, message: 'Please enter next of kin name' }]}
                      >
                      <Input placeholder="Enter name" size="large" />
                      </Form.Item>

                      <Form.Item
                      label="Relationship"
                      name="nextOfKinRelationship"
                      rules={[{ required: true, message: 'Please enter relationship' }]}
                      >
                      <Input placeholder="Enter relationship" size="large" />
                      </Form.Item>

                      <Form.Item
                      label="Phone Number"
                      name="nextOfKinPhone"
                      rules={[{ required: true, message: 'Please enter phone number' }]}
                      >
                      <Input placeholder="Enter phone number" size="large" />
                      </Form.Item>

                <Form.Item
                      label="Address"
                      name="nextOfKinAddress"
                      rules={[{ required: true, message: 'Please enter address' }]}
                >
                      <Input.TextArea rows={2} placeholder="Enter address" size="large" />
                </Form.Item>
                  </div>
                </div>
              </div>
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep(currentStep - 1);
                  } else {
                    setShowModal(false);
                    setCurrentStep(0);
                    setProfileImagePreview(null);
                    setFileList([]);
                    setSubmitting(false);
                    setEditingMember(null);
                    form.resetFields();
                  }
                }}
                className="flex-1"
              >
                {currentStep === 0 ? 'Cancel' : 'Previous'}
              </Button>
          {currentStep < 2 ? (
  <AntButton
    type="primary"
    htmlType="button"  // This prevents form submission
    disabled={submitting}
    onClick={async () => {
      try {
        if (currentStep === 0) {
          await form.validateFields([
            'surname',
            'otherNames',
            'gender',
            'dateOfBirth',
            'maritalStatus',
            'hometown',
            'region',
          ]);
        } else if (currentStep === 1) {
          await form.validateFields([
            'nextOfKinName',
            'nextOfKinRelationship',
            'nextOfKinPhone',
            'nextOfKinAddress',
          ]);
        }
        setCurrentStep(currentStep + 1);
      } catch (error: unknown) {
        const err = error as { errorFields?: { name: (string | number)[] }[] };
        const first = err?.errorFields?.[0]?.name;
        if (first) form.scrollToField(first);
      }
    }}
    className="flex-1"
    size="large"
  >
    Next
  </AntButton>
) : (
  <AntButton
    type="primary"
    htmlType="submit"  // Only the final button should submit
    className="flex-1"
    size="large"
    loading={submitting}
    disabled={submitting}
  >
    {submitting 
      ? (editingMember ? 'Updating...' : 'Registering...') 
      : (editingMember ? 'Update Member' : 'Register Member')
    }
  </AntButton>
)}
            </div>
          </Form>
          </div>
      </Drawer>

      {/* Member Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined className="h-5 w-5 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Member Details</span>
        </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 700}
        onClose={() => {
          setShowMemberDetail(false);
          setSelectedMember(null);
        }}
        open={showMemberDetail}
        styles={{
          body: { padding: '0' },
        }}
      >
        {selectedMember && (
          <div className="max-h-[calc(100vh-80px)] overflow-y-auto">
            {/* Member Header with Profile */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-4 sm:px-6 py-6 sm:py-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                {selectedMember.profileImage ? (
                  <img
                    src={selectedMember.profileImage}
                    alt={selectedMember.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-xl border-4 border-white mx-auto sm:mx-0"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-xl border-4 border-white mx-auto sm:mx-0">
                    <UserOutlined className="text-white text-3xl sm:text-4xl" />
                  </div>
                )}
                <div className="flex-1 pt-0 sm:pt-2 w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left w-full sm:w-auto">
                      {selectedMember.surname && selectedMember.otherNames 
                        ? `${selectedMember.surname}, ${selectedMember.otherNames}`
                        : selectedMember.name}
                    </h3>
                    {selectedMember.churchNumber && (
                      <Tag color="default" className="text-xs sm:text-sm px-2 sm:px-3 py-1 font-semibold text-gray-900 border-gray-300">
                        {selectedMember.churchNumber}
                      </Tag>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                    <Tag color={selectedMember.status === 'Active' ? 'green' : 'red'} className="text-xs px-3 py-1">
                      {selectedMember.status}
                    </Tag>
                    {selectedMember.membershipStatus && (
                      <Tag color="blue" className="text-xs px-3 py-1">
                        {selectedMember.membershipStatus}
                      </Tag>
                    )}
                    {selectedMember.department && (
                      <Tag color="purple" className="text-xs px-3 py-1">
                        {selectedMember.department}
                      </Tag>
                    )}
                    </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Personal Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <UserOutlined className="text-blue-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Parish Number" value={selectedMember.churchNumber} />
                  <InfoRow label="Surname" value={selectedMember.surname} />
                  <InfoRow label="Other Names" value={selectedMember.otherNames} />
                  <InfoRow 
                    label="Gender" 
                    value={selectedMember.gender ? selectedMember.gender.charAt(0).toUpperCase() + selectedMember.gender.slice(1) : undefined} 
                  />
                  <InfoRow 
                    label="Date of Birth" 
                    value={selectedMember.dateOfBirth ? dayjs(selectedMember.dateOfBirth).format('DD MMMM YYYY') : undefined} 
                  />
                  <InfoRow 
                    label="Age" 
                    value={selectedMember.dateOfBirth 
                      ? `${dayjs().diff(dayjs(selectedMember.dateOfBirth), 'year')} years` 
                      : undefined
                    } 
                  />
                  <InfoRow 
                    label="Marital Status" 
                    value={selectedMember.maritalStatus ? selectedMember.maritalStatus.charAt(0).toUpperCase() + selectedMember.maritalStatus.slice(1) : undefined} 
                  />
                  <InfoRow label="Hometown" value={selectedMember.hometown} />
                  <InfoRow label="Region" value={selectedMember.region} />
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <SearchOutlined className="text-green-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Residential Address" value={selectedMember.residentialAddress} breakWords />
                  <InfoRow label="Digital Address (GPS)" value={selectedMember.digitalAddress} />
                  <InfoRow label="Mobile Number" value={selectedMember.mobileNumber} />
                  <InfoRow label="WhatsApp Number" value={selectedMember.whatsappNumber} />
                  <InfoRow label="Email Address" value={selectedMember.email} breakWords />
                  <InfoRow label="Phone" value={selectedMember.phone} />
                </CardContent>
              </Card>

              {/* Membership Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <HiOutlineUsers className="text-purple-600" />
                    Membership Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Membership Status" value={selectedMember.membershipStatus} />
                  <InfoRow 
                    label="Date Joined Society" 
                    value={selectedMember.dateJoinedSociety ? dayjs(selectedMember.dateJoinedSociety).format('DD MMMM YYYY') : undefined} 
                  />
                  <InfoRow 
                    label="Date Joined" 
                    value={selectedMember.joinDate ? dayjs(selectedMember.joinDate).format('DD MMMM YYYY') : undefined} 
                  />
                  <InfoRow 
                    label="Transferred from Another Society" 
                    value={selectedMember.transferredFromAnotherSociety !== undefined ? (selectedMember.transferredFromAnotherSociety ? 'Yes' : 'No') : undefined} 
                  />
                  <InfoRow label="Former Society Name" value={selectedMember.formerSocietyName} />
                  {selectedMember.organisations && selectedMember.organisations.length > 0 && (
                    <div className="py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Organizations</span>
                      <div className="mt-2 space-y-2">
                        {selectedMember.organisations.map((org) => (
                          <div key={org.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-blue-900">{org.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-blue-700">
                                    Role: <span className="font-medium capitalize">{org.role}</span>
                                  </span>
                                  <span className="text-xs text-blue-700">
                                    Joined: <span className="font-medium">{dayjs(org.joined_at).format('DD MMM YYYY')}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Baptism Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <HiOutlineCalendar className="text-orange-600" />
                    Baptism
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow 
                    label="Baptised" 
                    value={selectedMember.baptised !== undefined ? (selectedMember.baptised ? 'Yes' : 'No') : undefined} 
                  />
                  <InfoRow 
                    label="Date of Baptism" 
                    value={selectedMember.baptismDate ? dayjs(selectedMember.baptismDate).format('DD MMMM YYYY') : undefined} 
                  />
                  <InfoRow label="Place of Baptism" value={selectedMember.baptismPlace} />
                </CardContent>
              </Card>

              {/* Confirmation Information */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <HiTrendingUp className="text-indigo-600" />
                    Confirmation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow 
                    label="Confirmed" 
                    value={selectedMember.confirmed !== undefined ? (selectedMember.confirmed ? 'Yes' : 'No') : undefined} 
                  />
                  <InfoRow 
                    label="Date of Confirmation" 
                    value={selectedMember.confirmationDate ? dayjs(selectedMember.confirmationDate).format('DD MMMM YYYY') : undefined} 
                  />
                  <InfoRow label="Place of Confirmation" value={selectedMember.confirmationPlace} />
                </CardContent>
              </Card>

              {/* Occupation & Skills */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <UserOutlined className="text-teal-600" />
                    Occupation & Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Occupation" value={selectedMember.occupation} />
                  <InfoRow label="Place of Work/School" value={selectedMember.placeOfWork} />
                  <InfoRow label="Skills/Talents" value={selectedMember.skillsTalents} breakWords />
                </CardContent>
              </Card>

              {/* Next of Kin */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <UserOutlined className="text-red-600" />
                    Next of Kin / Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Name" value={selectedMember.nextOfKinName} />
                  <InfoRow label="Relationship" value={selectedMember.nextOfKinRelationship} />
                  <InfoRow label="Phone Number" value={selectedMember.nextOfKinPhone} />
                  <InfoRow label="Address" value={selectedMember.nextOfKinAddress} breakWords />
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons - Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMemberDetail(false);
                    setSelectedMember(null);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    openEditMember(selectedMember);
                    setShowMemberDetail(false);
                    setSelectedMember(null);
                  }}
                  className="flex-1 shadow-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  <EditOutlined className="mr-2" />
                  Edit Member
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
