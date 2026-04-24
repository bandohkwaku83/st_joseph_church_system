'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  HiArrowUp,
  HiArrowDown,
  HiChevronRight,
  HiOutlineArrowRight,
  HiTrendingUp,
  HiTrendingDown,
  HiPlus,
  HiOutlineUsers,
  HiOutlineClipboardCheck,
  HiOutlineOfficeBuilding,
  HiOutlineChatAlt,
  HiReceiptRefund,
  HiOutlineChartBar,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { apiRequest, getApiBase } from '@/lib/api';

/** Monthly welfare/dues payment (aligned with Welfare/Dues page) */
interface DuesPayment {
  id: string;
  date: string;
  memberName: string;
  amount: number;
  method: string;
}

const WELFARE_ROSTER_MEMBER_COUNT = 6;
const MONTHLY_DUES_GHC = 50;
const EXPECTED_MONTHLY_DUES_TOTAL = WELFARE_ROSTER_MEMBER_COUNT * MONTHLY_DUES_GHC;

const ADMIN_RECENT_ACTIVITY = [
  {
    id: 1,
    type: 'member',
    title: 'New member registered',
    description: 'John Doe joined the parish',
    time: '2 hours ago',
    icon: HiOutlineUsers,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 2,
    type: 'attendance',
    title: 'Sunday Service recorded',
    description: '102 attendees recorded',
    time: '1 day ago',
    icon: HiOutlineClipboardCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: 3,
    type: 'organization',
    title: 'New organization created',
    description: 'Youth Fellowship added',
    time: '2 days ago',
    icon: HiOutlineOfficeBuilding,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    id: 4,
    type: 'communication',
    title: 'Announcement sent',
    description: 'Weekly bulletin sent to all members',
    time: '3 days ago',
    icon: HiOutlineChatAlt,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const { showToast } = useToast();
  const isAdmin = hasRole('church_admin');
  const isFinanceOfficer = hasRole('role_finance_officer');
  const isHeadPastor = hasRole('head_pastor');

  // API data state
  const [members, setMembers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [welfares, setWelfares] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [welfareError, setWelfareError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Fetch members from API
  const fetchMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const tokenExpires = localStorage.getItem('auth_token_expires');
      
      if (!token) {
        console.warn('No auth token found, skipping members fetch');
        return;
      }

      // Check if token is expired
      if (tokenExpires) {
        const expiryDate = new Date(tokenExpires);
        const now = new Date();
        if (now > expiryDate) {
          console.warn('Auth token has expired, clearing session');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token_expires');
          localStorage.removeItem('auth_user_data');
          setError('Session expired. Please log in again.');
          return;
        }
      }

      const response = await apiRequest<{ members?: any[]; status?: string; data?: any }>('members', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.members && Array.isArray(response.data.members)) {
        setMembers(response.data.members);
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where members array is directly in response.data
        console.log('Members found directly in response.data, loaded', response.data.length, 'members');
        setMembers(response.data);
      } else if (response.data && response.data.status === 'OK' && response.data.members && Array.isArray(response.data.members)) {
        // Handle the expected API response format: {message: "...", status: "OK", members: [...]}
        setMembers(response.data.members);
      } else if (response.error) {
        console.error('Error fetching members:', response.error.message);
        console.error('Full error object:', response.error);
        console.error('HTTP status:', response.status);
        
        let errorMessage = response.error.message;
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token_expires');
          localStorage.removeItem('auth_user_data');
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to view members.';
        } else if (response.status === 404) {
          errorMessage = 'Members endpoint not found. Please check if the backend API is properly configured.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        setError(`Failed to load members (${response.status}): ${errorMessage}`);
        setMemberError(`Failed to load members (${response.status}): ${errorMessage}`);
      } else {
        console.warn('Unexpected members API response format:', response);
        console.warn('Expected: {data: {members: []}} or {data: []} but got:', response);
        setError('Unexpected response format from members API');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Network error occurred while fetching members');
      setMemberError('Network error occurred while fetching members');
    }
  }, []);

  // Fetch welfares from API (for financial officer)
  const fetchWelfares = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const tokenExpires = localStorage.getItem('auth_token_expires');
      
      if (!token) {
        console.warn('No auth token found, skipping welfares fetch');
        return;
      }

      // Check if token is expired
      if (tokenExpires) {
        const expiryDate = new Date(tokenExpires);
        const now = new Date();
        if (now > expiryDate) {
          console.warn('Auth token has expired, clearing session');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token_expires');
          localStorage.removeItem('auth_user_data');
          setError('Session expired. Please log in again.');
          return;
        }
      }

      const response = await apiRequest<{ welfares?: any[]; data?: any; status?: string }>('welfares', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setWelfares(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where welfares array is directly in response.data
        console.log('Welfares found directly in response.data, loaded', response.data.length, 'welfares');
        setWelfares(response.data);
      } else if (response.error) {
        console.error('Error fetching welfares:', response.error.message);
        console.error('Full error object:', response.error);
        console.error('HTTP status:', response.status);
        
        let errorMessage = response.error.message;
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token_expires');
          localStorage.removeItem('auth_user_data');
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to view welfares.';
        } else if (response.status === 404) {
          errorMessage = 'Welfares endpoint not found. Please check if the backend API is properly configured.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        setError(`Failed to load welfares (${response.status}): ${errorMessage}`);
        setWelfareError(`Failed to load welfares (${response.status}): ${errorMessage}`);
      } else {
        console.warn('Unexpected welfares API response format:', response);
        console.warn('Expected: {data: {welfares: []}} or {data: []} but got:', response);
        setError('Unexpected response format from welfares API');
      }
    } catch (error) {
      console.error('Error fetching welfares:', error);
      setError('Network error occurred while fetching welfares');
      setWelfareError('Network error occurred while fetching welfares');
    }
  }, []);
  
  // Fetch attendances from API (for pastor)
  const fetchAttendances = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const tokenExpires = localStorage.getItem('auth_token_expires');
      
      if (!token) {
        console.warn('No auth token found, skipping attendances fetch');
        return;
      }

      // Check if token is expired
      if (tokenExpires) {
        const expiryDate = new Date(tokenExpires);
        const now = new Date();
        if (now > expiryDate) {
          console.warn('Auth token has expired, clearing session');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token_expires');
          localStorage.removeItem('auth_user_data');
          setError('Session expired. Please log in again.');
          return;
        }
      }

      const response = await apiRequest<{ attendances?: any[]; data?: any; status?: string }>('attendances', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.attendances && Array.isArray(response.data.attendances)) {
        setAttendances(response.data.attendances);
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where attendances array is directly in response.data
        setAttendances(response.data);
      } else if (response.error) {
        console.error('Error fetching attendances:', response.error.message);
        // Don't set error for attendances since it might be a permission issue
        console.warn('Attendances data not available, using fallback data');
      } else {
        console.warn('Unexpected attendances API response format:', response);
        console.warn('Expected: {data: {attendances: []}} or {data: []} but got:', response);
      }
    } catch (error) {
      console.error('Error fetching attendances:', error);
      console.warn('Attendances data not available, using fallback data');
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const tokenExpires = localStorage.getItem('auth_token_expires');
      
      if (!token) {
        console.warn('No auth token found, skipping organizations fetch');
        return;
      }

      // Check if token is expired
      if (tokenExpires) {
        const expiryDate = new Date(tokenExpires);
        const now = new Date();
        if (now > expiryDate) {
          console.warn('Auth token has expired, clearing session');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token_expires');
          localStorage.removeItem('auth_user_data');
          setError('Session expired. Please log in again.');
          return;
        }
      }

      const response = await apiRequest<{ organisations?: any[]; data?: any; status?: string }>('organisations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.organisations && Array.isArray(response.data.organisations)) {
        setOrganizations(response.data.organisations);
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where organizations array is directly in response.data
        console.log('Organizations found directly in response.data, loaded', response.data.length, 'organizations');
        setOrganizations(response.data);
      } else if (response.error) {
        console.error('Error fetching organizations:', response.error.message);
        console.error('Full error object:', response.error);
        console.error('HTTP status:', response.status);
        
        let errorMessage = response.error.message;
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_token_expires');
          localStorage.removeItem('auth_user_data');
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to view organizations.';
        } else if (response.status === 404) {
          errorMessage = 'Organizations endpoint not found. Please check if the backend API is properly configured.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        setError(`Failed to load organizations (${response.status}): ${errorMessage}`);
      } else {
        console.warn('Unexpected organizations API response format:', response);
        console.warn('Expected: {data: {organisations: []}} or {data: []} but got:', response);
        setError('Unexpected response format from organizations API');
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Network error occurred while fetching organizations');
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (isFinanceOfficer) {
        // Financial officer needs welfares data, members data is optional (may not have permission)
        await fetchWelfares();
        // Try to fetch members but don't fail if no permission
        try {
          await fetchMembers();
        } catch (error) {
          console.warn('Financial officer cannot access members data, using fallback member count');
          // Clear member-related errors for financial officers since it's expected
          setError(null);
          setMemberError(null);
        }
      } else if (isHeadPastor) {
        // Head Pastor needs all data: members, organizations, welfares, and attendances
        await Promise.all([fetchMembers(), fetchOrganizations(), fetchWelfares(), fetchAttendances()]);
      } else {
        // Admin needs members, organizations, and attendances
        await Promise.all([fetchMembers(), fetchOrganizations(), fetchAttendances()]);
      }
      setLoading(false);
    };
    fetchData();
  }, [fetchMembers, fetchOrganizations, fetchWelfares, fetchAttendances, isFinanceOfficer, isHeadPastor]);

  // Calculate member statistics from API data
  const memberStats = useMemo(() => {
    if (loading) {
      return {
        total: 0,
        active: 0,
        newThisMonth: 0,
        growth: 0,
        loading: true,
      };
    }

    if (error || members.length === 0) {
      // Fallback to hardcoded values when API is not available
      return {
        total: 450,
        active: 380,
        newThisMonth: 12,
        growth: 2.5,
        loading: false,
        fallback: true,
      };
    }

    const total = members.length;
    const active = members.filter(member => member.status === 'active' || !member.status).length; // Assume active if no status field
    
    // Calculate new members this month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const newThisMonth = members.filter(member => {
      if (!member.inserted_at) return false;
      return member.inserted_at.startsWith(currentMonth);
    }).length;

    // Calculate growth (simplified - could be improved with historical data)
    const growth = total > 0 ? ((newThisMonth / total) * 100) : 0;

    return {
      total,
      active,
      newThisMonth,
      growth: parseFloat(growth.toFixed(1)),
      loading: false,
      fallback: false,
    };
  }, [members, loading, error]);

  // Calculate organization statistics from API data
  const organizationStats = useMemo(() => {
    if (loading) {
      return {
        total: 0,
        activeLeaders: 0,
        totalMembers: 0,
        loading: true,
      };
    }

    if (error || organizations.length === 0) {
      // Fallback to hardcoded values when API is not available
      return {
        total: 11,
        activeLeaders: 16,
        totalMembers: 450,
        loading: false,
        fallback: true,
      };
    }

    const total = organizations.length;
    const activeLeaders = organizations.reduce((count, org) => {
      return count + (org.leader_id ? 1 : 0);
    }, 0);
    
    const totalMembers = organizations.reduce((count, org) => {
      return count + (org.members ? org.members.length : 0);
    }, 0);

    return {
      total,
      activeLeaders,
      totalMembers,
      loading: false,
      fallback: false,
    };
  }, [organizations, loading, error]);

  // Calculate attendance statistics from API data
  const attendanceStats = useMemo(() => {
    if (loading) {
      return {
        totalThisMonth: 0,
        averagePerService: 0,
        servicesThisMonth: 0,
        growth: 0,
        loading: true,
      };
    }

    if (error || attendances.length === 0) {
      // Fallback to hardcoded values when API is not available
      return {
        totalThisMonth: 2840,
        averagePerService: 142,
        servicesThisMonth: 20,
        growth: 5.2,
        loading: false,
        fallback: true,
      };
    }

    // Calculate current month attendance
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const currentMonthAttendances = attendances.filter(attendance => {
      if (!attendance.date) return false;
      // Validate date
      const date = new Date(attendance.date);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date found in attendance record:', attendance.date);
        return false;
      }
      return attendance.date.startsWith(currentMonth);
    });

    const totalThisMonth = currentMonthAttendances.reduce((sum, attendance) => {
      return sum + (attendance.total || 0);
    }, 0);

    const servicesThisMonth = currentMonthAttendances.length;
    const averagePerService = servicesThisMonth > 0 ? Math.round(totalThisMonth / servicesThisMonth) : 0;

    // Calculate growth (compare with previous month)
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    
    const prevMonthAttendances = attendances.filter(attendance => {
      if (!attendance.date) return false;
      // Validate date
      const date = new Date(attendance.date);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date found in attendance record:', attendance.date);
        return false;
      }
      return attendance.date.startsWith(prevMonthStr);
    });

    const prevMonthTotal = prevMonthAttendances.reduce((sum, attendance) => {
      return sum + (attendance.total || 0);
    }, 0);

    const growth = prevMonthTotal > 0 ? ((totalThisMonth - prevMonthTotal) / prevMonthTotal) * 100 : 0;

    return {
      totalThisMonth,
      averagePerService,
      servicesThisMonth,
      growth: parseFloat(growth.toFixed(1)),
      loading: false,
      fallback: false,
    };
  }, [attendances, loading, error]);

  // Calculate dues payments from API data or use hardcoded fallback
  const duesPayments = useMemo(() => {
    if (isFinanceOfficer && welfares.length > 0) {
      // Map API welfare data to DuesPayment format
      return welfares.map((welfare) => ({
        id: welfare.id?.toString() || Math.random().toString(),
        date: welfare.payment_date || new Date().toISOString().split('T')[0],
        memberName: welfare.member_name || 'Unknown Member',
        amount: parseFloat(welfare.amount) || 0,
        method: welfare.payment_method || 'Cash',
      }));
    }
    
    // Fallback to hardcoded data
    return [
      { id: '1', date: '2026-04-14', memberName: 'Kwame Asante', amount: 50, method: 'Cash' },
      { id: '2', date: '2026-04-13', memberName: 'Ama Mensah', amount: 50, method: 'Mobile Money' },
      { id: '3', date: '2026-04-10', memberName: 'Akosua Adjei', amount: 25, method: 'Bank Transfer' },
      { id: '4', date: '2026-04-08', memberName: 'Efua Boateng', amount: 50, method: 'Cash' },
      { id: '5', date: '2026-03-28', memberName: 'Yaw Appiah', amount: 50, method: 'Mobile Money' },
      { id: '6', date: '2026-03-25', memberName: 'Kwame Asante', amount: 50, method: 'Cash' },
      { id: '7', date: '2026-03-24', memberName: 'Ama Mensah', amount: 50, method: 'Cash' },
      { id: '8', date: '2026-03-22', memberName: 'Kofi Osei', amount: 50, method: 'Bank Transfer' },
      { id: '9', date: '2026-03-20', memberName: 'Akosua Adjei', amount: 50, method: 'Cash' },
      { id: '10', date: '2026-03-18', memberName: 'Efua Boateng', amount: 50, method: 'Cash' },
      { id: '11', date: '2026-03-15', memberName: 'Yaw Appiah', amount: 40, method: 'Cash' },
    ];
  }, [isFinanceOfficer, welfares]);

  const duesMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const collected = duesPayments
      .filter((p) => p.date.startsWith(currentMonth))
      .reduce((sum, p) => sum + p.amount, 0);
    const prevCollected = duesPayments
      .filter((p) => p.date.startsWith(prevMonthStr))
      .reduce((sum, p) => sum + p.amount, 0);

    // Calculate expected based on actual member count for financial officers
    let memberCount = WELFARE_ROSTER_MEMBER_COUNT; // fallback
    if (isFinanceOfficer && members.length > 0) {
      memberCount = members.length;
    }
    
    const expected = memberCount * MONTHLY_DUES_GHC;
    const outstanding = Math.max(0, expected - collected);
    const prevOutstanding = Math.max(0, expected - prevCollected);
    const collectionPct = expected > 0 ? (collected / expected) * 100 : 0;
    const prevCollectionPct = expected > 0 ? (prevCollected / expected) * 100 : 0;
    const collectedChangeVsPrev =
      prevCollected > 0 ? ((collected - prevCollected) / prevCollected) * 100 : collected > 0 ? 100 : 0;

    return {
      collected,
      expected,
      outstanding,
      collectionPct,
      collectedChangeVsPrev: parseFloat(collectedChangeVsPrev.toFixed(1)),
      paymentCount: duesPayments.filter((p) => p.date.startsWith(currentMonth)).length,
      prevCollected,
      prevOutstanding,
      targetProgressVsPrev: parseFloat((collectionPct - prevCollectionPct).toFixed(1)),
      memberCount, // Include member count for display
    };
  }, [duesPayments, isFinanceOfficer, members]);

  const recentDuesPayments = useMemo(() => {
    return [...duesPayments]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
      .map((p) => {
        const date = new Date(p.date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        let dateLabel = '';
        if (diffDays === 0) dateLabel = 'Today';
        else if (diffDays === 1) dateLabel = 'Yesterday';
        else if (diffDays <= 7) dateLabel = `${diffDays} days ago`;
        else dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          id: p.id,
          dateLabel,
          memberName: p.memberName,
          method: p.method,
          amountLabel: `GHC ${p.amount.toFixed(2)}`,
        };
      });
  }, [duesPayments]);

  const executiveStats = useMemo(
    () => ({
      members: {
        total: memberStats.total,
        active: memberStats.active,
        newThisMonth: memberStats.newThisMonth,
        growth: memberStats.growth,
      },
      attendance: {
        totalThisMonth: attendanceStats.totalThisMonth,
        averagePerService: attendanceStats.averagePerService,
        servicesThisMonth: attendanceStats.servicesThisMonth,
        growth: attendanceStats.growth,
      },
      dues: duesMonthStats,
      organizations: {
        total: organizationStats.total,
        activeLeaders: organizationStats.activeLeaders,
      },
    }),
    [memberStats, organizationStats, duesMonthStats, attendanceStats]
  );

  const headPastorRecentActivity = useMemo(
    () => [
      {
        id: 1,
        type: 'dues',
        title: 'Welfare / dues payment',
        description: `GHC ${duesPayments[0]?.amount.toFixed(2)} — ${duesPayments[0]?.memberName}`,
        time: '2 hours ago',
        icon: HiReceiptRefund,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        href: '/dashboard/welfare-dues',
      },
      {
        id: 2,
        type: 'member',
        title: 'New member registered',
        description: 'John Doe joined the parish',
        time: '1 day ago',
        icon: HiOutlineUsers,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        href: '/dashboard/members',
      },
      {
        id: 3,
        type: 'attendance',
        title: 'Sunday Service recorded',
        description: '102 attendees recorded',
        time: '1 day ago',
        icon: HiOutlineClipboardCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        href: '/dashboard/attendance',
      },
      {
        id: 4,
        type: 'dues',
        title: 'Partial dues recorded',
        description: `GHC ${duesPayments[2]?.amount.toFixed(2)} — ${duesPayments[2]?.memberName}`,
        time: '2 days ago',
        icon: HiPlus,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        href: '/dashboard/welfare-dues',
      },
      {
        id: 5,
        type: 'dues',
        title: 'Monthly dues summary updated',
        description: `${duesMonthStats.collectionPct.toFixed(0)}% of the monthly target collected`,
        time: '3 days ago',
        icon: HiOutlineChartBar,
        color: 'text-teal-600',
        bgColor: 'bg-teal-100',
        href: '/dashboard/generate-report',
      },
    ],
    [duesPayments, duesMonthStats.collectionPct]
  );

  // Pattern SVG definitions
  const patternStyles = [
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23dc2626\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/svg%3E")',
    },
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
    },
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/svg%3E")',
    },
  ];

  // Admin Dashboard
  if (isAdmin) {
    const adminStats = [
      {
        title: 'Total Members',
        value: memberStats.total.toLocaleString(),
        change: memberStats.fallback ? 'Using fallback data' : `+${memberStats.growth}%`,
        trend: 'up' as const,
        icon: HiOutlineUsers,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        href: '/dashboard/members',
      },
      {
        title: 'Monthly Attendance',
        value: attendanceStats.totalThisMonth.toLocaleString(),
        change: attendanceStats.fallback ? 'Using fallback data' : `+${attendanceStats.growth}%`,
        trend: 'up' as const,
        icon: HiOutlineClipboardCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        href: '/dashboard/attendance',
      },
      {
        title: 'Organizations',
        value: organizationStats.total.toString(),
        change: organizationStats.fallback ? 'Using fallback data' : `${organizationStats.activeLeaders} Leaders`,
        trend: 'neutral' as const,
        icon: HiOutlineOfficeBuilding,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        href: '/dashboard/departments',
      },
    ];

    // Show error message if API calls failed
    const showApiError = error && !loading;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Welcome back, {user?.name || 'Admin'}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Here is an overview of parish administration for St. Joseph Catholic Church
          </p>
        </div>

        {/* API Error Alert */}
        {showApiError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  API Connection Issue
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Unable to load data from the backend API. Using fallback data for display. Error: {error}</p>
                  <p className="mt-1">Please check that the backend server is running at {getApiBase()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {adminStats.map((stat, index) => {
            const Icon = stat.icon;
            const pattern = patternStyles[index % patternStyles.length];
            return (
              <Link key={index} href={stat.href}>
                <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div 
                    className="absolute inset-0"
                    style={{ backgroundImage: pattern.background }}
                  />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-xl font-semibold text-gray-900 mb-2">{stat.value}</p>
                        {stat.change && (
                          <div className="flex items-center gap-1">
                            {stat.trend === 'up' && <HiArrowUp className="h-3 w-3 text-green-600" />}
                            <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-gray-600'}`}>
                              {stat.change}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2 relative overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 40 0 L 0 0 0 40\' fill=\'none\' stroke=\'%233b82f6\' stroke-width=\'1\' opacity=\'0.15\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grid)\'/%3E%3C/svg%3E")',
              }}
            />
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 rounded-full blur-2xl opacity-8" />
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Members Overview</CardTitle>
                <Link href="/dashboard/members">
                  <HiChevronRight className="h-4 w-4 text-blue-600" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Members</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{memberStats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Active Members</p>
                    <p className="text-xl sm:text-2xl font-semibold text-blue-600">{memberStats.active}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">New This Month</p>
                    <p className="text-xl sm:text-2xl font-semibold text-green-600">+{memberStats.newThisMonth}</p>
                  </div>
                </div>
                <Link href="/dashboard/members">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <HiOutlineUsers className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-600 text-white border-0 relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12 opacity-10"></div>
            <CardContent className="p-6 relative z-10">
              <div className="mb-4">
                <CardTitle className="text-base font-semibold text-white mb-2">Quick Actions</CardTitle>
                <p className="text-xs text-green-50">Quick access to key administrative functions</p>
              </div>
              <div className="space-y-2">
                <Link href="/dashboard/members">
                  <Button variant="outline" className="w-full bg-white text-green-600 hover:bg-green-50 border-0 mb-2">
                    <HiOutlineUsers className="h-4 w-4 mr-2" />
                    Manage Members
                  </Button>
                </Link>
                <Link href="/dashboard/attendance">
                  <Button variant="outline" className="w-full bg-white text-green-600 hover:bg-green-50 border-0 mb-2">
                    <HiOutlineClipboardCheck className="h-4 w-4 mr-2" />
                    Record Attendance
                  </Button>
                </Link>
                <Link href="/dashboard/departments">
                  <Button variant="outline" className="w-full bg-white text-green-600 hover:bg-green-50 border-0">
                    <HiOutlineOfficeBuilding className="h-4 w-4 mr-2" />
                    Organizations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-64 h-64"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
            }}
          />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
              <button className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                See all
                <HiOutlineArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {ADMIN_RECENT_ACTIVITY.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                    <div className={`w-10 h-10 rounded-lg ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                    <HiChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Finance officer: welfare & dues only (no general ledger in this build)
  if (isFinanceOfficer) {
    const stats = [
      {
        title: 'Dues collected (this month)',
        value: `GHC ${duesMonthStats.collected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${duesMonthStats.collectedChangeVsPrev >= 0 ? '+' : ''}${duesMonthStats.collectedChangeVsPrev}% vs last month`,
        trend: duesMonthStats.collectedChangeVsPrev >= 0 ? ('up' as const) : ('down' as const),
        icon: duesMonthStats.collectedChangeVsPrev >= 0 ? HiTrendingUp : HiTrendingDown,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        title: 'Outstanding (this month)',
        value: `GHC ${duesMonthStats.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `Target GHC ${duesMonthStats.expected.toFixed(2)}`,
        trend:
          duesMonthStats.outstanding < duesMonthStats.prevOutstanding
            ? ('up' as const)
            : duesMonthStats.outstanding > duesMonthStats.prevOutstanding
              ? ('down' as const)
              : ('neutral' as const),
        icon: HiReceiptRefund,
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
      },
      {
        title: 'Collection progress',
        value: `${duesMonthStats.collectionPct.toFixed(0)}%`,
        change: `${duesMonthStats.paymentCount} payment${duesMonthStats.paymentCount === 1 ? '' : 's'} logged`,
        trend: duesMonthStats.targetProgressVsPrev >= 0 ? ('up' as const) : ('down' as const),
        icon: HiOutlineChartBar,
        color: 'text-teal-700',
        bgColor: 'bg-teal-100',
      },
    ];

    // Show error message if API calls failed
    const showApiError = error && !loading;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Welcome back, {user?.name || 'Finance'}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welfare and monthly dues for St. Joseph Catholic Church — record payments and run reports
          </p>
        </div>

        {/* API Error Alert */}
        {showApiError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  API Connection Issue
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Unable to load some data from the backend API. Using fallback data for display. Error: {welfareError || error}</p>
                  <p className="mt-1">Please check that the backend server is running at {getApiBase()}</p>
                  {error.includes('403') && (
                    <p className="mt-1 text-yellow-600">Note: Some data may be restricted based on your user permissions.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats Row */}
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
                      <p className="text-xs text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-xl font-semibold text-gray-900 mb-2">{stat.value}</p>
                      {stat.change && (
                        <div className="flex items-center gap-1">
                          {stat.trend === 'up' && <HiArrowUp className="h-3 w-3 text-green-600" />}
                          {stat.trend === 'down' && <HiArrowDown className="h-3 w-3 text-red-600" />}
                          <p
                            className={`text-xs ${
                              stat.trend === 'up'
                                ? 'text-green-600'
                                : stat.trend === 'down'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {stat.change}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor || 'bg-green-100'} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${stat.color || 'text-green-600'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welfare & dues overview */}
          <Card className="lg:col-span-2 relative overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 40 0 L 0 0 0 40\' fill=\'none\' stroke=\'%2316a34a\' stroke-width=\'1\' opacity=\'0.15\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grid)\'/%3E%3C/svg%3E")',
              }}
            />
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-full blur-3xl opacity-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-400 rounded-full blur-2xl opacity-8" />
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Welfare & dues overview</CardTitle>
                <Link href="/dashboard/welfare-dues" className="text-green-600 hover:text-green-700">
                  <HiChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-xs text-gray-600">Collected (this month)</p>
                    <p className="text-lg font-semibold text-green-700">
                      GHC {duesMonthStats.collected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">Monthly target</p>
                    <p className="text-lg font-semibold text-gray-900">
                      GHC {duesMonthStats.expected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{duesMonthStats.memberCount} members × GHC {MONTHLY_DUES_GHC}</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-gray-600">Outstanding</p>
                    <p className="text-lg font-semibold text-amber-800">
                      GHC {duesMonthStats.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {duesMonthStats.paymentCount} payment{duesMonthStats.paymentCount === 1 ? '' : 's'} recorded this month ·{' '}
                  {duesMonthStats.collectionPct.toFixed(0)}% of target
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Link href="/dashboard/welfare-dues" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                      <HiReceiptRefund className="h-4 w-4 mr-2" />
                      Open Welfare / Dues
                    </Button>
                  </Link>
                  <Link href="/dashboard/generate-report" className="flex-1">
                    <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                      <HiOutlineChartBar className="h-4 w-4 mr-2" />
                      Generate report
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Card */}
          <Card className="bg-green-600 text-white border-0 relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12 opacity-10"></div>
            <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-5"></div>
            <CardContent className="p-6 relative z-10">
              <div className="mb-4">
                <CardTitle className="text-base font-semibold text-white mb-2">Quick Actions</CardTitle>
                <p className="text-xs text-green-50">Record dues, check balances, and export welfare summaries.</p>
              </div>
              <div className="space-y-2">
                <Link href="/dashboard/welfare-dues">
                  <Button variant="outline" className="w-full bg-white text-green-600 hover:bg-green-50 border-0 mb-2">
                    <HiReceiptRefund className="h-4 w-4 mr-2" />
                    Welfare / Dues
                  </Button>
                </Link>
                <Link href="/dashboard/generate-report">
                  <Button variant="outline" className="w-full bg-white text-green-600 hover:bg-green-50 border-0">
                    <HiOutlineChartBar className="h-4 w-4 mr-2" />
                    Generate report
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Transactions */}
        <Card className="relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-64 h-64"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
            }}
          />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Recent dues payments</CardTitle>
              <Link
                href="/dashboard/welfare-dues"
                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                View ledger
                <HiOutlineArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {recentDuesPayments.map((row) => (
                <div key={row.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900">{row.memberName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="text-xs text-gray-500">{row.dateLabel}</p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">{row.method}</p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">Welfare / dues</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-green-600">{row.amountLabel}</p>
                  </div>
                  <Link href="/dashboard/welfare-dues" className="ml-4 rounded p-1 hover:bg-gray-100">
                    <HiChevronRight className="h-3 w-3 text-gray-400" />
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Executive Dashboard for Head Pastor
  
  if (isHeadPastor) {
    const executiveStatsCards = [
    {
      title: 'Total Members',
      value: executiveStats.members.total.toLocaleString(),
      subtitle: `${executiveStats.members.active} active`,
      change: `+${executiveStats.members.newThisMonth} this month`,
      trend: 'up' as const,
      icon: HiOutlineUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/dashboard/members',
    },
    {
      title: 'Monthly Attendance',
      value: executiveStats.attendance.totalThisMonth.toLocaleString(),
      subtitle: `${executiveStats.attendance.averagePerService} avg/service`,
      change: `+${executiveStats.attendance.growth}% growth`,
      trend: 'up' as const,
      icon: HiOutlineClipboardCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/dashboard/attendance',
    },
    {
      title: 'Dues collected',
      value: `GHC ${executiveStats.dues.collected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${executiveStats.dues.collectionPct.toFixed(0)}% of GHC ${executiveStats.dues.expected} monthly target`,
      change: `${executiveStats.dues.collectedChangeVsPrev >= 0 ? '+' : ''}${executiveStats.dues.collectedChangeVsPrev}% vs last month`,
      trend: executiveStats.dues.collectedChangeVsPrev >= 0 ? ('up' as const) : ('down' as const),
      icon: HiReceiptRefund,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/dashboard/welfare-dues',
    },
    {
      title: 'Organizations',
      value: executiveStats.organizations.total.toString(),
      subtitle: 'Organizations',
      change: `${executiveStats.organizations.activeLeaders} active leaders`,
      trend: 'neutral' as const,
      icon: HiOutlineOfficeBuilding,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/dashboard/departments',
    },
    ];

    // Show error message if API calls failed
    const showApiError = error && !loading;

    return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Welcome, {user?.name || 'User'}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Executive overview for St. Joseph Catholic Church — parish operations and key metrics
        </p>
      </div>

      {/* API Error Alert */}
      {showApiError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                API Connection Issue
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Unable to load data from the backend API. Using fallback data for display. Error: {error}</p>
                <p className="mt-1">Please check that the backend server is running at {getApiBase()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {executiveStatsCards.map((stat, index) => {
          const Icon = stat.icon;
          const pattern = patternStyles[index % patternStyles.length];
          return (
            <Link key={index} href={stat.href}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div 
                  className="absolute inset-0"
                  style={{ backgroundImage: pattern.background }}
                />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-xl font-semibold text-gray-900 mb-1">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.subtitle}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  {stat.change && (
                    <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
                      {stat.trend === 'up' && <HiArrowUp className="h-3 w-3 text-green-600" />}
                      {stat.trend === 'down' && <HiArrowDown className="h-3 w-3 text-red-600" />}
                      <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {stat.change}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welfare & dues overview */}
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'40\' height=\'40\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 40 0 L 0 0 0 40\' fill=\'none\' stroke=\'%2316a34a\' stroke-width=\'1\' opacity=\'0.15\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100\' height=\'100\' fill=\'url(%23grid)\'/%3E%3C/svg%3E")',
            }}
          />
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-full blur-3xl opacity-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400 rounded-full blur-2xl opacity-8" />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Welfare & dues overview</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/welfare-dues">
                  <Button variant="outline" size="sm">
                    Welfare / Dues
                    <HiChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/dashboard/generate-report">
                  <Button variant="outline" size="sm">
                    Reports
                    <HiChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4 sm:space-y-6">
              <p className="text-sm text-gray-600">
                Parish financial tracking in this system is limited to <strong className="font-medium text-gray-800">monthly welfare dues</strong> (GHC{' '}
                {MONTHLY_DUES_GHC} per member on the roster). Use Welfare/Dues to record payments and follow up on balances.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
                  <p className="mb-1 text-xs text-gray-600">Collected (this month)</p>
                  <p className="break-words text-lg font-semibold text-green-700 sm:text-xl">
                    GHC {executiveStats.dues.collected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-2 text-xs text-green-700">
                    {executiveStats.dues.paymentCount} payment{executiveStats.dues.paymentCount === 1 ? '' : 's'} logged
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
                  <p className="mb-1 text-xs text-gray-600">Monthly target</p>
                  <p className="break-words text-lg font-semibold text-gray-900 sm:text-xl">
                    GHC {executiveStats.dues.expected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {duesMonthStats.memberCount} members × GHC {MONTHLY_DUES_GHC}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
                  <p className="mb-1 text-xs text-gray-600">Outstanding</p>
                  <p className="break-words text-lg font-semibold text-amber-800 sm:text-xl">
                    GHC {executiveStats.dues.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-2 text-xs text-amber-800">{executiveStats.dues.collectionPct.toFixed(0)}% of target collected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12 opacity-10"></div>
          <CardContent className="p-6 relative z-10">
            <div className="mb-4">
              <CardTitle className="text-base font-semibold text-white mb-2">Quick Access</CardTitle>
              <p className="text-xs text-blue-100">Navigate to key areas</p>
            </div>
            <div className="space-y-2">
              <Link href="/dashboard/welfare-dues">
                <Button variant="outline" className="w-full bg-white text-blue-600 hover:bg-blue-50 border-0 mb-2">
                  <HiReceiptRefund className="h-4 w-4 mr-2" />
                  Welfare / Dues
                </Button>
              </Link>
              <Link href="/dashboard/members">
                <Button variant="outline" className="w-full bg-white text-blue-600 hover:bg-blue-50 border-0 mb-2">
                  <HiOutlineUsers className="h-4 w-4 mr-2" />
                  View Members
                </Button>
              </Link>
              <Link href="/dashboard/attendance">
                <Button variant="outline" className="w-full bg-white text-blue-600 hover:bg-blue-50 border-0 mb-2">
                  <HiOutlineClipboardCheck className="h-4 w-4 mr-2" />
                  View Attendance
                </Button>
              </Link>
              <Link href="/dashboard/generate-report">
                <Button variant="outline" className="w-full bg-white text-blue-600 hover:bg-blue-50 border-0 mb-2">
                  <HiOutlineChartBar className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </Link>
              <Link href="/dashboard/departments">
                <Button variant="outline" className="w-full bg-white text-blue-600 hover:bg-blue-50 border-0">
                  <HiOutlineOfficeBuilding className="h-4 w-4 mr-2" />
                  Organizations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members & Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Members Overview */}
        <Card className="relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-64 h-64"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%233b82f6\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
            }}
          />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-semibold text-gray-900">Members Overview</CardTitle>
              <Link href="/dashboard/members">
                <HiChevronRight className="h-4 w-4 text-blue-600" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">{executiveStats.members.total}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Active</p>
                  <p className="text-xl sm:text-2xl font-semibold text-blue-600">{executiveStats.members.active}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">New This Month</p>
                  <p className="text-xl sm:text-2xl font-semibold text-green-600">+{executiveStats.members.newThisMonth}</p>
                </div>
              </div>
              <Link href="/dashboard/members">
                <Button variant="outline" className="w-full">
                  View All Members
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card className="relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-64 h-64"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
            }}
          />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Attendance Overview</CardTitle>
              <Link href="/dashboard/attendance">
                <HiChevronRight className="h-4 w-4 text-green-600" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">This Month</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">{executiveStats.attendance.totalThisMonth.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Avg/Service</p>
                  <p className="text-xl sm:text-2xl font-semibold text-green-600">{executiveStats.attendance.averagePerService}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Services</p>
                  <p className="text-xl sm:text-2xl font-semibold text-blue-600">{executiveStats.attendance.servicesThisMonth}</p>
                </div>
              </div>
              <Link href="/dashboard/attendance">
                <Button variant="outline" className="w-full">
                  View Attendance Records
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="relative overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-64 h-64"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
          }}
        />
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
            <button className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
              See all
              <HiOutlineArrowRight className="h-3 w-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-4">
            {headPastorRecentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <Link key={activity.id} href={activity.href}>
                  <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors cursor-pointer">
                    <div className={`w-10 h-10 rounded-lg ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                    <HiChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  }

  // Fallback for other roles
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome to the St. Joseph Catholic Church administration portal
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-600">Dashboard content for {user?.roleName}</p>
        </CardContent>
      </Card>
    </div>
  );
}
