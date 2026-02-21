'use client';

import { useState, useMemo } from 'react';
import {
  HiArrowUp,
  HiArrowDown,
  HiChevronRight,
  HiOutlineArrowRight,
  HiTrendingUp,
  HiTrendingDown,
  HiPlus,
  HiMinus,
  HiOutlineUsers,
  HiOutlineClipboardCheck,
  HiOutlineOfficeBuilding,
  HiOutlineChatAlt,
  HiUserGroup,
  HiOutlineCalendar,
  HiReceiptRefund,
  HiOutlineChartBar,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface IncomeEntry {
  id: string;
  date: string;
  category: string;
  subcategory?: string;
  amount: number;
  paymentMethod: 'cash' | 'mobile-money' | 'bank-transfer';
  notes?: string;
}

interface ExpenditureEntry {
  id: string;
  date: string;
  category: string;
  subcategory?: string;
  amount: number;
  paymentMethod: 'cash' | 'mobile-money' | 'bank-transfer';
  payee?: string;
  notes?: string;
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('church_admin');
  const isFinanceOfficer = hasRole('finance_officer');

  // Financial data for finance officers
  const [incomeEntries] = useState<IncomeEntry[]>([
    { id: '1', date: '2024-03-15', category: 'Offerings', subcategory: 'Sunday Morning Service (1st)', amount: 205.00, paymentMethod: 'cash' },
    { id: '2', date: '2024-03-10', category: 'Sunday Offerings', amount: 7360.00, paymentMethod: 'cash' },
    { id: '3', date: '2024-03-12', category: 'Mid-week Services Offerings', amount: 1070.50, paymentMethod: 'mobile-money' },
    { id: '4', date: '2024-03-10', category: 'Donations', subcategory: 'One-off donations', amount: 325.00, paymentMethod: 'bank-transfer' },
    { id: '5', date: '2024-03-09', category: 'Donations', subcategory: 'Welfare donations', amount: 350.00, paymentMethod: 'mobile-money' },
    { id: '6', date: '2024-03-11', category: 'Donations', subcategory: 'Project donations', amount: 454.00, paymentMethod: 'cash' },
    { id: '7', date: '2024-03-13', category: 'Special Society Funds', subcategory: 'Welfare Fund', amount: 410.00, paymentMethod: 'cash' },
    { id: '8', date: '2024-03-07', category: 'Special Society Funds', subcategory: 'Building Fund', amount: 148.20, paymentMethod: 'bank-transfer' },
    { id: '9', date: '2024-03-06', category: 'Special Society Funds', subcategory: 'Mission / Evangelism Fund', amount: 212.50, paymentMethod: 'mobile-money' },
    { id: '10', date: '2024-03-05', category: 'Harvest / Anniversary Offerings', amount: 1800.00, paymentMethod: 'cash' },
  ]);

  const [expenditureEntries] = useState<ExpenditureEntry[]>([
    { id: '1', date: '2024-03-15', category: 'Operational Expenses', subcategory: 'Utilities (water, electricity)', amount: 450.00, paymentMethod: 'bank-transfer', payee: 'ECG' },
    { id: '2', date: '2024-03-10', category: 'Operational Expenses', subcategory: 'Cleaning & maintenance', amount: 200.00, paymentMethod: 'cash' },
    { id: '3', date: '2024-03-12', category: 'Payroll & Allowances', subcategory: 'Ministers\' stipends', amount: 1200.00, paymentMethod: 'bank-transfer', payee: 'Rev. John Doe' },
    { id: '4', date: '2024-03-10', category: 'Programs & Activities', subcategory: 'Evangelism programs', amount: 500.00, paymentMethod: 'cash' },
    { id: '5', date: '2024-03-10', category: 'Capital Expenditure', subcategory: 'Equipment purchases (PA system, instruments)', amount: 3500.00, paymentMethod: 'bank-transfer', payee: 'Sound Systems Ltd' },
  ]);

  // Calculate current month stats for finance officers
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const monthIncome = incomeEntries
      .filter(entry => entry.date.startsWith(currentMonth))
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const monthExpenditure = expenditureEntries
      .filter(entry => entry.date.startsWith(currentMonth))
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const netIncome = monthIncome - monthExpenditure;
    
    // Previous month for comparison
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    
    const prevMonthIncome = incomeEntries
      .filter(entry => entry.date.startsWith(prevMonthStr))
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const prevMonthExpenditure = expenditureEntries
      .filter(entry => entry.date.startsWith(prevMonthStr))
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const incomeChange = prevMonthIncome > 0 
      ? ((monthIncome - prevMonthIncome) / prevMonthIncome * 100).toFixed(1)
      : '0';
    
    const expenditureChange = prevMonthExpenditure > 0
      ? ((monthExpenditure - prevMonthExpenditure) / prevMonthExpenditure * 100).toFixed(1)
      : '0';
    
    return {
      income: monthIncome,
      expenditure: monthExpenditure,
      net: netIncome,
      incomeChange: parseFloat(incomeChange),
      expenditureChange: parseFloat(expenditureChange),
      incomeCount: incomeEntries.filter(entry => entry.date.startsWith(currentMonth)).length,
      expenditureCount: expenditureEntries.filter(entry => entry.date.startsWith(currentMonth)).length,
    };
  }, [incomeEntries, expenditureEntries]);

  // Get recent transactions for finance officers
  const recentTransactions = useMemo(() => {
    const allTransactions = [
      ...incomeEntries.slice(0, 5).map(entry => ({
        date: entry.date,
        description: entry.subcategory ? `${entry.category} - ${entry.subcategory}` : entry.category,
        category: entry.category,
        amount: entry.amount,
        type: 'income' as const,
        paymentMethod: entry.paymentMethod,
      })),
      ...expenditureEntries.slice(0, 5).map(entry => ({
        date: entry.date,
        description: entry.payee ? `${entry.category} - ${entry.payee}` : entry.subcategory ? `${entry.category} - ${entry.subcategory}` : entry.category,
        category: entry.category,
        amount: entry.amount,
        type: 'expense' as const,
        paymentMethod: entry.paymentMethod,
      })),
    ];
    
    return allTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(transaction => {
        const date = new Date(transaction.date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let dateLabel = '';
        if (diffDays === 0) dateLabel = 'Today';
        else if (diffDays === 1) dateLabel = 'Yesterday';
        else if (diffDays <= 7) dateLabel = `${diffDays} days ago`;
        else dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return {
          ...transaction,
          date: dateLabel,
          amount: transaction.type === 'income' 
            ? `GHC ${transaction.amount.toFixed(2)}`
            : `-GHC ${transaction.amount.toFixed(2)}`,
        };
      });
  }, [incomeEntries, expenditureEntries]);

  const categoryColors: { [key: string]: string } = {
    'Offerings': 'bg-green-500',
    'Sunday Offerings': 'bg-green-500',
    'Mid-week Services Offerings': 'bg-green-500',
    'Special Thanksgiving Offerings': 'bg-green-500',
    'Harvest / Anniversary Offerings': 'bg-green-500',
    'Donations': 'bg-blue-500',
    'Special Society Funds': 'bg-purple-500',
    'Operational Expenses': 'bg-red-500',
    'Payroll & Allowances': 'bg-orange-500',
    'Programs & Activities': 'bg-yellow-500',
    'Capital Expenditure': 'bg-pink-500',
  };

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
    const membersData = {
      total: 450,
      active: 380,
      newThisMonth: 12,
      growth: 2.5,
    };

    const attendanceData = {
      totalThisMonth: 2840,
      averagePerService: 142,
      servicesThisMonth: 20,
      growth: 5.2,
    };

    const organizationsData = {
      totalOrganizations: 11,
      totalClasses: 5,
      totalMembers: 450,
      activeLeaders: 16,
    };

    const recentActivity = useMemo(() => [
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
    ], []);

    const adminStats = [
      {
        title: 'Total Members',
        value: membersData.total.toLocaleString(),
        change: `+${membersData.growth}%`,
        trend: 'up' as const,
        icon: HiOutlineUsers,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        href: '/dashboard/members',
      },
      {
        title: 'Monthly Attendance',
        value: attendanceData.totalThisMonth.toLocaleString(),
        change: `+${attendanceData.growth}%`,
        trend: 'up' as const,
        icon: HiOutlineClipboardCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        href: '/dashboard/attendance',
      },
      {
        title: 'Organizations',
        value: organizationsData.totalOrganizations.toString(),
        change: `${organizationsData.totalClasses} Classes`,
        trend: 'neutral' as const,
        icon: HiOutlineOfficeBuilding,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        href: '/dashboard/departments',
      },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Welcome back, {user?.name || 'Admin'}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Here's an overview of your parish administration
          </p>
        </div>

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
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{membersData.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Active Members</p>
                    <p className="text-xl sm:text-2xl font-semibold text-blue-600">{membersData.active}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">New This Month</p>
                    <p className="text-xl sm:text-2xl font-semibold text-green-600">+{membersData.newThisMonth}</p>
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
              {recentActivity.map((activity) => {
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

  // Financial Dashboard for Finance Officers
  if (isFinanceOfficer) {
    const stats = [
      {
        title: 'Total Income',
        value: `GHC ${currentMonthStats.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${currentMonthStats.incomeChange >= 0 ? '+' : ''}${currentMonthStats.incomeChange}%`,
        trend: currentMonthStats.incomeChange >= 0 ? 'up' : 'down',
        icon: HiTrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        title: 'Total Expenditure',
        value: `GHC ${currentMonthStats.expenditure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${currentMonthStats.expenditureChange >= 0 ? '+' : ''}${currentMonthStats.expenditureChange}%`,
        trend: currentMonthStats.expenditureChange >= 0 ? 'up' : 'down',
        icon: HiTrendingDown,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      },
      {
        title: 'Net Income',
        value: `GHC ${currentMonthStats.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: currentMonthStats.net >= 0 ? 'Surplus' : 'Deficit',
        trend: currentMonthStats.net >= 0 ? 'up' : 'down',
        icon: currentMonthStats.net >= 0 ? HiTrendingUp : HiTrendingDown,
        color: currentMonthStats.net >= 0 ? 'text-green-600' : 'text-red-600',
        bgColor: currentMonthStats.net >= 0 ? 'bg-green-100' : 'bg-red-100',
      },
    ];

    return (
      <div className="space-y-6">
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
                          <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
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
          {/* Financial Overview Card */}
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
                <CardTitle className="text-base font-semibold text-gray-900">Financial Overview</CardTitle>
                <HiChevronRight className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Current Balance (This Month)</p>
                  <p className={`text-2xl font-semibold ${currentMonthStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    GHC {currentMonthStats.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentMonthStats.incomeCount} income entries • {currentMonthStats.expenditureCount} expenditure entries
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Link href="/dashboard/record-income" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                      <HiPlus className="h-4 w-4 mr-2" />
                      Record Income
                    </Button>
                  </Link>
                  <Link href="/dashboard/expenditure" className="flex-1">
                    <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                      <HiMinus className="h-4 w-4 mr-2" />
                      Record Expenditure
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
                <p className="text-xs text-green-50">Manage your parish finances efficiently with quick access to key functions.</p>
              </div>
              <div className="space-y-2">
                <Link href="/dashboard/generate-report">
                  <Button variant="outline" className="w-full bg-white text-green-600 hover:bg-green-50 border-0 mb-2">
                    Generate Report
                  </Button>
                </Link>
                <Link href="/dashboard/record-income">
                  <Button variant="outline" className="w-full bg-white text-green-600 hover:bg-green-50 border-0">
                    View All Income
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
              <CardTitle className="text-base font-semibold text-gray-900">Recent Financial Transactions</CardTitle>
              <button className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                See more
                <HiOutlineArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-2 h-2 rounded-full ${categoryColors[transaction.category] || 'bg-gray-400'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{transaction.date}</p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">{transaction.category}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount}
                    </p>
                  </div>
                  <button className="ml-4 p-1 hover:bg-gray-100 rounded">
                    <HiChevronRight className="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Executive Dashboard for Head Pastor
  const isHeadPastor = hasRole('head_pastor');
  
  if (isHeadPastor) {
    // Sample data for head pastor dashboard
    const executiveStats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const monthIncome = incomeEntries
      .filter(entry => entry.date.startsWith(currentMonth))
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const monthExpenditure = expenditureEntries
      .filter(entry => entry.date.startsWith(currentMonth))
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    return {
      members: {
        total: 450,
        active: 380,
        newThisMonth: 12,
        growth: 2.5,
      },
      attendance: {
        totalThisMonth: 2840,
        averagePerService: 142,
        servicesThisMonth: 20,
        growth: 5.2,
      },
      finances: {
        income: monthIncome,
        expenditure: monthExpenditure,
        net: monthIncome - monthExpenditure,
        tithes: 12500.00,
      },
      organizations: {
        total: 11,
        activeLeaders: 16,
      },
    };
  }, [incomeEntries, expenditureEntries]);

  const recentActivity = useMemo(() => [
    {
      id: 1,
      type: 'financial',
      title: 'Income recorded',
      description: `GHC ${incomeEntries[0]?.amount.toFixed(2)} - ${incomeEntries[0]?.category}`,
      time: '2 hours ago',
      icon: HiPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      href: '/dashboard/record-income',
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
      type: 'financial',
      title: 'Tithe recorded',
      description: 'GHC 150.00 - Member tithe',
      time: '2 days ago',
      icon: HiReceiptRefund,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/dashboard/tithes',
    },
    {
      id: 5,
      type: 'expenditure',
      title: 'Expenditure recorded',
      description: `GHC ${expenditureEntries[0]?.amount.toFixed(2)} - ${expenditureEntries[0]?.category}`,
      time: '3 days ago',
      icon: HiMinus,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      href: '/dashboard/expenditure',
    },
  ], [incomeEntries, expenditureEntries]);

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
      title: 'Net Income',
      value: `GHC ${executiveStats.finances.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Income: GHC ${executiveStats.finances.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: executiveStats.finances.net >= 0 ? 'Surplus' : 'Deficit',
      trend: executiveStats.finances.net >= 0 ? 'up' : 'down',
      icon: executiveStats.finances.net >= 0 ? HiTrendingUp : HiTrendingDown,
      color: executiveStats.finances.net >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: executiveStats.finances.net >= 0 ? 'bg-green-100' : 'bg-red-100',
      href: '/dashboard/generate-report',
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Welcome, {user?.name || 'User'}!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Executive overview of parish operations and key metrics
        </p>
      </div>

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
        {/* Financial Overview */}
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
              <CardTitle className="text-base font-semibold text-gray-900">Financial Overview</CardTitle>
              <Link href="/dashboard/generate-report">
                <Button variant="outline" size="sm">
                  View Reports
                  <HiChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Total Income</p>
                  <p className="text-lg sm:text-xl font-semibold text-green-700 break-words">
                    GHC {executiveStats.finances.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <Link href="/dashboard/record-income" className="text-xs text-green-600 hover:text-green-700 mt-2 inline-block">
                    View Details →
                  </Link>
                </div>
                <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
                  <p className="text-xs text-gray-600 mb-1">Total Expenditure</p>
                  <p className="text-lg sm:text-xl font-semibold text-red-700 break-words">
                    GHC {executiveStats.finances.expenditure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <Link href="/dashboard/expenditure" className="text-xs text-red-600 hover:text-red-700 mt-2 inline-block">
                    View Details →
                  </Link>
                </div>
                <div className={`rounded-lg p-3 sm:p-4 border ${executiveStats.finances.net >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-xs text-gray-600 mb-1">Net Balance</p>
                  <p className={`text-lg sm:text-xl font-semibold ${executiveStats.finances.net >= 0 ? 'text-green-700' : 'text-red-700'} break-words`}>
                    GHC {executiveStats.finances.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xs mt-2 ${executiveStats.finances.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {executiveStats.finances.net >= 0 ? 'Surplus' : 'Deficit'}
                  </p>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Tithes</p>
                    <p className="text-xl font-semibold text-purple-700">
                      GHC {executiveStats.finances.tithes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Link href="/dashboard/tithes">
                    <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                      View Tithes
                    </Button>
                  </Link>
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
            {recentActivity.map((activity) => {
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
          Welcome to your dashboard
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
