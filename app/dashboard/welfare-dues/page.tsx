'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { HiPlus, HiOutlineUsers, HiExclamationCircle, HiOutlineBriefcase } from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, Form, Table, Select, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { apiRequest } from '@/lib/api';

interface Member {
  id: number;
  churchNumber: string;
  name: string;
}

// Backend welfare interface to match API response
interface BackendWelfare {
  id: number;
  member_id: number;
  year: number;
  month: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  member_name: string;
  member_parish_number: string;
}

interface WelfarePayment {
  id: string;
  memberId: number;
  memberName: string;
  year: number;
  month: number;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  method: 'cash' | 'mobile_money' | 'bank_transfer';
}

const MONTHLY_DUES_AMOUNT = 50;
const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];
const CURRENT_DATE = new Date();
const CURRENT_YEAR = CURRENT_DATE.getFullYear();
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1;
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, idx) => CURRENT_YEAR - 2 + idx).map((year) => ({
  value: year,
  label: `${year}`,
}));

// Members will be fetched from API

export default function WelfareDuesPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(CURRENT_MONTH);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Outstanding'>('all');
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [showMemberHistoryDrawer, setShowMemberHistoryDrawer] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<WelfarePayment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Convert backend welfare to frontend format
  const mapBackendWelfare = (backendWelfare: BackendWelfare): WelfarePayment => {
    return {
      id: backendWelfare.id.toString(),
      memberId: backendWelfare.member_id,
      memberName: backendWelfare.member_name,
      year: backendWelfare.year,
      month: backendWelfare.month,
      amount: backendWelfare.amount,
      paymentDate: backendWelfare.payment_date,
      method: backendWelfare.payment_method as 'cash' | 'mobile_money' | 'bank_transfer',
    };
  };

  // Fetch members from API
  const fetchMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await apiRequest('members', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.members && Array.isArray(response.data.members)) {
        const mappedMembers = response.data.members.map((member: any) => ({
          id: member.id,
          churchNumber: member.parish_number || `CH-${String(member.id).padStart(4, '0')}`,
          name: `${member.other_names || ''} ${member.surname || ''}`.trim(),
        }));
        setMembers(mappedMembers);
      } else if (response.error) {
        setError(response.error.message || 'Failed to fetch members');
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Network error occurred while fetching members');
    }
  }, []);

  // Fetch welfare payments from API
  const fetchWelfarePayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await apiRequest<{ welfares?: BackendWelfare[]; data?: BackendWelfare[]; status?: string }>('welfares', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const mappedWelfares = response.data.data.map(mapBackendWelfare);
        setPayments(mappedWelfares);
      } else if (response.error) {
        setError(response.error.message || 'Failed to fetch welfare payments');
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching welfare payments:', error);
      setError('Network error occurred while fetching welfare payments');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create welfare payment
  const handleRecordPayment = useCallback(
    async (values: {
      memberId: number;
      year: number;
      month: number;
      paymentDate: string;
      amount: number;
      method: string;
    }) => {
      try {
        setSubmitting(true);

        const welfarePayload = {
          welfares: {
            member_id: values.memberId,
            year: values.year,
            month: values.month,
            amount: Number(values.amount),
            payment_date: values.paymentDate,
            payment_method: values.method,
          }
        };

        console.log('Sending welfare payment payload:', welfarePayload);

        console.log('Sending welfare payment payload:', welfarePayload);

        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await apiRequest('welfares', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(welfarePayload),
        });

        console.log('Welfare payment response:', response);

        // Check if the response indicates success
        if (response.data && response.data.status === 'OK') {
          // Success case
          console.log('Welfare payment recorded successfully');
        } else if (response.error) {
          console.error('Server error details:', response.error);
          throw new Error(response.error.message || 'Failed to record welfare payment');
        } else {
          // Unexpected response format
          console.warn('Unexpected response format:', response);
          throw new Error('Unexpected response from server');
        }

        // Success - refresh the welfare payments
        await fetchWelfarePayments();

        // Close modal and reset form
        setShowPaymentDrawer(false);
        form.resetFields();

        // Show success message
        showToast('Welfare payment recorded successfully!', 'success');

        // Update selected period to the recorded payment's period
        setSelectedYear(values.year);
        setSelectedMonth(values.month);

      } catch (error) {
        console.error('Error recording welfare payment:', error);
        showToast(
          error instanceof Error ? error.message : 'Failed to record welfare payment',
          'error'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [form, showToast, fetchWelfarePayments]
  );

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch members first, then welfare payments
        await fetchMembers();
        await fetchWelfarePayments();
      } catch (error) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [fetchMembers, fetchWelfarePayments]);

  const monthlyMemberSummary = useMemo(() => {
    // Get all unique members from both the members list and welfare payments
    const allMemberIds = new Set([
      ...members.map(m => m.id),
      ...payments.map(p => p.memberId)
    ]);

    return Array.from(allMemberIds).map((memberId) => {
      // Try to find member in members list first
      let member = members.find(m => m.id === memberId);
      
      // If not found in members list, create from welfare payment data
      if (!member) {
        const memberPayment = payments.find(p => p.memberId === memberId);
        if (memberPayment) {
          member = {
            id: memberId,
            churchNumber: `CH-${String(memberId).padStart(4, '0')}`,
            name: memberPayment.memberName
          };
        } else {
          // Fallback if no data found
          member = {
            id: memberId,
            churchNumber: `CH-${String(memberId).padStart(4, '0')}`,
            name: `Member ${memberId}`
          };
        }
      }

      const paid = payments
        .filter(
          (payment) =>
            payment.memberId === memberId &&
            payment.year === selectedYear &&
            payment.month === selectedMonth
        )
        .reduce((sum, payment) => sum + payment.amount, 0);
      const outstanding = Math.max(MONTHLY_DUES_AMOUNT - paid, 0);
      return {
        ...member,
        paid,
        outstanding,
        status: outstanding > 0 ? 'Outstanding' : 'Paid',
      };
    });
  }, [payments, selectedMonth, selectedYear, members]);

  const outstandingMembers = monthlyMemberSummary.filter((member) => member.outstanding > 0);
  const filteredMonthlyMemberSummary = monthlyMemberSummary.filter((member) =>
    statusFilter === 'all' ? true : member.status === statusFilter
  );

  const monthlyTotalCollected = monthlyMemberSummary.reduce((sum, member) => sum + member.paid, 0);
  const monthlyExpectedTotal = members.length * MONTHLY_DUES_AMOUNT;
  const collectionRate = monthlyExpectedTotal > 0 ? (monthlyTotalCollected / monthlyExpectedTotal) * 100 : 0;



  const monthlyColumns: ColumnsType<(typeof monthlyMemberSummary)[number]> = [
    { title: 'Parish Number', dataIndex: 'churchNumber', key: 'churchNumber' },
    { title: 'Member Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Paid (GHC)',
      dataIndex: 'paid',
      key: 'paid',
      render: (value: number) => <span className="font-semibold">GHC {value.toFixed(2)}</span>,
    },
    {
      title: 'Outstanding (GHC)',
      dataIndex: 'outstanding',
      key: 'outstanding',
      render: (value: number) => (
        <span className={value > 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-600'}>
          GHC {value.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => (
        <Tag color={value === 'Paid' ? 'green' : 'red'}>{value}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedMember({
              id: record.id,
              churchNumber: record.churchNumber,
              name: record.name,
            });
            setShowMemberHistoryDrawer(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const selectedMemberContributions = useMemo(() => {
    if (!selectedMember) return [];
    return payments
      .filter((payment) => payment.memberId === selectedMember.id)
      .sort((a, b) => {
        const aDate = new Date(a.paymentDate).getTime();
        const bDate = new Date(b.paymentDate).getTime();
        return bDate - aDate;
      });
  }, [payments, selectedMember]);

  const memberContributionColumns: ColumnsType<WelfarePayment> = [
    { title: 'Date', dataIndex: 'paymentDate', key: 'paymentDate' },
    { title: 'Year', dataIndex: 'year', key: 'year' },
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (value: number) => MONTH_OPTIONS.find((month) => month.value === value)?.label ?? value,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => <span className="font-semibold">GHC {value.toFixed(2)}</span>,
    },
    { 
      title: 'Method', 
      dataIndex: 'method', 
      key: 'method',
      render: (value: string) => {
        const methodMap: Record<string, string> = {
          'cash': 'Cash',
          'mobile_money': 'Mobile Money',
          'bank_transfer': 'Bank Transfer',
        };
        return methodMap[value] || value;
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welfare/Dues Management</h1>
          <p className="text-gray-600 mt-1">
            Record monthly payments, track member history, view contribution reports, and identify outstanding dues.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              await fetchMembers();
              await fetchWelfarePayments();
            } catch (error) {
              setError('Failed to refresh data');
            } finally {
              setLoading(false);
            }
          }} variant="outline" disabled={loading}>
            Refresh
          </Button>
          {(hasPermission('record_income') || hasPermission('expenditure') || isSuperAdmin) && (
            <Button 
              onClick={() => {
                if (members.length === 0) {
                  showToast('Please wait for members to load before recording a payment', 'warning');
                  return;
                }
                setShowPaymentDrawer(true);
              }} 
              className="sm:w-auto w-full" 
              disabled={loading}
            >
              <HiPlus className="h-4 w-4 mr-1" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading data...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiExclamationCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load data</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                await fetchMembers();
                await fetchWelfarePayments();
              } catch (error) {
                setError('Failed to refresh data');
              } finally {
                setLoading(false);
              }
            }} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Content - only show when not loading and no error */}
      {!loading && !error && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Contribution Period</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                size="large"
                value={selectedYear}
                onChange={(value) => setSelectedYear(value)}
                options={YEAR_OPTIONS}
              />
              <Select
                size="large"
                value={selectedMonth}
                onChange={(value) => setSelectedMonth(value)}
                options={MONTH_OPTIONS}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Collected</p>
                  <p className="text-xl font-semibold">GHC {monthlyTotalCollected.toFixed(2)}</p>
                </div>
                <HiOutlineBriefcase className="h-6 w-6 text-blue-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Collection Rate</p>
                  <p className="text-xl font-semibold">{collectionRate.toFixed(1)}%</p>
                </div>
                <HiOutlineUsers className="h-6 w-6 text-purple-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outstanding Members</p>
                  <p className="text-xl font-semibold">{outstandingMembers.length}</p>
                </div>
                <HiExclamationCircle className="h-6 w-6 text-red-600" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Individual Monthly Contributions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-end">
                <Select
                  size="large"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Outstanding', label: 'Outstanding' },
                  ]}
                  style={{ width: 220 }}
                />
              </div>
              <Table
                columns={monthlyColumns}
                dataSource={filteredMonthlyMemberSummary}
                rowKey="id"
                pagination={{ pageSize: 8 }}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Drawer
        title="Record Monthly Welfare/Dues Payment"
        placement="right"
        open={showPaymentDrawer}
        onClose={() => {
          setShowPaymentDrawer(false);
          form.resetFields();
        }}
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 560}
        afterOpenChange={(open) => {
          if (open && members.length > 0) {
            // Reset form with updated initial values when drawer opens
            form.setFieldsValue({
              memberId: members[0].id,
              year: selectedYear,
              month: selectedMonth,
              paymentDate: new Date().toISOString().slice(0, 10),
              amount: MONTHLY_DUES_AMOUNT,
              method: 'cash',
            });
          }
        }}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleRecordPayment}
          initialValues={{
            memberId: members.length > 0 ? members[0].id : undefined,
            year: selectedYear,
            month: selectedMonth,
            paymentDate: new Date().toISOString().slice(0, 10),
            amount: MONTHLY_DUES_AMOUNT,
            method: 'cash',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              label="Member"
              name="memberId"
              rules={[{ required: true, message: 'Select member' }]}
            >
              <Select
                size="large"
                showSearch
                optionFilterProp="label"
                placeholder={members.length === 0 ? "Loading members..." : "Select a member"}
                loading={members.length === 0}
                disabled={members.length === 0}
                options={members.map((member) => ({
                  value: member.id,
                  label: `${member.name} (${member.churchNumber})`,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Year"
              name="year"
              rules={[{ required: true, message: 'Select year' }]}
            >
              <Select size="large" options={YEAR_OPTIONS} />
            </Form.Item>
            <Form.Item
              label="Month"
              name="month"
              rules={[{ required: true, message: 'Select month' }]}
            >
              <Select size="large" options={MONTH_OPTIONS} />
            </Form.Item>
            <Form.Item
              label="Payment Date"
              name="paymentDate"
              rules={[{ required: true, message: 'Select payment date' }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              label="Amount (GHC)"
              name="amount"
              rules={[{ required: true, message: 'Enter amount' }]}
            >
              <Input type="number" min="1" step="0.01" />
            </Form.Item>
            <Form.Item
              label="Payment Method"
              name="method"
              rules={[{ required: true, message: 'Select method' }]}
            >
              <Select
                size="large"
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'mobile_money', label: 'Mobile Money' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                ]}
              />
            </Form.Item>
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowPaymentDrawer(false);
                form.resetFields();
              }} 
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              <HiPlus className="h-4 w-4 mr-1" />
              {submitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </Form>
      </Drawer>

      <Drawer
        title={selectedMember ? `${selectedMember.name} - Contributions` : 'Member Contributions'}
        placement="right"
        open={showMemberHistoryDrawer}
        onClose={() => {
          setShowMemberHistoryDrawer(false);
          setSelectedMember(null);
        }}
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 700}
      >
        <Table
          columns={memberContributionColumns}
          dataSource={selectedMemberContributions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Drawer>
    </div>
  );
}
