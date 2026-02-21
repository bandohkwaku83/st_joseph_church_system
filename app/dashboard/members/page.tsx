'use client';

import { useState, useRef, useEffect } from 'react';
import {
  HiOutlineUsers,
  HiUserAdd,
  HiOutlineCalendar,
  HiTrendingUp,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, Tag, Input, Select, Space, Button as AntButton, Steps, Form, DatePicker, Row, Col, Drawer, Upload, Radio, Checkbox } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd';
import { SearchOutlined, FilterOutlined, DownloadOutlined, EyeOutlined, EditOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '@/lib/auth-context';

type Gender = 'male' | 'female' | 'child';
type Status = 'Active' | 'Inactive';

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
  organisations?: string[]; // Array of selected organisations
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
  const { hasRole } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const drawerBodyRef = useRef<HTMLDivElement>(null);

  // Scroll drawer content to top when step changes so the current step is visible
  useEffect(() => {
    if (showModal && drawerBodyRef.current) {
      drawerBodyRef.current.scrollTop = 0;
    }
  }, [currentStep, showModal]);

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

  const [members, setMembers] = useState<Member[]>([

    // Initial sample members with Ghanaian data
    {
      id: 1,
      churchNumber: 'CH-0001',
      name: 'Kwame Asante',
      surname: 'Asante',
      otherNames: 'Kwame',
      email: 'kwame.asante@gmail.com',
      phone: '+233 24 123 4567',
      mobileNumber: '0241234567',
      whatsappNumber: '0241234567',
      department: 'Choir',
      status: 'Active',
      joinDate: '2023-01-15',
      gender: 'male',
      age: 35,
      dateOfBirth: '1989-05-20',
      maritalStatus: 'married',
      nationality: 'Ghanaian',
      hometown: 'Kumasi',
      region: 'Ashanti',
      residentialAddress: 'House No. 45, Adenta Housing Estate, Accra',
      digitalAddress: 'GA-123-4567',
      membershipStatus: 'Full Member',
      dateJoinedSociety: '2023-01-15',
      transferredFromAnotherSociety: false,
      baptised: true,
      baptismDate: '2005-06-15',
      baptismPlace: 'St Joseph Catholic Church, Adenta',
      confirmed: true,
      confirmationDate: '2007-08-20',
      confirmationPlace: 'St Joseph Catholic Church, Adenta',
      organisations: ['Choir'],
      occupation: 'Teacher',
      placeOfWork: 'Adenta  Basic School',
      skillsTalents: 'Singing, Teaching, Piano',
      nextOfKinName: 'Ama Asante',
      nextOfKinRelationship: 'Wife',
      nextOfKinPhone: '0247654321',
      nextOfKinAddress: 'House No. 45, Adenta Housing Estate, Accra',
    },
    {
      id: 2,
      churchNumber: 'CH-0002',
      name: 'Ama Mensah',
      surname: 'Mensah',
      otherNames: 'Ama',
      email: 'ama.mensah@yahoo.com',
      phone: '+233 20 234 5678',
      mobileNumber: '0202345678',
      whatsappNumber: '0202345678',
      department: 'Ushers',
      status: 'Active',
      joinDate: '2022-08-20',
      gender: 'female',
      age: 28,
      dateOfBirth: '1996-03-12',
      maritalStatus: 'single',
      nationality: 'Ghanaian',
      hometown: 'Cape Coast',
      region: 'Central',
      residentialAddress: 'Block 12, Tema Community 5',
      digitalAddress: 'GA-234-5678',
      membershipStatus: 'Full Member',
      dateJoinedSociety: '2022-08-20',
      transferredFromAnotherSociety: false,
      baptised: true,
      baptismDate: '2010-04-10',
      baptismPlace: 'St Joseph Catholic Church, Tema',
      confirmed: true,
      confirmationDate: '2012-05-15',
      confirmationPlace: 'St Joseph Catholic Church, Tema',
      organisations: ['Ushers', "Women's Fellowship"],
      occupation: 'Nurse',
      placeOfWork: 'Tema General Hospital',
      skillsTalents: 'Nursing, First Aid, Counseling',
      nextOfKinName: 'Kofi Mensah',
      nextOfKinRelationship: 'Brother',
      nextOfKinPhone: '0249876543',
      nextOfKinAddress: 'Block 12, Tema Community 5',
    },
    {
      id: 3,
      churchNumber: 'CH-0003',
      name: 'Kofi Osei',
      surname: 'Osei',
      otherNames: 'Kofi',
      email: 'kofi.osei@hotmail.com',
      phone: '+233 26 345 6789',
      mobileNumber: '0263456789',
      whatsappNumber: '0263456789',
      department: 'Youth',
      status: 'Inactive',
      joinDate: '2021-03-10',
      gender: 'male',
      age: 42,
      dateOfBirth: '1982-11-08',
      maritalStatus: 'married',
      nationality: 'Ghanaian',
      hometown: 'Sunyani',
      region: 'Bono',
      residentialAddress: 'Plot 8, East Legon, Accra',
      digitalAddress: 'GA-345-6789',
      membershipStatus: 'Adherent',
      dateJoinedSociety: '2021-03-10',
      transferredFromAnotherSociety: true,
      formerSocietyName: 'Sacred Heart Catholic Church, Sunyani',
      baptised: true,
      baptismDate: '1998-07-22',
      baptismPlace: 'Sacred Heart Catholic Church, Sunyani',
      confirmed: true,
      confirmationDate: '2000-09-10',
      confirmationPlace: 'Sacred Heart Catholic Church, Sunyani',
      organisations: ['Youth Fellowship'],
      occupation: 'Engineer',
      placeOfWork: 'Ghana Water Company Limited',
      skillsTalents: 'Engineering, IT, Leadership',
      nextOfKinName: 'Akosua Osei',
      nextOfKinRelationship: 'Wife',
      nextOfKinPhone: '0241112222',
      nextOfKinAddress: 'Plot 8, East Legon, Accra',
    },
    {
      id: 4,
      churchNumber: 'CH-0004',
      name: 'Akosua Adjei',
      surname: 'Adjei',
      otherNames: 'Akosua',
      email: 'akosua.adjei@gmail.com',
      phone: '+233 55 456 7890',
      mobileNumber: '0554567890',
      whatsappNumber: '0554567890',
      department: "Women's Fellowship",
      status: 'Active',
      joinDate: '2023-06-05',
      gender: 'female',
      age: 31,
      dateOfBirth: '1993-09-25',
      maritalStatus: 'married',
      nationality: 'Ghanaian',
      hometown: 'Tamale',
      region: 'Northern',
      residentialAddress: 'House 23, Spintex Road, Accra',
      digitalAddress: 'GA-456-7890',
      membershipStatus: 'Full Member',
      dateJoinedSociety: '2023-06-05',
      transferredFromAnotherSociety: false,
      baptised: true,
      baptismDate: '2008-12-05',
      baptismPlace: 'St Joseph Catholic Church, Tamale',
      confirmed: true,
      confirmationDate: '2010-03-18',
      confirmationPlace: 'St Joseph Catholic Church, Tamale',
      organisations: ["Women's Fellowship"],
      occupation: 'Accountant',
      placeOfWork: 'Ernst & Young Ghana',
      skillsTalents: 'Accounting, Financial Planning, Event Planning',
      nextOfKinName: 'Yaw Adjei',
      nextOfKinRelationship: 'Husband',
      nextOfKinPhone: '0243334444',
      nextOfKinAddress: 'House 23, Spintex Road, Accra',
    },
    {
      id: 5,
      churchNumber: 'CH-0005',
      name: 'Efua Boateng',
      surname: 'Boateng',
      otherNames: 'Efua',
      email: 'efua.boateng@yahoo.com',
      phone: '+233 50 567 8901',
      mobileNumber: '0505678901',
      whatsappNumber: '0505678901',
      department: 'Children',
      status: 'Active',
      joinDate: '2024-01-10',
      gender: 'child',
      age: 8,
      dateOfBirth: '2016-07-14',
      maritalStatus: 'single',
      nationality: 'Ghanaian',
      hometown: 'Koforidua',
      region: 'Eastern',
      residentialAddress: 'Flat 5, Dansoman Estate, Accra',
      digitalAddress: 'GA-567-8901',
      membershipStatus: 'Child',
      dateJoinedSociety: '2024-01-10',
      transferredFromAnotherSociety: false,
      baptised: false,
      confirmed: false,
      organisations: ['Children'],
      occupation: 'Student',
      placeOfWork: 'St Joseph Catholic School, Dansoman',
      skillsTalents: 'Singing, Dancing, Drawing',
      nextOfKinName: 'Kwame Boateng',
      nextOfKinRelationship: 'Father',
      nextOfKinPhone: '0245556666',
      nextOfKinAddress: 'Flat 5, Dansoman Estate, Accra',
    },
    {
      id: 6,
      churchNumber: 'CH-0006',
      name: 'Yaw Appiah',
      surname: 'Appiah',
      otherNames: 'Yaw',
      email: 'yaw.appiah@gmail.com',
      phone: '+233 27 678 9012',
      mobileNumber: '0276789012',
      whatsappNumber: '0276789012',
      department: 'Men\'s Fellowship',
      status: 'Active',
      joinDate: '2023-03-15',
      gender: 'male',
      age: 45,
      dateOfBirth: '1979-02-28',
      maritalStatus: 'married',
      nationality: 'Ghanaian',
      hometown: 'Takoradi',
      region: 'Western',
      residentialAddress: 'No. 15, Airport Residential Area, Accra',
      digitalAddress: 'GA-678-9012',
      membershipStatus: 'Full Member',
      dateJoinedSociety: '2023-03-15',
      transferredFromAnotherSociety: false,
      baptised: true,
      baptismDate: '1992-10-12',
      baptismPlace: 'St Joseph Catholic Church, Takoradi',
      confirmed: true,
      confirmationDate: '1994-11-20',
      confirmationPlace: 'St Joseph Catholic Church, Takoradi',
      organisations: ["Men's Fellowship"],
      occupation: 'Businessman',
      placeOfWork: 'Appiah Trading Company',
      skillsTalents: 'Business Management, Public Speaking, Mentoring',
      nextOfKinName: 'Abena Appiah',
      nextOfKinRelationship: 'Wife',
      nextOfKinPhone: '0247778888',
      nextOfKinAddress: 'No. 15, Airport Residential Area, Accra',
    },
  ]);

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    const orgsMatch = member.organisations?.some(org => org.toLowerCase().includes(searchLower)) || false;
    return (
      member.name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.department.toLowerCase().includes(searchLower) ||
      member.churchNumber?.toLowerCase().includes(searchLower) ||
      orgsMatch
    );
  });

  // Calculate stats from members data
  const total = members.length;
  const active = members.filter(m => m.status === 'Active').length;
  const children = members.filter(m => m.gender === 'child').length;
  const men = members.filter(m => m.gender === 'male').length;
  const women = members.filter(m => m.gender === 'female').length;

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
    { label: 'Total Members', value: total.toLocaleString(), icon: HiOutlineUsers },
    { label: 'Active Members', value: active.toLocaleString(), icon: HiTrendingUp },
    { label: 'Children', value: children.toLocaleString(), icon: HiUserAdd },
    { label: 'Men', value: men.toLocaleString(), icon: HiOutlineUsers },
    { label: 'Women', value: women.toLocaleString(), icon: HiOutlineUsers },
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
      title: 'Organizations',
      key: 'organisations',
      render: (_, record: Member) => {
        const orgs = record.organisations || [];
        if (orgs.length === 0) {
          return <Tag color="default">None</Tag>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {orgs.map((item, idx) => (
              <Tag key={idx} color="blue">
                {item}
              </Tag>
            ))}
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
              // TODO: Handle edit functionality
              console.log('Edit member:', record);
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
        {!hasRole('head_pastor') && (
          <Button onClick={() => setShowModal(true)} className="shadow-lg w-full sm:w-auto">
            <HiUserAdd className="h-4 w-4 mr-2" />
            Register New Member
          </Button>
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
          <div className="space-y-3 sm:space-y-0">
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
                defaultValue="All Organizations"
                className="w-full sm:w-auto sm:flex-1"
                size="large"
                options={[
                  { value: 'all', label: 'All Organizations' },
                  { value: 'cma', label: 'Christian Mothers Association' },
                  { value: 'ksji', label: 'Knights of St. John International (KSJI)' },
                  { value: 'marshall', label: 'Knights and Ladies of Marshall' },
                  { value: 'cyo', label: 'Catholic Youth Organization (CYO)' },
                  { value: 'legion', label: 'Legion of Mary' },
                  { value: 'choir', label: 'Choir' },
                  { value: 'altar', label: 'Altar Servers' },
                  { value: 'lectors', label: 'Lectors' },
                ]}
              />
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
          <Table
            columns={columns}
            dataSource={filteredMembers}
            rowKey="id"
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
          />
        </CardContent>
      </Card>

      {/* Registration Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <HiUserAdd className="h-5 w-5 text-green-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Register New Member</span>
          </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
        onClose={() => {
          setShowModal(false);
          setCurrentStep(0);
          setProfileImagePreview(null);
          setFileList([]);
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
              { title: 'Organisation & Details' },
              { title: 'Contact & Membership' },
            ]}
            className="mb-8"
          />
          
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
            // Helper function to format date from dayjs or string
            const formatDate = (date: any): string | undefined => {
              if (!date) return undefined;
              if (dayjs.isDayjs(date)) return date.format('YYYY-MM-DD');
              if (typeof date === 'string') return date;
              return undefined;
            };

            // Calculate age from date of birth if provided
            let age: number | undefined;
            if (values.dateOfBirth) {
              const birthDate = dayjs.isDayjs(values.dateOfBirth) 
                ? values.dateOfBirth.toDate() 
                : new Date(values.dateOfBirth);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }

            // Format name from surname and other names
            const fullName = [values.surname, values.otherNames]
              .filter(Boolean)
              .join(' ');

            // Get primary department from organisations (use first one or combine)
            const organisations = values.organisations || [];
            const primaryDepartment = organisations.length > 0 
              ? organisations[0] 
              : 'None';

            // Determine status from membership status
            const membershipStatus = values.membershipStatus || 'Full Member';
            const memberStatus: Status = membershipStatus === 'Full Member' || membershipStatus === 'Adherent' 
              ? 'Active' 
              : 'Inactive';

            // Generate unique church number for the new member
            const churchNumber = generateChurchNumber(members);

            // Create new member with all form data
            const newMember: Member = {
              id: members.length + 1,
              churchNumber: churchNumber,
              name: fullName,
              email: values.email || '',
              phone: values.mobileNumber || '',
              department: primaryDepartment,
              status: memberStatus,
              joinDate: formatDate(values.dateJoinedSociety) || new Date().toISOString().split('T')[0],
              gender: values.gender as Gender,
              age: values.age || age,
              // New form fields
              surname: values.surname,
              otherNames: values.otherNames,
              dateOfBirth: formatDate(values.dateOfBirth),
              maritalStatus: values.maritalStatus,
              nationality: values.nationality,
              hometown: values.hometown,
              region: values.region,
              residentialAddress: values.residentialAddress,
              digitalAddress: values.digitalAddress,
              mobileNumber: values.mobileNumber,
              whatsappNumber: values.whatsappNumber,
              membershipStatus: values.membershipStatus,
              dateJoinedSociety: formatDate(values.dateJoinedSociety),
              transferredFromAnotherSociety: values.transferredFromAnotherSociety,
              formerSocietyName: values.formerSocietyName,
              baptised: values.baptised,
              baptismDate: formatDate(values.baptismDate),
              baptismPlace: values.baptismPlace,
              confirmed: values.confirmed,
              confirmationDate: formatDate(values.confirmationDate),
              confirmationPlace: values.confirmationPlace,
              organisations: organisations,
              otherOrganisation: values.otherOrganisation,
              occupation: values.occupation,
              placeOfWork: values.placeOfWork,
              skillsTalents: values.skillsTalents,
              nextOfKinName: values.nextOfKinName,
              nextOfKinRelationship: values.nextOfKinRelationship,
              nextOfKinPhone: values.nextOfKinPhone,
              nextOfKinAddress: values.nextOfKinAddress,
              profileImage: values.profileImage || undefined,
            };

            // Add new member to the list
            setMembers([...members, newMember]);
            
              setShowModal(false);
              setCurrentStep(0);
            setProfileImagePreview(null);
            setFileList([]);
              form.resetFields();
            }}
          >
            {/* Step 1: Personal Information */}
            {currentStep === 0 && (
              <div className="space-y-4">
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
                          form.setFieldValue('profileImage', base64String);
                        };
                        reader.readAsDataURL(file);
                        return false; // Prevent automatic upload
                      }}
                      onRemove={() => {
                        setProfileImagePreview(null);
                        setFileList([]);
                        form.setFieldValue('profileImage', null);
                        return true;
                      }}
                      onChange={(info) => {
                        setFileList(info.fileList);
                      }}
                      accept="image/*"
                      className="w-full"
                    >
                      <AntButton icon={<UploadOutlined />} className="w-full">
                        {profileImagePreview ? 'Change Photo' : 'Upload Photo'}
                      </AntButton>
                    </Upload>
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
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Age"
                      name="age"
                    >
                      <Input type="number" placeholder="Enter age" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                    <Form.Item
                      label="Marital Status"
                      name="maritalStatus"
                    >
                  <Radio.Group size="large">
                    <Radio value="single">Single</Radio>
                    <Radio value="married">Married</Radio>
                    <Radio value="divorced">Divorced</Radio>
                    <Radio value="widowed">Widowed</Radio>
                  </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      label="Nationality"
                      name="nationality"
                    >
                  <Input placeholder="Enter nationality" size="large" />
                    </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Hometown"
                      name="hometown"
                    >
                      <Input placeholder="Enter hometown" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Region"
                      name="region"
                    >
                      <Input placeholder="Enter region" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}

            {/* Step 3: Contact & Membership */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">CONTACT DETAILS</h4>
              <div className="space-y-4">
                    <Form.Item
                      label="Residential Address"
                      name="residentialAddress"
                    >
                      <Input.TextArea rows={2} placeholder="Enter residential address" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Digital Address (Ghana Post GPS)"
                      name="digitalAddress"
                    >
                      <Input placeholder="e.g., GA-123-4567" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="Mobile Number"
                      name="mobileNumber"
                      rules={[{ required: true, message: 'Please input mobile number' }]}
                    >
                      <Input placeholder="e.g., 0244123456" size="large" />
                    </Form.Item>

                    <Form.Item
                      label="WhatsApp Number (if different)"
                      name="whatsappNumber"
                    >
                      <Input placeholder="e.g., 0244123456" size="large" />
                    </Form.Item>

                <Form.Item
                      label="Email Address"
                      name="email"
                      rules={[
                        { type: 'email', message: 'Please enter a valid email' }
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
                      label="Date Joined This Society"
                      name="dateJoinedSociety"
                      rules={[{ required: true, message: 'Please select date joined' }]}
                    >
                      <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                      label="Transferred from another Society?"
                      name="transferredFromAnotherSociety"
                      initialValue={false}
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
                            label="Name of former Society"
                            name="formerSocietyName"
                            rules={[{ required: true, message: 'Please enter former society name' }]}
                          >
                            <Input placeholder="Enter former society name" size="large" />
                </Form.Item>
                        ) : null
                      }
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
            )}

            {/* Step 2: Organisation & Details */}
            {currentStep === 1 && (
              <div key="step-2" className="space-y-6">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">SOCIETY & ORGANISATION MEMBERSHIP</h4>
                      <Form.Item
                    label="Organisation(s) you belong to (tick all that apply)"
                    name="organisations"
                  >
                    <Checkbox.Group className="w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Checkbox value="Christian Mothers Association">Christian Mothers Association</Checkbox>
                        <Checkbox value="Knights of St. John International (KSJI)">Knights of St. John International (KSJI)</Checkbox>
                        <Checkbox value="Knights and Ladies of Marshall">Knights and Ladies of Marshall</Checkbox>
                        <Checkbox value="Catholic Youth Organization (CYO)">Catholic Youth Organization (CYO)</Checkbox>
                        <Checkbox value="Legion of Mary">Legion of Mary</Checkbox>
                        <Checkbox value="Choir">Choir</Checkbox>
                        <Checkbox value="Altar Servers">Altar Servers</Checkbox>
                        <Checkbox value="Lectors">Lectors</Checkbox>
                        <Checkbox value="Others">Others</Checkbox>
                      </div>
                    </Checkbox.Group>
                      </Form.Item>

                      <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => 
                      prevValues.organisations !== currentValues.organisations
                    }
                  >
                    {({ getFieldValue }) => {
                      const organisations = getFieldValue('organisations') || [];
                      return organisations.includes('Others') ? (
                        <Form.Item
                          label="Others (specify)"
                          name="otherOrganisation"
                          rules={[{ required: true, message: 'Please specify other organisation' }]}
                          className="mt-4"
                        >
                          <Input placeholder="Enter other organisation" size="large" />
                      </Form.Item>
                      ) : null;
                    }}
                  </Form.Item>

                  </div>

                <div className="border-t pt-4">
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
                      >
                      <Input placeholder="Enter name" size="large" />
                      </Form.Item>

                      <Form.Item
                      label="Relationship"
                      name="nextOfKinRelationship"
                      >
                      <Input placeholder="Enter relationship" size="large" />
                      </Form.Item>

                      <Form.Item
                      label="Phone Number"
                      name="nextOfKinPhone"
                      >
                      <Input placeholder="Enter phone number" size="large" />
                      </Form.Item>

                <Form.Item
                      label="Address"
                      name="nextOfKinAddress"
                >
                      <Input.TextArea rows={2} placeholder="Enter address" size="large" />
                </Form.Item>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep(currentStep - 1);
                  } else {
                    setShowModal(false);
                    setCurrentStep(0);
                    setProfileImagePreview(null);
                    setFileList([]);
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
    onClick={() => {
      setCurrentStep(currentStep + 1);
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
  >
    Register Member
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
                  <InfoRow label="Age" value={selectedMember.age ? `${selectedMember.age} years` : undefined} />
                  <InfoRow 
                    label="Marital Status" 
                    value={selectedMember.maritalStatus ? selectedMember.maritalStatus.charAt(0).toUpperCase() + selectedMember.maritalStatus.slice(1) : undefined} 
                  />
                  <InfoRow label="Nationality" value={selectedMember.nationality} />
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
                    value={selectedMember.transferredFromAnotherSociety !== undefined ? selectedMember.transferredFromAnotherSociety : undefined} 
                  />
                  <InfoRow label="Former Society Name" value={selectedMember.formerSocietyName} />
                  <div className="flex justify-between items-start py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Organisations</span>
                    <div className="flex flex-wrap gap-2 max-w-[60%] justify-end">
                      {selectedMember.organisations && selectedMember.organisations.length > 0 ? (
                        selectedMember.organisations.map((org, idx) => (
                          <Tag key={idx} color="cyan" className="text-xs">
                            {org}
                          </Tag>
                        ))
                      ) : (
                        <span className="text-sm font-medium text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                  <InfoRow label="Other Organisation" value={selectedMember.otherOrganisation} />
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
                    value={selectedMember.baptised !== undefined ? selectedMember.baptised : undefined} 
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
                    value={selectedMember.confirmed !== undefined ? selectedMember.confirmed : undefined} 
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
                    // TODO: Handle edit functionality
                    console.log('Edit member:', selectedMember);
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
