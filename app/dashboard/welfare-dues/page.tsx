'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { HiPlus, HiOutlineUsers, HiExclamationCircle, HiOutlineBriefcase } from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Drawer, Form, Table, Select, Tag, Button as AntButton, Space, Modal, Divider, Checkbox } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { apiRequest } from '@/lib/api';
import { downloadMembersExcel, sortMembersForExport } from '@/lib/member-export';
import { TABLE_SCROLL, useDrawerWidth } from '@/lib/responsive';

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

const MONTHLY_DUES_AMOUNT = 20;
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

type MonthlyMemberRow = {
  id: number;
  churchNumber: string;
  name: string;
  paid: number;
  outstanding: number;
  status: 'Paid' | 'Outstanding';
};

type WelfareExportColumnKey = 'churchNumber' | 'name' | 'paid' | 'outstanding' | 'status';

const WELFARE_EXPORT_COLUMNS: { key: WelfareExportColumnKey; label: string }[] = [
  { key: 'churchNumber', label: 'Parish Number' },
  { key: 'name', label: 'Member Name' },
  { key: 'paid', label: 'Paid (GHC)' },
  { key: 'outstanding', label: 'Outstanding (GHC)' },
  { key: 'status', label: 'Status' },
];

const DEFAULT_WELFARE_EXPORT_COLUMNS: WelfareExportColumnKey[] = [
  'churchNumber',
  'name',
  'paid',
  'outstanding',
  'status',
];

const WELFARE_EXPORT_COLUMN_LABELS = Object.fromEntries(
  WELFARE_EXPORT_COLUMNS.map((col) => [col.key, col.label])
) as Record<WelfareExportColumnKey, string>;

const WELFARE_EXPORT_SORT_OPTIONS: { value: WelfareExportColumnKey | 'none'; label: string }[] = [
  { value: 'none', label: 'Original order (no sorting)' },
  ...WELFARE_EXPORT_COLUMNS.map((col) => ({ value: col.key, label: col.label })),
];

function getWelfareExportCellValue(row: MonthlyMemberRow, key: WelfareExportColumnKey): string {
  switch (key) {
    case 'churchNumber':
      return row.churchNumber;
    case 'name':
      return row.name;
    case 'paid':
      return row.paid.toFixed(2);
    case 'outstanding':
      return row.outstanding.toFixed(2);
    case 'status':
      return row.status;
    default:
      return '';
  }
}

function buildMonthlyMemberSummary(
  members: Member[],
  payments: WelfarePayment[],
  year: number,
  month: number
): MonthlyMemberRow[] {
  const allMemberIds = new Set([...members.map((m) => m.id), ...payments.map((p) => p.memberId)]);

  return Array.from(allMemberIds).map((memberId) => {
    let member = members.find((m) => m.id === memberId);

    if (!member) {
      const memberPayment = payments.find((p) => p.memberId === memberId);
      member = {
        id: memberId,
        churchNumber: `CH-${String(memberId).padStart(4, '0')}`,
        name: memberPayment?.memberName ?? `Member ${memberId}`,
      };
    }

    const paid = payments
      .filter((payment) => payment.memberId === memberId && payment.year === year && payment.month === month)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const outstanding = Math.max(MONTHLY_DUES_AMOUNT - paid, 0);

    return {
      ...member,
      paid,
      outstanding,
      status: outstanding > 0 ? 'Outstanding' : 'Paid',
    };
  });
}

function normalizePaymentDate(value: string): string {
  if (!value) return value;
  const datePart = value.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return value;
}

function normalizePaymentMethod(value: string): WelfarePayment['method'] {
  const key = value.trim().toLowerCase().replace(/\s+/g, '_');
  const map: Record<string, WelfarePayment['method']> = {
    cash: 'cash',
    mobile_money: 'mobile_money',
    bank_transfer: 'bank_transfer',
  };
  return map[key] ?? 'cash';
}

function formatWelfareFields(values: {
  memberId: number;
  year: number;
  month: number;
  paymentDate: string;
  amount: number;
  method: string;
}) {
  return {
    member_id: Number(values.memberId),
    year: Number(values.year),
    month: Number(values.month),
    amount: Number(values.amount),
    payment_date: normalizePaymentDate(values.paymentDate),
    payment_method: normalizePaymentMethod(values.method),
  };
}

export default function WelfareDuesPage() {
  const drawerWidthMd = useDrawerWidth(560);
  const drawerWidthLg = useDrawerWidth(700);
  const { hasPermission, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState<number>(CURRENT_MONTH);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Outstanding'>('all');
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [showMemberHistoryDrawer, setShowMemberHistoryDrawer] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingPayment, setEditingPayment] = useState<WelfarePayment | null>(null);
  const [payments, setPayments] = useState<WelfarePayment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState<WelfareExportColumnKey[]>(DEFAULT_WELFARE_EXPORT_COLUMNS);
  const [exportYear, setExportYear] = useState<number>(CURRENT_YEAR);
  const [exportMonth, setExportMonth] = useState<number>(CURRENT_MONTH);
  const [exportStatusFilter, setExportStatusFilter] = useState<'all' | 'Paid' | 'Outstanding'>('all');
  const [exportSortBy, setExportSortBy] = useState<WelfareExportColumnKey | 'none'>('name');
  const [exportSortDirection, setExportSortDirection] = useState<'asc' | 'desc'>('asc');
  const [exporting, setExporting] = useState(false);

  const canManageWelfare =
    hasPermission('record_income') || hasPermission('expenditure') || isSuperAdmin;

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
      method: normalizePaymentMethod(backendWelfare.payment_method),
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

  const getPaymentsForMemberPeriod = useCallback(
    (memberId: number, year: number, month: number) =>
      payments.filter(
        (payment) =>
          payment.memberId === memberId && payment.year === year && payment.month === month
      ),
    [payments]
  );

  const buildWelfarePayload = (values: {
    memberId: number;
    year: number;
    month: number;
    paymentDate: string;
    amount: number;
    method: string;
  }) => ({
    welfares: formatWelfareFields(values),
  });

  const buildWelfareUpdatePayload = (
    values: {
      memberId: number;
      year: number;
      month: number;
      paymentDate: string;
      amount: number;
      method: string;
    },
    welfareId: string | number
  ) => ({
    welfares: {
      id: Number(welfareId),
      ...formatWelfareFields(values),
    },
  });

  const getWelfareErrorMessage = (
    response: { error?: { message?: string; details?: Record<string, unknown> }; status: number; data?: { status?: string; message?: string; details?: Record<string, unknown> } },
    fallback: string
  ) => {
    const details = response.error?.details ?? response.data?.details;
    if (details && typeof details === 'object') {
      const messages = Object.entries(details)
        .flatMap(([field, value]) => {
          if (Array.isArray(value)) {
            return value
              .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
              .map((item) => `${field}: ${item}`);
          }
          if (typeof value === 'string' && value.trim()) return [`${field}: ${value}`];
          return [];
        });
      if (messages.length > 0) return messages.join(', ');
    }

    const message = response.error?.message ?? response.data?.message;
    if (message && message !== 'An error occurred') return message;

    if (response.status === 401) return 'Authentication failed. Please log in again.';
    if (response.status === 403) return 'You do not have permission to perform this action.';
    if (response.status === 404) return 'Welfare payment not found.';
    if (response.status === 422) return 'Validation failed. Please check the form fields.';

    return fallback;
  };

  const isWelfareMutationSuccess = (response: { error?: unknown; status: number; data?: { status?: string } }) => {
    if (response.error) return false;
    if (response.status >= 200 && response.status < 300) {
      return response.data?.status !== 'ERROR';
    }
    return false;
  };

  const openRecordPaymentDrawer = useCallback(() => {
    if (members.length === 0) {
      showToast('Please wait for members to load before recording a payment', 'warning');
      return;
    }
    setEditingPayment(null);
    setShowPaymentDrawer(true);
  }, [members.length, showToast]);

  const openEditPaymentDrawer = useCallback(
    (payment: WelfarePayment) => {
      setEditingPayment(payment);
      setShowPaymentDrawer(true);
      form.setFieldsValue({
        memberId: payment.memberId,
        year: payment.year,
        month: payment.month,
        paymentDate: normalizePaymentDate(payment.paymentDate),
        amount: payment.amount,
        method: payment.method,
      });
    },
    [form]
  );

  const closePaymentDrawer = useCallback(() => {
    setShowPaymentDrawer(false);
    setEditingPayment(null);
    form.resetFields();
  }, [form]);

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

        const welfarePayload = buildWelfarePayload(values);

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

        if (isWelfareMutationSuccess(response)) {
          // Success case
        } else if (response.error) {
          throw new Error(getWelfareErrorMessage(response, 'Failed to record welfare payment'));
        } else {
          throw new Error('Unexpected response from server');
        }

        await fetchWelfarePayments();
        closePaymentDrawer();
        showToast('Welfare payment recorded successfully!', 'success');
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
    [closePaymentDrawer, showToast, fetchWelfarePayments]
  );

  const handleUpdatePayment = useCallback(
    async (values: {
      memberId: number;
      year: number;
      month: number;
      paymentDate: string;
      amount: number;
      method: string;
    }) => {
      if (!editingPayment) return;

      try {
        setSubmitting(true);

        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await apiRequest(`welfares/${editingPayment.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildWelfareUpdatePayload(values, editingPayment.id)),
        });

        if (!isWelfareMutationSuccess(response)) {
          throw new Error(getWelfareErrorMessage(response, 'Failed to update welfare payment'));
        }

        await fetchWelfarePayments();
        closePaymentDrawer();
        showToast('Welfare payment updated successfully!', 'success');
        setSelectedYear(values.year);
        setSelectedMonth(values.month);
      } catch (error) {
        console.error('Error updating welfare payment:', error);
        showToast(
          error instanceof Error ? error.message : 'Failed to update welfare payment',
          'error'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [editingPayment, closePaymentDrawer, showToast, fetchWelfarePayments]
  );

  const handleDeletePayment = useCallback(
    async (payment: WelfarePayment, memberName?: string) => {
      const label = memberName || payment.memberName || 'this payment';
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm(
          `Are you sure you want to delete the welfare payment for ${label}? This cannot be undone.`
        );
        if (!confirmed) return;
      }

      try {
        setDeletingPaymentId(payment.id);

        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await apiRequest(`welfares/${payment.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isWelfareMutationSuccess(response)) {
          throw new Error(getWelfareErrorMessage(response, 'Failed to delete welfare payment'));
        }

        await fetchWelfarePayments();
        showToast('Welfare payment deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting welfare payment:', error);
        showToast(
          error instanceof Error ? error.message : 'Failed to delete welfare payment',
          'error'
        );
      } finally {
        setDeletingPaymentId(null);
      }
    },
    [showToast, fetchWelfarePayments]
  );

  const handleEditMemberPeriodPayment = useCallback(
    (member: { id: number; name: string }) => {
      const periodPayments = getPaymentsForMemberPeriod(member.id, selectedYear, selectedMonth);

      if (periodPayments.length === 0) {
        setEditingPayment(null);
        setShowPaymentDrawer(true);
        form.setFieldsValue({
          memberId: member.id,
          year: selectedYear,
          month: selectedMonth,
          paymentDate: new Date().toISOString().slice(0, 10),
          amount: MONTHLY_DUES_AMOUNT,
          method: 'cash',
        });
        showToast('No payment found for this period. You can record one now.', 'warning');
        return;
      }

      if (periodPayments.length > 1) {
        setSelectedMember({
          id: member.id,
          churchNumber:
            members.find((item) => item.id === member.id)?.churchNumber ||
            `CH-${String(member.id).padStart(4, '0')}`,
          name: member.name,
        });
        setShowMemberHistoryDrawer(true);
        showToast('Multiple payments found for this period. Edit the specific payment below.', 'warning');
        return;
      }

      openEditPaymentDrawer(periodPayments[0]);
    },
    [
      form,
      getPaymentsForMemberPeriod,
      members,
      openEditPaymentDrawer,
      selectedMonth,
      selectedYear,
      showToast,
    ]
  );

  const handleDeleteMemberPeriodPayment = useCallback(
    async (member: { id: number; name: string }) => {
      const periodPayments = getPaymentsForMemberPeriod(member.id, selectedYear, selectedMonth);

      if (periodPayments.length === 0) {
        showToast('No payment found for this member in the selected period.', 'warning');
        return;
      }

      if (periodPayments.length > 1) {
        setSelectedMember({
          id: member.id,
          churchNumber:
            members.find((item) => item.id === member.id)?.churchNumber ||
            `CH-${String(member.id).padStart(4, '0')}`,
          name: member.name,
        });
        setShowMemberHistoryDrawer(true);
        showToast('Multiple payments found for this period. Delete the specific payment below.', 'warning');
        return;
      }

      await handleDeletePayment(periodPayments[0], member.name);
    },
    [
      getPaymentsForMemberPeriod,
      handleDeletePayment,
      members,
      selectedMonth,
      selectedYear,
      showToast,
    ]
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

  const monthlyMemberSummary = useMemo(
    () => buildMonthlyMemberSummary(members, payments, selectedYear, selectedMonth),
    [payments, selectedMonth, selectedYear, members]
  );

  const getWelfareRowsForExport = useCallback(() => {
    const summary = buildMonthlyMemberSummary(members, payments, exportYear, exportMonth);
    return summary.filter((member) =>
      exportStatusFilter === 'all' ? true : member.status === exportStatusFilter
    );
  }, [exportMonth, exportStatusFilter, exportYear, members, payments]);

  const handleExportWelfare = useCallback(async () => {
    if (exportColumns.length === 0) {
      showToast('Select at least one column to export.', 'error');
      return;
    }

    let rowsToExport = getWelfareRowsForExport();
    if (rowsToExport.length === 0) {
      showToast('No records match the selected filters.', 'error');
      return;
    }

    if (exportSortBy !== 'none') {
      rowsToExport = sortMembersForExport(
        rowsToExport,
        (row) => getWelfareExportCellValue(row, exportSortBy),
        exportSortDirection
      );
    }

    const headers = exportColumns.map((key) => WELFARE_EXPORT_COLUMN_LABELS[key]);
    const rows = rowsToExport.map((row) =>
      exportColumns.map((key) => getWelfareExportCellValue(row, key))
    );

    const monthLabel = MONTH_OPTIONS.find((m) => m.value === exportMonth)?.label ?? `${exportMonth}`;
    const statusLabel =
      exportStatusFilter === 'all' ? 'All statuses' : exportStatusFilter;
    const sortLabel =
      exportSortBy === 'none'
        ? 'original order'
        : `${WELFARE_EXPORT_COLUMN_LABELS[exportSortBy]} (${exportSortDirection === 'asc' ? 'A → Z' : 'Z → A'})`;

    try {
      setExporting(true);
      await downloadMembersExcel(
        `welfare-export-${exportYear}-${String(exportMonth).padStart(2, '0')}-${dayjs().format('YYYYMMDD-HHmm')}.xlsx`,
        headers,
        rows,
        {
          title: 'St. Joseph Parish — Welfare/Dues Report',
          subtitle: `${monthLabel} ${exportYear} · ${statusLabel} · Exported ${dayjs().format('DD MMMM YYYY, h:mm A')} · ${rowsToExport.length} member(s) · Sorted by ${sortLabel}`,
          sheetName: 'Welfare Dues',
        }
      );
      showToast(
        `Exported ${rowsToExport.length} record${rowsToExport.length === 1 ? '' : 's'} to Excel.`,
        'success'
      );
      setShowExportModal(false);
    } catch {
      showToast('Failed to export welfare data. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  }, [
    exportColumns,
    exportMonth,
    exportSortBy,
    exportSortDirection,
    exportStatusFilter,
    exportYear,
    getWelfareRowsForExport,
    showToast,
  ]);

  const openExportModal = useCallback(() => {
    setExportColumns(DEFAULT_WELFARE_EXPORT_COLUMNS);
    setExportYear(selectedYear);
    setExportMonth(selectedMonth);
    setExportStatusFilter(statusFilter);
    setExportSortBy('name');
    setExportSortDirection('asc');
    setShowExportModal(true);
  }, [selectedMonth, selectedYear, statusFilter]);

  const exportPreviewCount = useMemo(() => getWelfareRowsForExport().length, [getWelfareRowsForExport]);

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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <AntButton
            type="text"
            icon={<EyeOutlined />}
            title="View"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMember({
                id: record.id,
                churchNumber: record.churchNumber,
                name: record.name,
              });
              setShowMemberHistoryDrawer(true);
            }}
          />
          <AntButton
            type="text"
            icon={<EditOutlined />}
            title="Edit"
            disabled={!canManageWelfare}
            onClick={(e) => {
              e.stopPropagation();
              if (!canManageWelfare) return;
              handleEditMemberPeriodPayment({
                id: record.id,
                name: record.name,
              });
            }}
          />
          <AntButton
            type="text"
            icon={<DeleteOutlined />}
            danger
            title="Delete"
            disabled={!canManageWelfare || deletingPaymentId !== null}
            loading={getPaymentsForMemberPeriod(record.id, selectedYear, selectedMonth).some(
              (payment) => payment.id === deletingPaymentId
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!canManageWelfare) return;
              void handleDeleteMemberPeriodPayment({
                id: record.id,
                name: record.name,
              });
            }}
          />
        </Space>
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
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <AntButton
            type="text"
            icon={<EditOutlined />}
            title="Edit"
            disabled={!canManageWelfare}
            onClick={(e) => {
              e.stopPropagation();
              if (!canManageWelfare) return;
              openEditPaymentDrawer(record);
            }}
          />
          <AntButton
            type="text"
            icon={<DeleteOutlined />}
            danger
            title="Delete"
            disabled={!canManageWelfare || (deletingPaymentId !== null && deletingPaymentId !== record.id)}
            loading={deletingPaymentId === record.id}
            onClick={(e) => {
              e.stopPropagation();
              if (!canManageWelfare) return;
              void handleDeletePayment(record, selectedMember?.name);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welfare/Dues Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Record monthly payments, track member history, view contribution reports, and identify outstanding dues.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
          }} variant="outline" disabled={loading} className="w-full sm:w-auto">
            Refresh
          </Button>
          {(hasPermission('record_income') || hasPermission('expenditure') || isSuperAdmin) && (
            <Button 
              onClick={openRecordPaymentDrawer}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Select
                  size="large"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Outstanding', label: 'Outstanding' },
                  ]}
                  className="w-full sm:w-[220px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={openExportModal}
                  disabled={members.length === 0}
                >
                  <DownloadOutlined className="mr-1" />
                  Export
                </Button>
              </div>
              <Table
                scroll={TABLE_SCROLL}
                columns={monthlyColumns}
                dataSource={filteredMonthlyMemberSummary}
                rowKey="id"
                pagination={{ pageSize: 8, responsive: true }}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Drawer
        title={editingPayment ? 'Edit Welfare/Dues Payment' : 'Record Monthly Welfare/Dues Payment'}
        placement="right"
        open={showPaymentDrawer}
        onClose={closePaymentDrawer}
        width={drawerWidthMd}
        afterOpenChange={(open) => {
          if (open && !editingPayment && members.length > 0) {
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
          onFinish={editingPayment ? handleUpdatePayment : handleRecordPayment}
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
              onClick={closePaymentDrawer}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              <HiPlus className="h-4 w-4 mr-1" />
              {submitting
                ? editingPayment
                  ? 'Updating...'
                  : 'Recording...'
                : editingPayment
                  ? 'Update Payment'
                  : 'Record Payment'}
            </Button>
          </div>
        </Form>
      </Drawer>

      <Modal
        title="Export Welfare/Dues"
        open={showExportModal}
        onCancel={() => setShowExportModal(false)}
        width={640}
        footer={[
          <AntButton key="cancel" onClick={() => setShowExportModal(false)}>
            Cancel
          </AntButton>,
          <AntButton
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportWelfare}
            loading={exporting}
            disabled={exportColumns.length === 0 || exportPreviewCount === 0 || exporting}
          >
            Export Excel ({exportPreviewCount})
          </AntButton>,
        ]}
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">Filters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Year</label>
                <Select
                  className="w-full"
                  value={exportYear}
                  onChange={setExportYear}
                  options={YEAR_OPTIONS}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Month</label>
                <Select
                  className="w-full"
                  value={exportMonth}
                  onChange={setExportMonth}
                  options={MONTH_OPTIONS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-600 mb-1 block">Payment status</label>
                <Select
                  className="w-full"
                  value={exportStatusFilter}
                  onChange={setExportStatusFilter}
                  options={[
                    { value: 'all', label: 'All statuses' },
                    { value: 'Paid', label: 'Paid only' },
                    { value: 'Outstanding', label: 'Outstanding only' },
                  ]}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {exportPreviewCount} member{exportPreviewCount === 1 ? '' : 's'} will be exported.
            </p>
          </div>

          <Divider className="!my-0" />

          <div>
            <p className="text-sm font-medium text-gray-900 mb-3">Sort order</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Sort by</label>
                <Select
                  className="w-full"
                  value={exportSortBy}
                  onChange={setExportSortBy}
                  options={WELFARE_EXPORT_SORT_OPTIONS}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Order</label>
                <Select
                  className="w-full"
                  value={exportSortDirection}
                  onChange={setExportSortDirection}
                  disabled={exportSortBy === 'none'}
                  options={[
                    { value: 'asc', label: 'A → Z (ascending)' },
                    { value: 'desc', label: 'Z → A (descending)' },
                  ]}
                />
              </div>
            </div>
          </div>

          <Divider className="!my-0" />

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <p className="text-sm font-medium text-gray-900">Columns to include</p>
              <Space size="small">
                <AntButton
                  type="link"
                  size="small"
                  className="!px-0"
                  onClick={() => setExportColumns(WELFARE_EXPORT_COLUMNS.map((col) => col.key))}
                >
                  Select all
                </AntButton>
                <AntButton
                  type="link"
                  size="small"
                  className="!px-0"
                  onClick={() => setExportColumns([...DEFAULT_WELFARE_EXPORT_COLUMNS])}
                >
                  Reset defaults
                </AntButton>
              </Space>
            </div>
            <Checkbox.Group
              className="w-full"
              value={exportColumns}
              onChange={(values) => setExportColumns(values as WelfareExportColumnKey[])}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WELFARE_EXPORT_COLUMNS.map((col) => (
                  <Checkbox key={col.key} value={col.key}>
                    {col.label}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </div>
        </div>
      </Modal>

      <Drawer
        title={selectedMember ? `${selectedMember.name} - Contributions` : 'Member Contributions'}
        placement="right"
        open={showMemberHistoryDrawer}
        onClose={() => {
          setShowMemberHistoryDrawer(false);
          setSelectedMember(null);
        }}
        width={drawerWidthLg}
      >
        <Table
          scroll={TABLE_SCROLL}
          columns={memberContributionColumns}
          dataSource={selectedMemberContributions}
          rowKey="id"
          pagination={{ pageSize: 10, responsive: true }}
        />
      </Drawer>
    </div>
  );
}
