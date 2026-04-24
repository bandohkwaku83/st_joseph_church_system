'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { Tabs, Table, DatePicker, Select, Space, Tag, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { HiOutlineDownload } from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { apiRequest, getApiBase } from '@/lib/api';

const MONTHLY_DUES_GHC = 50;

interface WelfarePaymentRow {
  id: string;
  memberId: number;
  memberName: string;
  year: number;
  month: number;
  amount: number;
  paymentDate: string;
  method: string;
}

interface Member {
  id: number;
  churchNumber: string;
  name: string;
}

interface BackendWelfare {
  id: number;
  month: number;
  year: number;
  amount: number;
  member_id: number;
  payment_date: string;
  payment_method: string;
  member_name: string;
  member_parish_number: string;
}

interface BackendMember {
  id: number;
  other_names: string;
  surname: string;
  parish_number: string;
}

interface BackendAttendance {
  id: number;
  date: string;
  men: number;
  women: number;
  children: number;
  total: number;
  created_at: string;
}

/** Demo ledger — same idea as Welfare/Dues (monthly GHC 50 target per member) */
const FALLBACK_WELFARE_PAYMENTS: WelfarePaymentRow[] = [
  { id: '1', memberId: 1, memberName: 'Kwame Asante', year: 2026, month: 4, amount: 50, paymentDate: '2026-04-14', method: 'Cash' },
  { id: '2', memberId: 2, memberName: 'Ama Mensah', year: 2026, month: 4, amount: 50, paymentDate: '2026-04-13', method: 'Mobile Money' },
  { id: '3', memberId: 4, memberName: 'Akosua Adjei', year: 2026, month: 4, amount: 25, paymentDate: '2026-04-10', method: 'Bank Transfer' },
  { id: '4', memberId: 5, memberName: 'Efua Boateng', year: 2026, month: 4, amount: 50, paymentDate: '2026-04-08', method: 'Cash' },
  { id: '5', memberId: 6, memberName: 'Yaw Appiah', year: 2026, month: 3, amount: 50, paymentDate: '2026-03-28', method: 'Mobile Money' },
  { id: '6', memberId: 1, memberName: 'Kwame Asante', year: 2026, month: 3, amount: 50, paymentDate: '2026-03-25', method: 'Cash' },
  { id: '7', memberId: 2, memberName: 'Ama Mensah', year: 2026, month: 3, amount: 50, paymentDate: '2026-03-24', method: 'Cash' },
  { id: '8', memberId: 3, memberName: 'Kofi Osei', year: 2026, month: 3, amount: 50, paymentDate: '2026-03-22', method: 'Bank Transfer' },
  { id: '9', memberId: 4, memberName: 'Akosua Adjei', year: 2026, month: 3, amount: 50, paymentDate: '2026-03-20', method: 'Cash' },
  { id: '10', memberId: 5, memberName: 'Efua Boateng', year: 2026, month: 3, amount: 50, paymentDate: '2026-03-18', method: 'Cash' },
  { id: '11', memberId: 6, memberName: 'Yaw Appiah', year: 2026, month: 3, amount: 40, paymentDate: '2026-03-15', method: 'Cash' },
  { id: '12', memberId: 3, memberName: 'Kofi Osei', year: 2026, month: 2, amount: 50, paymentDate: '2026-02-20', method: 'Cash' },
  { id: '13', memberId: 1, memberName: 'Kwame Asante', year: 2026, month: 2, amount: 50, paymentDate: '2026-02-18', method: 'Mobile Money' },
  { id: '14', memberId: 2, memberName: 'Ama Mensah', year: 2026, month: 2, amount: 50, paymentDate: '2026-02-12', method: 'Cash' },
  { id: '15', memberId: 4, memberName: 'Akosua Adjei', year: 2026, month: 2, amount: 50, paymentDate: '2026-02-10', method: 'Bank Transfer' },
  { id: '16', memberId: 5, memberName: 'Efua Boateng', year: 2026, month: 2, amount: 50, paymentDate: '2026-02-08', method: 'Cash' },
  { id: '17', memberId: 6, memberName: 'Yaw Appiah', year: 2026, month: 2, amount: 50, paymentDate: '2026-02-05', method: 'Cash' },
  { id: '18', memberId: 1, memberName: 'Kwame Asante', year: 2026, month: 1, amount: 50, paymentDate: '2026-01-22', method: 'Cash' },
  { id: '19', memberId: 2, memberName: 'Ama Mensah', year: 2026, month: 1, amount: 50, paymentDate: '2026-01-20', method: 'Cash' },
  { id: '20', memberId: 3, memberName: 'Kofi Osei', year: 2026, month: 1, amount: 45, paymentDate: '2026-01-15', method: 'Mobile Money' },
];

/** Demo attendance aggregates (totals across services) — used for period & comparison reports */
const MONTHLY_ATTENDANCE_2026: { year: number; month: number; total: number }[] = [
  { year: 2026, month: 1, total: 780 },
  { year: 2026, month: 2, total: 805 },
  { year: 2026, month: 3, total: 830 },
  { year: 2026, month: 4, total: 810 },
  { year: 2026, month: 5, total: 785 },
];

function monthKey(y: number, m: number) {
  return y * 12 + m;
}

function enumerateMonths(fromY: number, fromM: number, toY: number, toM: number): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  let y = fromY;
  let m = fromM;
  const end = monthKey(toY, toM);
  while (monthKey(y, m) <= end) {
    out.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const bom = '\uFEFF';
  const esc = (c: string | number) => `"${String(c).replace(/"/g, '""')}"`;
  const content = rows.map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pctChange(prev: number, curr: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function monthName(m: number) {
  return dayjs().month(m - 1).format('MMMM');
}

export default function GenerateReportPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // API data state
  const [welfares, setWelfares] = useState<BackendWelfare[]>([]);
  const [members, setMembers] = useState<BackendMember[]>([]);
  const [attendances, setAttendances] = useState<BackendAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Report state
  const [welfareFrom, setWelfareFrom] = useState<Dayjs>(() => dayjs('2026-01-01'));
  const [welfareTo, setWelfareTo] = useState<Dayjs>(() => dayjs('2026-04-01'));

  // Fetch welfares from API
  const fetchWelfares = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found, skipping welfares fetch');
        return;
      }

      const response = await apiRequest<{ data: BackendWelfare[] }>('welfares', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setWelfares(response.data.data);
      } else if (response.error) {
        console.error('Error fetching welfares:', response.error.message);
        setError(`Failed to load welfares: ${response.error.message}`);
      }
    } catch (error) {
      console.error('Error fetching welfares:', error);
      setError('Network error occurred while fetching welfares');
    }
  }, []);

  // Fetch attendances from API
  const fetchAttendances = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found, skipping attendances fetch');
        return;
      }

      const response = await apiRequest<{ attendances: BackendAttendance[] }>('attendances', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.attendances && Array.isArray(response.data.attendances)) {
        setAttendances(response.data.attendances);
      } else if (response.error) {
        console.error('Error fetching attendances:', response.error.message);
        // Don't set error for attendances since it might be a permission issue
        console.warn('Attendances data not available, using fallback data');
      }
    } catch (error) {
      console.error('Error fetching attendances:', error);
      console.warn('Attendances data not available, using fallback data');
    }
  }, []);
  const fetchMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found, skipping members fetch');
        return;
      }

      const response = await apiRequest<{ members: BackendMember[] }>('members', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.members && Array.isArray(response.data.members)) {
        setMembers(response.data.members);
      } else if (response.error) {
        console.error('Error fetching members:', response.error.message);
        // Don't set error for members since it might be a permission issue
        console.warn('Members data not available, using welfare data only');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      console.warn('Members data not available, using welfare data only');
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchWelfares(), fetchMembers(), fetchAttendances()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchWelfares, fetchMembers, fetchAttendances]);

  // Convert API data to report format
  const welfarePayments = useMemo(() => {
    if (welfares.length > 0) {
      return welfares.map((welfare): WelfarePaymentRow => ({
        id: welfare.id.toString(),
        memberId: welfare.member_id,
        memberName: welfare.member_name,
        year: welfare.year,
        month: welfare.month,
        amount: parseFloat(welfare.amount.toString()),
        paymentDate: welfare.payment_date,
        method: welfare.payment_method,
      }));
    }
    
    // Fallback to demo data if API not available
    return FALLBACK_WELFARE_PAYMENTS;
  }, [welfares]);

  // Convert members data to roster format
  const roster = useMemo((): Member[] => {
    if (members.length > 0) {
      return members.map((member): Member => ({
        id: member.id,
        churchNumber: member.parish_number || `CH-${member.id.toString().padStart(4, '0')}`,
        name: `${member.other_names} ${member.surname}`.trim() || 'Unknown Member',
      }));
    }
    
    // Fallback roster if members API not available
    return [
      { id: 1, churchNumber: 'CH-0001', name: 'Kwame Asante' },
      { id: 2, churchNumber: 'CH-0002', name: 'Ama Mensah' },
      { id: 3, churchNumber: 'CH-0003', name: 'Kofi Osei' },
      { id: 4, churchNumber: 'CH-0004', name: 'Akosua Adjei' },
      { id: 5, churchNumber: 'CH-0005', name: 'Efua Boateng' },
      { id: 6, churchNumber: 'CH-0006', name: 'Yaw Appiah' },
    ];
  }, [members]);

  const welfareReport = useMemo(() => {
    const a = welfareFrom.startOf('month');
    const b = welfareTo.startOf('month');
    const [start, end] = a.isAfter(b) ? [b, a] : [a, b];
    const fromY = start.year();
    const fromM = start.month() + 1;
    const toY = end.year();
    const toM = end.month() + 1;
    const months = enumerateMonths(fromY, fromM, toY, toM);
    const monthCount = months.length;
    const expectedPerMember = MONTHLY_DUES_GHC * monthCount;
    const expectedTotal = roster.length * expectedPerMember;

    const inRange = (p: WelfarePaymentRow) =>
      months.some((mo) => mo.year === p.year && mo.month === p.month);

    const filtered = welfarePayments.filter(inRange);
    const totalCollected = filtered.reduce((s, p) => s + p.amount, 0);

    const byMember = roster.map((mem) => {
      const paid = filtered.filter((p) => p.memberId === mem.id).reduce((s, p) => s + p.amount, 0);
      const outstanding = Math.max(0, expectedPerMember - paid);
      return {
        ...mem,
        paid,
        outstanding,
        status: outstanding > 0 ? ('Outstanding' as const) : ('Paid' as const),
      };
    });

    const outstandingOnly = byMember.filter((r) => r.outstanding > 0);
    const breakdownByMonth = months.map((mo) => {
      const mTotal = filtered.filter((p) => p.year === mo.year && p.month === mo.month).reduce((s, p) => s + p.amount, 0);
      return {
        key: `${mo.year}-${mo.month}`,
        label: `${monthName(mo.month)} ${mo.year}`,
        collected: mTotal,
        expected: roster.length * MONTHLY_DUES_GHC,
      };
    });

    return {
      months,
      monthCount,
      expectedTotal,
      totalCollected,
      outstandingTotal: Math.max(0, expectedTotal - totalCollected),
      collectionPct: expectedTotal > 0 ? (totalCollected / expectedTotal) * 100 : 0,
      byMember,
      outstandingOnly,
      breakdownByMonth,
      paymentRows: filtered.sort(
        (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      ),
    };
  }, [welfarePayments, welfareFrom, welfareTo, roster]);

  const exportWelfareCsv = useCallback(() => {
    const header = ['Parish Number', 'Member Name', 'Paid (GHC)', 'Outstanding (GHC)', 'Status'];
    const rows: (string | number)[][] = [
      header,
      ...welfareReport.byMember.map((r) => [r.churchNumber, r.name, r.paid.toFixed(2), r.outstanding.toFixed(2), r.status]),
      [],
      ['Period', `${welfareFrom.format('MMM YYYY')} – ${welfareTo.format('MMM YYYY')}`],
      ['Months in range', welfareReport.monthCount],
      ['Total collected (GHC)', welfareReport.totalCollected.toFixed(2)],
      ['Total expected (GHC)', welfareReport.expectedTotal.toFixed(2)],
      ['Outstanding (GHC)', welfareReport.outstandingTotal.toFixed(2)],
      ['Collection %', welfareReport.collectionPct.toFixed(1)],
    ];
    downloadCsv(`welfare-dues-report-${welfareFrom.format('YYYYMM')}-${welfareTo.format('YYYYMM')}.csv`, rows);
  }, [welfareReport, welfareFrom, welfareTo]);

  const welfareMemberColumns: ColumnsType<(typeof welfareReport)['byMember'][number]> = [
    { title: 'Parish number', dataIndex: 'churchNumber', key: 'churchNumber' },
    { title: 'Member', dataIndex: 'name', key: 'name' },
    {
      title: 'Paid (GHC)',
      dataIndex: 'paid',
      key: 'paid',
      render: (v: number) => <span className="font-medium">GHC {v.toFixed(2)}</span>,
    },
    {
      title: 'Outstanding (GHC)',
      dataIndex: 'outstanding',
      key: 'outstanding',
      render: (v: number) => (
        <span className={v > 0 ? 'font-medium text-red-600' : 'text-green-600'}>GHC {v.toFixed(2)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={s === 'Paid' ? 'green' : 'red'}>{s}</Tag>,
    },
  ];

  const welfarePaymentColumns: ColumnsType<WelfarePaymentRow> = [
    { title: 'Date', dataIndex: 'paymentDate', key: 'paymentDate' },
    { title: 'Member', dataIndex: 'memberName', key: 'memberName' },
    {
      title: 'Period',
      key: 'period',
      render: (_, r) => `${monthName(r.month)} ${r.year}`,
    },
    {
      title: 'Amount (GHC)',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <span className="font-medium">GHC {v.toFixed(2)}</span>,
    },
    { title: 'Method', dataIndex: 'method', key: 'method' },
  ];

  // --- Attendance report state ---
  const [attScope, setAttScope] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [attMonth, setAttMonth] = useState<Dayjs>(() => dayjs('2026-04-01'));
  const [attQuarter, setAttQuarter] = useState<number>(2);
  const [attYear, setAttYear] = useState<number>(2026);
  const [attWeekIndex, setAttWeekIndex] = useState(0);
  const [compareMode, setCompareMode] = useState<'previous' | 'none'>('previous');

  // Convert API attendance data to weekly totals
  const weeklyTotals = useMemo(() => {
    if (attendances.length > 0) {
      const weeks: { weekStart: string; label: string; total: number }[] = [];
      const weekMap: { [key: string]: number } = {};
      
      attendances.forEach(attendance => {
        const date = new Date(attendance.date);
        
        // Skip invalid dates
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found in attendance record:', attendance.date);
          return;
        }
        
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Get Sunday of the week
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weekMap[weekKey]) {
          weekMap[weekKey] = 0;
        }
        weekMap[weekKey] += attendance.total;
      });
      
      // Convert to array and sort by date (newest first)
      Object.entries(weekMap).forEach(([weekStart, total]) => {
        const date = new Date(weekStart);
        weeks.push({
          weekStart,
          label: `Week of ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          total
        });
      });
      
      return weeks.sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()).slice(0, 10);
    }
    
    // Fallback to hardcoded data
    return [
      { weekStart: '2026-04-14', label: 'Week of 14 Apr 2026', total: 198 },
      { weekStart: '2026-04-07', label: 'Week of 7 Apr 2026', total: 202 },
      { weekStart: '2026-03-31', label: 'Week of 31 Mar 2026', total: 195 },
      { weekStart: '2026-03-24', label: 'Week of 24 Mar 2026', total: 188 },
    ];
  }, [attendances]);

  // Convert API attendance data to monthly totals
  const monthlyTotals = useMemo(() => {
    if (attendances.length > 0) {
      const totals: { [key: string]: number } = {};
      
      attendances.forEach(attendance => {
        const date = new Date(attendance.date);
        
        // Skip invalid dates
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found in attendance record:', attendance.date);
          return;
        }
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // Convert to 1-based month
        const key = `${year}-${month}`;
        
        if (!totals[key]) {
          totals[key] = 0;
        }
        totals[key] += attendance.total;
      });
      
      return totals;
    }
    
    // Fallback to hardcoded data
    return {
      '2026-1': 780,
      '2026-2': 805,
      '2026-3': 830,
      '2026-4': 810,
      '2026-5': 785,
    };
  }, [attendances]);

  const attendanceReport = useMemo(() => {
    const getMonthTotal = (y: number, m: number) => {
      const key = `${y}-${m}`;
      return monthlyTotals[key] ?? 0;
    };

    let primary = 0;
    let primaryLabel = '';
    let compare = 0;
    let compareLabel = '';

    if (attScope === 'month') {
      const y = attMonth.year();
      const m = attMonth.month() + 1;
      primary = getMonthTotal(y, m);
      primaryLabel = `${monthName(m)} ${y}`;
      if (compareMode === 'previous') {
        const prev = attMonth.subtract(1, 'month');
        compare = getMonthTotal(prev.year(), prev.month() + 1);
        compareLabel = `${monthName(prev.month() + 1)} ${prev.year()}`;
      }
    } else if (attScope === 'quarter') {
      const startM = (attQuarter - 1) * 3 + 1;
      primary = 0;
      for (let i = 0; i < 3; i++) primary += getMonthTotal(attYear, startM + i);
      primaryLabel = `Q${attQuarter} ${attYear}`;
      if (compareMode === 'previous') {
        let py = attYear;
        let pq = attQuarter - 1;
        if (pq < 1) {
          pq = 4;
          py -= 1;
        }
        const cs = (pq - 1) * 3 + 1;
        compare = 0;
        for (let i = 0; i < 3; i++) compare += getMonthTotal(py, cs + i);
        compareLabel = `Q${pq} ${py}`;
      }
    } else if (attScope === 'year') {
      // Calculate year total from monthly totals
      primary = 0;
      for (let month = 1; month <= 12; month++) {
        primary += getMonthTotal(attYear, month);
      }
      primaryLabel = `${attYear}`;
      if (compareMode === 'previous') {
        compare = 0;
        for (let month = 1; month <= 12; month++) {
          compare += getMonthTotal(attYear - 1, month);
        }
        compareLabel = `${attYear - 1}`;
      }
    } else {
      const w = weeklyTotals[attWeekIndex] ?? weeklyTotals[0];
      if (w) {
        primary = w.total;
        primaryLabel = w.label;
        if (compareMode === 'previous' && attWeekIndex + 1 < weeklyTotals.length) {
          const w2 = weeklyTotals[attWeekIndex + 1];
          compare = w2.total;
          compareLabel = w2.label;
        }
      }
    }

    const delta = pctChange(compare, primary);
    const insight =
      compareMode === 'none' || compare <= 0
        ? `Total attendance for ${primaryLabel}: ${primary.toLocaleString()}.`
        : delta >= 0
          ? `Attendance for ${primaryLabel} was ${Math.abs(delta).toFixed(1)}% higher than ${compareLabel} (${primary.toLocaleString()} vs ${compare.toLocaleString()}).`
          : `Attendance for ${primaryLabel} was ${Math.abs(delta).toFixed(1)}% lower than ${compareLabel} (${primary.toLocaleString()} vs ${compare.toLocaleString()}).`;

    const maxBar = Math.max(primary, compare, 1);
    return { primary, primaryLabel, compare, compareLabel, delta, insight, maxBar };
  }, [attScope, attMonth, attQuarter, attYear, attWeekIndex, compareMode, monthlyTotals, weeklyTotals]);

  const exportAttendanceCsv = useCallback(() => {
    const r = attendanceReport;
    downloadCsv(`attendance-report-${attScope}-${dayjs().format('YYYYMMDD')}.csv`, [
      ['Scope', attScope],
      ['Primary period', r.primaryLabel],
      ['Primary total', r.primary],
      ['Compare period', compareMode === 'none' ? '—' : r.compareLabel],
      ['Compare total', compareMode === 'none' ? '—' : r.compare],
      ['Percent change', compareMode === 'none' ? '—' : `${r.delta.toFixed(2)}%`],
      ['Insight', r.insight],
    ]);
  }, [attendanceReport, attScope, compareMode]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Generate report</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welfare, dues, and attendance reporting for St. Joseph Catholic Church — select a period, review totals and
          member summaries, compare attendance, and export for meetings and archives.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading welfare and member data...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Data Loading Issue
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Unable to load welfare data from the backend API. Error: {error}</p>
                <p className="mt-1">Please check that the backend server is running at {getApiBase()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <Tabs
          defaultActiveKey="welfare"
          items={[
          {
            key: 'welfare',
            label: 'Welfare & dues',
            children: (
              <div className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Report period</CardTitle>
                    <p className="text-sm text-gray-600">
                      View total contributions for the selected months, member payment summaries, and outstanding
                      balances. Export a CSV for auditing and records.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Space wrap className="items-end">
                      <div>
                        <div className="mb-1 text-xs text-gray-500">From</div>
                        <DatePicker picker="month" value={welfareFrom} onChange={(d) => d && setWelfareFrom(d)} />
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-gray-500">To</div>
                        <DatePicker picker="month" value={welfareTo} onChange={(d) => d && setWelfareTo(d)} />
                      </div>
                      <Button variant="outline" className="gap-2" onClick={exportWelfareCsv}>
                        <HiOutlineDownload className="h-4 w-4" />
                        Export welfare / dues CSV
                      </Button>
                    </Space>
                    {welfareFrom.startOf('month').isAfter(welfareTo.startOf('month')) && (
                      <Alert
                        type="info"
                        showIcon
                        message={`From is after To — the report uses ${welfareTo.format('MMM YYYY')} through ${welfareFrom.format('MMM YYYY')}.`}
                      />
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-green-200 bg-green-50/80 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600">Total collected</p>
                      <p className="text-xl font-semibold text-green-800">
                        GHC {welfareReport.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">{welfareReport.monthCount} month(s) in range</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600">Total expected</p>
                      <p className="text-xl font-semibold text-gray-900">
                        GHC {welfareReport.expectedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {roster.length} members × GHC {MONTHLY_DUES_GHC} × {welfareReport.monthCount}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600">Outstanding (incomplete)</p>
                      <p className="text-xl font-semibold text-amber-900">
                        GHC {welfareReport.outstandingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-600">Collection rate</p>
                      <p className="text-xl font-semibold text-gray-900">{welfareReport.collectionPct.toFixed(1)}%</p>
                      <p className="mt-1 text-xs text-gray-500">Accountability snapshot</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Monthly breakdown (GHC)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {welfareReport.breakdownByMonth.map((row) => {
                        const pct = row.expected > 0 ? (row.collected / row.expected) * 100 : 0;
                        return (
                          <div key={row.key} className="min-w-[140px] flex-1 rounded-lg border border-gray-200 p-3">
                            <p className="text-xs font-medium text-gray-700">{row.label}</p>
                            <p className="mt-1 text-sm text-gray-900">
                              GHC {row.collected.toFixed(2)}{' '}
                              <span className="text-gray-500">/ {row.expected.toFixed(0)}</span>
                            </p>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-green-600 transition-all"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{pct.toFixed(0)}% collected</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Individual member summaries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table
                      size="small"
                      rowKey="id"
                      columns={welfareMemberColumns}
                      dataSource={welfareReport.byMember}
                      pagination={false}
                    />
                  </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Members with outstanding or incomplete payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {welfareReport.outstandingOnly.length === 0 ? (
                      <p className="text-sm text-green-700">No outstanding balances for this period.</p>
                    ) : (
                      <Table
                        size="small"
                        rowKey="id"
                        columns={welfareMemberColumns.filter((c) => c.key !== 'status')}
                        dataSource={welfareReport.outstandingOnly}
                        pagination={false}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Payment lines in period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table size="small" rowKey="id" columns={welfarePaymentColumns} dataSource={welfareReport.paymentRows} />
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            key: 'attendance',
            label: 'Attendance',
            children: (
              <div className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Attendance report</CardTitle>
                    <p className="text-sm text-gray-600">
                      Run reports by week, month, quarter, or year. Compare periods to spot trends; percentage change
                      is calculated automatically for leadership review.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Space wrap className="items-end">
                      <div>
                        <div className="mb-1 text-xs text-gray-500">Period type</div>
                        <Select
                          style={{ width: 140 }}
                          value={attScope}
                          onChange={(v) => setAttScope(v)}
                          options={[
                            { value: 'week', label: 'Week' },
                            { value: 'month', label: 'Month' },
                            { value: 'quarter', label: 'Quarter' },
                            { value: 'year', label: 'Year' },
                          ]}
                        />
                      </div>
                      {attScope === 'month' && (
                        <div>
                          <div className="mb-1 text-xs text-gray-500">Month</div>
                          <DatePicker picker="month" value={attMonth} onChange={(d) => d && setAttMonth(d)} />
                        </div>
                      )}
                      {attScope === 'quarter' && (
                        <>
                          <div>
                            <div className="mb-1 text-xs text-gray-500">Quarter</div>
                            <Select
                              style={{ width: 120 }}
                              value={attQuarter}
                              onChange={setAttQuarter}
                              options={[
                                { value: 1, label: 'Q1' },
                                { value: 2, label: 'Q2' },
                                { value: 3, label: 'Q3' },
                                { value: 4, label: 'Q4' },
                              ]}
                            />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-gray-500">Year</div>
                            <Select
                              style={{ width: 100 }}
                              value={attYear}
                              onChange={setAttYear}
                              options={[2025, 2026].map((y) => ({ value: y, label: String(y) }))}
                            />
                          </div>
                        </>
                      )}
                      {attScope === 'year' && (
                        <div>
                          <div className="mb-1 text-xs text-gray-500">Year</div>
                          <Select
                            style={{ width: 100 }}
                            value={attYear}
                            onChange={setAttYear}
                            options={[2025, 2026].map((y) => ({ value: y, label: String(y) }))}
                          />
                        </div>
                      )}
                      {attScope === 'week' && (
                        <div>
                          <div className="mb-1 text-xs text-gray-500">Week</div>
                          <Select
                            style={{ width: 260 }}
                            value={attWeekIndex}
                            onChange={setAttWeekIndex}
                            options={weeklyTotals.map((w, i) => ({ value: i, label: w.label }))}
                          />
                        </div>
                      )}
                      <div>
                        <div className="mb-1 text-xs text-gray-500">Compare</div>
                        <Select
                          style={{ width: 200 }}
                          value={compareMode}
                          onChange={(v) => setCompareMode(v)}
                          options={[
                            { value: 'previous', label: 'Previous period' },
                            { value: 'none', label: 'No comparison' },
                          ]}
                        />
                      </div>
                      <Button variant="outline" className="gap-2" onClick={exportAttendanceCsv}>
                        <HiOutlineDownload className="h-4 w-4" />
                        Export attendance CSV
                      </Button>
                    </Space>
                  </CardContent>
                </Card>

                <Alert type="info" showIcon message={attendanceReport.insight} />

                {compareMode === 'previous' && attendanceReport.compare > 0 && (
                  <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Comparison chart (headcount)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-gray-600">
                          <span>{attendanceReport.primaryLabel}</span>
                          <span className="font-medium text-gray-900">{attendanceReport.primary.toLocaleString()}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{
                              width: `${(attendanceReport.primary / attendanceReport.maxBar) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-gray-600">
                          <span>{attendanceReport.compareLabel}</span>
                          <span className="font-medium text-gray-900">{attendanceReport.compare.toLocaleString()}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-slate-400"
                            style={{
                              width: `${(attendanceReport.compare / attendanceReport.maxBar) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Use longer monthly or quarterly views to monitor engagement and identify high- or
                        low-participation periods.
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-gray-200 bg-gray-50/50 shadow-sm">
                  <CardContent className="p-4 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Example-style insights (from demo data)</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>Week of 7 Apr vs 31 Mar: small shifts similar to “attendance this week vs last week”.</li>
                      <li>
                        February vs May totals illustrate cross-month comparison (February higher than May in this
                        dataset).
                      </li>
                      <li>Quarter 2 vs quarter 1: combine months to see quarterly growth narratives.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ),
          },
        ]}
      />
      )}
    </div>
  );
}
