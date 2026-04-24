'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  HiOutlineCurrencyDollar,
  HiTrendingUp,
  HiTrendingDown,
  HiPlus,
  HiArrowUp,
  HiArrowDown,
  HiDownload,
  HiFilter,
  HiCreditCard,
  HiReceiptTax,
  HiDocumentText,
  HiClipboardList,
  HiPrinter,
  HiReceiptRefund,
  HiMinus,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, Tag, Space, Button as AntButton, Input as AntInput, Select as AntSelect, AutoComplete, Drawer } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, DownloadOutlined, EditOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';

type TabType = 'input' | 'expenditure' | 'report' | 'payment-vouchers' | 'welfare';

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

interface PaymentVoucher {
  id: number;
  voucherNo: string;
  date: string;
  payee: string;
  amount: number;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface Welfare {
  id: string;
  memberId: number;
  memberName: string;
  amount: number;
  year: number;
  date: string;
  receiptNo: string;
}

interface ReportItem {
  category: string;
  subcategory?: string;
  type: 'deductible' | 'non-deductible';
  mainStation: number;
  outstation: number;
  total: number;
  levy: number;
}

// Sample members data (in a real app, this would come from an API or context)
const sampleMembers = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Michael Johnson' },
  { id: 4, name: 'Sarah Williams' },
  { id: 5, name: 'Emma Brown' },
  { id: 6, name: 'David Wilson' },
];

export default function FinancePage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('input');

  // Set active tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['input', 'expenditure', 'report', 'payment-vouchers', 'welfare'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenditureModal, setShowExpenditureModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showWelfareModal, setShowWelfareModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedWelfare, setSelectedWelfare] = useState<Welfare | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expenditureSearchTerm, setExpenditureSearchTerm] = useState('');
  
  // Report settings
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [deanery, setDeanery] = useState('AMA KOM');
  const [parish, setParish] = useState('');

  // Form state for income entry
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    subcategory: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'mobile-money' | 'bank-transfer',
    notes: '',
  });

  // Form state for expenditure entry
  const [expenditureForm, setExpenditureForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    subcategory: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'mobile-money' | 'bank-transfer',
    payee: '',
    notes: '',
  });

  // Store all income entries
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([
    { id: '1', date: '2024-03-15', category: 'Offerings', subcategory: 'Sunday Morning Service (1st)', amount: 205.00, paymentMethod: 'cash' },
    { id: '2', date: '2024-03-10', category: 'Sunday Offerings', amount: 7360.00, paymentMethod: 'cash' },
    { id: '3', date: '2024-03-12', category: 'Mid-week Services Offerings', amount: 1070.50, paymentMethod: 'mobile-money' },
    { id: '4', date: '2024-03-10', category: 'Welfare', subcategory: 'Member-linked', amount: 254.80, paymentMethod: 'bank-transfer' },
    { id: '5', date: '2024-03-10', category: 'Welfare', subcategory: 'Anonymous', amount: 7798.08, paymentMethod: 'cash' },
    { id: '6', date: '2024-03-14', category: 'Special Thanksgiving Offerings', amount: 770.00, paymentMethod: 'cash' },
    { id: '7', date: '2024-03-08', category: 'Donations', subcategory: 'One-off donations', amount: 325.00, paymentMethod: 'bank-transfer' },
    { id: '8', date: '2024-03-09', category: 'Donations', subcategory: 'Welfare donations', amount: 350.00, paymentMethod: 'mobile-money' },
    { id: '9', date: '2024-03-11', category: 'Donations', subcategory: 'Project donations', amount: 454.00, paymentMethod: 'cash' },
    { id: '10', date: '2024-03-13', category: 'Special Society Funds', subcategory: 'Welfare Fund', amount: 410.00, paymentMethod: 'cash' },
    { id: '11', date: '2024-03-07', category: 'Special Society Funds', subcategory: 'Building Fund', amount: 148.20, paymentMethod: 'bank-transfer' },
    { id: '12', date: '2024-03-06', category: 'Special Society Funds', subcategory: 'Mission / Evangelism Fund', amount: 212.50, paymentMethod: 'mobile-money' },
    { id: '13', date: '2024-03-05', category: 'Harvest / Anniversary Offerings', amount: 1800.00, paymentMethod: 'cash' },
  ]);

  // Store all expenditure entries
  const [expenditureEntries, setExpenditureEntries] = useState<ExpenditureEntry[]>([
    { id: '1', date: '2024-03-15', category: 'Operational Expenses', subcategory: 'Utilities (water, electricity)', amount: 450.00, paymentMethod: 'bank-transfer', payee: 'ECG' },
    { id: '2', date: '2024-03-10', category: 'Operational Expenses', subcategory: 'Cleaning & maintenance', amount: 200.00, paymentMethod: 'cash' },
    { id: '3', date: '2024-03-12', category: 'Payroll & Allowances', subcategory: 'Ministers\' stipends', amount: 1200.00, paymentMethod: 'bank-transfer', payee: 'Rev. John Doe' },
    { id: '4', date: '2024-03-10', category: 'Programs & Activities', subcategory: 'Evangelism programs', amount: 500.00, paymentMethod: 'cash' },
    { id: '5', date: '2024-03-10', category: 'Capital Expenditure', subcategory: 'Equipment purchases (PA system, instruments)', amount: 3500.00, paymentMethod: 'bank-transfer', payee: 'Sound Systems Ltd' },
  ]);

  // Payment Vouchers
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([
    { id: 1, voucherNo: 'PV-001', date: '2024-01-14', payee: 'Seth Opoku', amount: 60.00, purpose: 'Divine worship (singing ministry)', status: 'Approved' },
    { id: 2, voucherNo: 'PV-002', date: '2024-01-13', payee: 'John Doe', amount: 150.00, purpose: 'Equipment maintenance', status: 'Pending' },
  ]);

  // Welfare
  const [welfares, setWelfares] = useState<Welfare[]>([]);
  const [welfareForm, setWelfareForm] = useState({
    memberId: null as number | null,
    memberName: '',
    amount: '',
    year: new Date().getFullYear(),
  });
  const [memberSearchValue, setMemberSearchValue] = useState('');

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

  // Generate report from entries
  const generateReport = useMemo(() => {
    const monthEntries = incomeEntries.filter(entry => entry.date.startsWith(reportMonth));
    
    // Group by category and subcategory
    const grouped: Record<string, ReportItem> = {};

    monthEntries.forEach(entry => {
      const key = `${entry.category}-${entry.subcategory || ''}`;
      if (!grouped[key]) {
        grouped[key] = {
          category: entry.category,
          subcategory: entry.subcategory,
          type: 'deductible', // All income is now deductible
          mainStation: 0,
          outstation: 0,
          total: 0,
          levy: 0,
        };
      }
      
      // Since we removed station, all entries go to mainStation
        grouped[key].mainStation += entry.amount;
      grouped[key].total += entry.amount;
    });

    // Calculate levy (25% for deductible income)
    Object.values(grouped).forEach(item => {
        item.levy = item.total * 0.25;
    });

    const ordinary = Object.values(grouped);
    const special: ReportItem[] = [];

    const ordinaryTotal = ordinary.reduce((sum, item) => sum + item.total, 0);
    const ordinaryLevy = ordinary.reduce((sum, item) => sum + item.levy, 0);
    const specialTotal = 0;
    const specialLevy = 0;

    return {
      ordinary,
      special,
      ordinaryTotal,
      ordinaryLevy,
      specialTotal,
      specialLevy,
      grandTotal: ordinaryTotal + specialTotal,
      grandLevy: ordinaryLevy + specialLevy,
    };
  }, [incomeEntries, reportMonth]);

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: IncomeEntry = {
      id: Date.now().toString(),
      date: incomeForm.date,
      category: incomeForm.category,
      subcategory: incomeForm.subcategory || undefined,
      amount: parseFloat(incomeForm.amount) || 0,
      paymentMethod: incomeForm.paymentMethod,
      notes: incomeForm.notes || undefined,
    };
    setIncomeEntries([...incomeEntries, newEntry]);
    setIncomeForm({
      date: new Date().toISOString().slice(0, 10),
      category: '',
      subcategory: '',
      amount: '',
      paymentMethod: 'cash',
      notes: '',
    });
    setShowIncomeModal(false);
  };

  // Filter income entries
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return incomeEntries;
    return incomeEntries.filter(entry =>
      entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.subcategory?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [incomeEntries, searchTerm]);

  const financialStats = [
    { 
      label: 'Total Income', 
      value: `GHC ${generateReport.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      change: '+12%', 
      color: 'from-green-500 to-green-600', 
      icon: HiTrendingUp 
    },
    { 
      label: 'Total Levy (25%)', 
      value: `GHC ${generateReport.grandLevy.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      change: '+8%', 
      color: 'from-blue-500 to-blue-600', 
      icon: HiOutlineCurrencyDollar 
    },
    { 
      label: 'Net Income', 
      value: `GHC ${(generateReport.grandTotal - generateReport.grandLevy).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      change: '+18%', 
      color: 'from-purple-500 to-purple-600', 
      icon: HiCreditCard 
    },
    { 
      label: 'Payment Vouchers', 
      value: vouchers.length.toString(), 
      change: '', 
      color: 'from-orange-500 to-orange-600', 
      icon: HiDocumentText 
    },
  ];

  const tabs = [
    { id: 'input' as TabType, label: 'Record Income', icon: HiPlus },
    { id: 'expenditure' as TabType, label: 'Expenditure', icon: HiMinus },
    { id: 'report' as TabType, label: 'Generate Report', icon: HiClipboardList },
    { id: 'payment-vouchers' as TabType, label: 'Payment Vouchers', icon: HiDocumentText },
    { id: 'welfare' as TabType, label: 'Welfare', icon: HiReceiptRefund },
  ];

  const incomeCategories = [
    'Offerings',
    'Sunday Offerings',
    'Mid-week Services Offerings',
    'Special Thanksgiving Offerings',
    'Harvest / Anniversary Offerings',
      'Donations',
    'Special Society Funds',
  ];

  const getSubcategories = (category: string) => {
    const subcats: Record<string, string[]> = {
      'Offerings': [
        'Sunday Morning Service (1st)',
        'Sunday Morning Service (2nd)',
        'Sunday Morning Service (Joint)',
        'Evening Service',
        'Mid-week',
        'Special Services (Harvest)',
        'Special Services (Anniversary)',
        'Special Services (Thanksgiving)',
      ],
      'Donations': [
        'One-off donations',
        'Welfare donations',
        'Project donations',
      ],
      'Special Society Funds': [
        'Welfare Fund',
        'Building Fund',
        'Mission / Evangelism Fund',
        'Youth Fellowship Fund',
        'Women\'s Fellowship Fund',
        'Children\'s Service Fund',
      ],
      'Operational Expenses': [
        'Utilities (water, electricity)',
        'Cleaning & maintenance',
        'Printing & stationery',
        'Internet & communication',
        'Transport & fuel',
        'Other operational expenses',
      ],
      'Payroll & Allowances': [
        'Ministers\' stipends',
        'Catechists / Parish workers salaries',
        'Allowances (housing, transport, fuel)',
        'SSNIT contributions (where applicable)',
        'Other payroll expenses',
      ],
      'Programs & Activities': [
        'Evangelism programs',
        'Conferences & conventions',
        'Retreats & seminars',
        'Youth & women programs',
        'Funerals and welfare support',
        'Other programs & activities',
      ],
      'Capital Expenditure': [
        'Building projects',
        'Renovations',
        'Equipment purchases (PA system, instruments)',
        'Vehicles',
        'Chairs, instruments, PA system',
        'Small renovations',
        'Other capital items',
      ],
    };
    return subcats[category] || [];
  };

  const expenditureCategories = [
    'Operational Expenses',
    'Payroll & Allowances',
    'Programs & Activities',
    'Capital Expenditure',
    'Other',
  ];

  const handleAddExpenditure = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: ExpenditureEntry = {
      id: Date.now().toString(),
      date: expenditureForm.date,
      category: expenditureForm.category,
      subcategory: expenditureForm.subcategory || undefined,
      amount: parseFloat(expenditureForm.amount) || 0,
      paymentMethod: expenditureForm.paymentMethod,
      payee: expenditureForm.payee || undefined,
      notes: expenditureForm.notes || undefined,
    };
    setExpenditureEntries([...expenditureEntries, newEntry]);
    setExpenditureForm({
      date: new Date().toISOString().slice(0, 10),
      category: '',
      subcategory: '',
      amount: '',
      paymentMethod: 'cash',
      payee: '',
      notes: '',
    });
    setShowExpenditureModal(false);
  };

  // Filter expenditure entries
  const filteredExpenditureEntries = useMemo(() => {
    if (!expenditureSearchTerm) return expenditureEntries;
    return expenditureEntries.filter(entry =>
      entry.category.toLowerCase().includes(expenditureSearchTerm.toLowerCase()) ||
      entry.subcategory?.toLowerCase().includes(expenditureSearchTerm.toLowerCase()) ||
      entry.payee?.toLowerCase().includes(expenditureSearchTerm.toLowerCase())
    );
  }, [expenditureEntries, expenditureSearchTerm]);

  // Generate receipt number
  const generateReceiptNo = (): string => {
    const year = new Date().getFullYear();
    const count = welfares.filter(w => w.year === year).length + 1;
    return `WELFARE-${year}-${String(count).padStart(4, '0')}`;
  };

  // Handle welfare submission
  const handleAddWelfare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!welfareForm.memberId || !welfareForm.memberName || !welfareForm.amount) {
      return;
    }

    const newWelfare: Welfare = {
      id: Date.now().toString(),
      memberId: welfareForm.memberId,
      memberName: welfareForm.memberName,
      amount: parseFloat(welfareForm.amount) || 0,
      year: welfareForm.year,
      date: new Date().toISOString().slice(0, 10),
      receiptNo: generateReceiptNo(),
    };

    setWelfares([...welfares, newWelfare]);
    setWelfareForm({
      memberId: null,
      memberName: '',
      amount: '',
      year: new Date().getFullYear(),
    });
    setMemberSearchValue('');
    setShowWelfareModal(false);
    
    // Show receipt
    setSelectedWelfare(newWelfare);
    setShowReceiptModal(true);
  };

  // Member search options
  const memberOptions = sampleMembers
    .filter(member => 
      member.name.toLowerCase().includes(memberSearchValue.toLowerCase())
    )
    .map(member => ({
      value: member.name,
      label: member.name,
      memberId: member.id,
    }));

  // Welfare table columns
  const welfareColumns: ColumnsType<Welfare> = [
    {
      title: 'Receipt No.',
      dataIndex: 'receiptNo',
      key: 'receiptNo',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: 'Member Name',
      dataIndex: 'memberName',
      key: 'memberName',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => (
        <span className="font-bold text-gray-900">GHC {amount.toFixed(2)}</span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      sorter: (a, b) => a.year - b.year,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Welfare) => (
        <Space>
          <AntButton 
            type="link" 
            icon={<PrinterOutlined />} 
            size="small"
            onClick={() => {
              setSelectedWelfare(record);
              setShowReceiptModal(true);
            }}
          >
            Print Receipt
          </AntButton>
        </Space>
      ),
    },
  ];

  // Ant Design Table Columns
  const incomeColumns: ColumnsType<IncomeEntry> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string, record: IncomeEntry) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          {record.subcategory && (
            <div className="text-xs text-gray-500">({record.subcategory})</div>
          )}
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => (
        <span className="font-bold text-gray-900">GHC {amount.toFixed(2)}</span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const methodLabels: Record<string, string> = {
          'cash': 'Cash',
          'mobile-money': 'Mobile Money',
          'bank-transfer': 'Bank Transfer',
        };
        return (
          <Tag color="blue">{methodLabels[method] || method}</Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <AntButton type="link" icon={<EditOutlined />} size="small" title="Edit" />
        </Space>
      ),
    },
  ];

  // Expenditure table columns
  const expenditureColumns: ColumnsType<ExpenditureEntry> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string, record: ExpenditureEntry) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          {record.subcategory && (
            <div className="text-xs text-gray-500">({record.subcategory})</div>
          )}
        </div>
      ),
    },
    {
      title: 'Payee',
      dataIndex: 'payee',
      key: 'payee',
      render: (payee: string) => payee || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => (
        <span className="font-bold text-red-600">GHC {amount.toFixed(2)}</span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const methodLabels: Record<string, string> = {
          'cash': 'Cash',
          'mobile-money': 'Mobile Money',
          'bank-transfer': 'Bank Transfer',
        };
        return (
          <Tag color="orange">{methodLabels[method] || method}</Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <AntButton type="link" icon={<EditOutlined />} size="small" title="Edit" />
        </Space>
      ),
    },
  ];

  const voucherColumns: ColumnsType<PaymentVoucher> = [
    {
      title: 'Voucher No.',
      dataIndex: 'voucherNo',
      key: 'voucherNo',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Payee',
      dataIndex: 'payee',
      key: 'payee',
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => (
        <span className="font-bold text-gray-900">GHC {amount.toFixed(2)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Approved' ? 'green' : status === 'Rejected' ? 'red' : 'orange'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <AntButton type="link" icon={<EyeOutlined />} size="small">
            View
          </AntButton>
        </Space>
      ),
    },
  ];

  const reportOrdinaryColumns: ColumnsType<ReportItem> = [
    {
      title: 'SOURCE: RECEIPTS',
      key: 'source',
      render: (_, record: ReportItem) => (
        <div>
          <div className="font-medium text-gray-900">{record.category}</div>
          {record.subcategory && (
            <span className="text-sm text-gray-600">({record.subcategory})</span>
          )}
          {record.mainStation > 0 && (
            <div className="text-xs text-gray-500 mt-1">Main Station: GHC {record.mainStation.toFixed(2)}</div>
          )}
          {record.outstation > 0 && (
            <div className="text-xs text-gray-500 mt-1">Outstation: GHC {record.outstation.toFixed(2)}</div>
          )}
        </div>
      ),
    },
    {
      title: 'TOTAL AMOUNT',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (total: number) => (
        <span className="font-bold text-gray-900">GHC {total.toFixed(2)}</span>
      ),
    },
    {
      title: 'LEVY (25%)',
      dataIndex: 'levy',
      key: 'levy',
      align: 'right',
      render: (levy: number) => (
        <span className="font-semibold text-blue-600">GHC {levy.toFixed(2)}</span>
      ),
    },
  ];

  const reportSpecialColumns: ColumnsType<ReportItem> = [
    {
      title: 'SOURCE: RECEIPTS',
      key: 'source',
      render: (_, record: ReportItem) => (
        <div>
          <div className="font-medium text-gray-900">{record.category}</div>
          {record.subcategory && (
            <span className="text-sm text-gray-600">({record.subcategory})</span>
          )}
          {record.mainStation > 0 && (
            <div className="text-xs text-gray-500 mt-1">Main Station: GHC {record.mainStation.toFixed(2)}</div>
          )}
          {record.outstation > 0 && (
            <div className="text-xs text-gray-500 mt-1">Outstation: GHC {record.outstation.toFixed(2)}</div>
          )}
        </div>
      ),
    },
    {
      title: 'TOTAL AMOUNT',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (total: number) => (
        <span className="font-bold text-gray-900">GHC {total.toFixed(2)}</span>
      ),
    },
    {
      title: 'LEVY (25%)',
      dataIndex: 'levy',
      key: 'levy',
      align: 'right',
      render: (levy: number) => (
        <span className="font-semibold text-blue-600">GHC {levy.toFixed(2)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Finance & Contributions
          </h1>
          <p className="text-gray-600 mt-1">Record income entries and generate financial reports</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'input' && (
            <Button onClick={() => setShowIncomeModal(true)} className="shadow-lg">
              <HiPlus className="h-4 w-4 mr-2" />
              Record Income Entry
            </Button>
          )}
          {activeTab === 'expenditure' && (
            <Button onClick={() => setShowExpenditureModal(true)} className="shadow-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
              <HiMinus className="h-4 w-4 mr-2" />
              Record Expenditure
            </Button>
          )}
          {activeTab === 'report' && (
            <Button onClick={() => window.print()} className="shadow-lg">
              <HiPrinter className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          )}
          {activeTab === 'payment-vouchers' && (
            <Button onClick={() => setShowVoucherModal(true)} className="shadow-lg">
              <HiPlus className="h-4 w-4 mr-2" />
              Create Voucher
            </Button>
          )}
          {activeTab === 'welfare' && (
            <Button onClick={() => setShowWelfareModal(true)} className="shadow-lg">
              <HiPlus className="h-4 w-4 mr-2" />
              Record Welfare
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Financial Stats - Matching Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialStats.map((stat, index) => {
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
                    <p className="text-xl font-semibold text-gray-900 mb-2">{stat.value}</p>
                    {stat.change && (
                      <div className="flex items-center gap-1">
                        {stat.change.startsWith('+') ? (
                          <HiArrowUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <HiArrowDown className="h-3 w-3 text-red-600" />
                        )}
                        <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </p>
                      </div>
                    )}
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

      {/* Record Income Tab */}
      {activeTab === 'input' && (
        <Card className="relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-64 h-64"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
            }}
          />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Income Entries</CardTitle>
              <Space>
                <AntInput
                  placeholder="Search by category..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 250 }}
                />
                <AntButton icon={<DownloadOutlined />}>Export</AntButton>
              </Space>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Table
              columns={incomeColumns}
              dataSource={filteredEntries}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} entries`,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Expenditure Tab */}
      {activeTab === 'expenditure' && (
        <Card className="relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-64 h-64"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%23dc2626\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
            }}
          />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Expenditure Entries</CardTitle>
              <Space>
                <AntInput
                  placeholder="Search by category or payee..."
                  prefix={<SearchOutlined />}
                  value={expenditureSearchTerm}
                  onChange={(e) => setExpenditureSearchTerm(e.target.value)}
                  style={{ width: 250 }}
                />
                <AntButton icon={<DownloadOutlined />}>Export</AntButton>
              </Space>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Table
              columns={expenditureColumns}
              dataSource={filteredExpenditureEntries}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} entries`,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Generate Report Tab */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Report Settings */}
          <Card className="relative overflow-hidden">
            <div 
              className="absolute inset-0"
              style={{ backgroundImage: patternStyles[0].background }}
            />
            <CardContent className="p-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name of Deanery</label>
                  <Input value={deanery} onChange={(e) => setDeanery(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name of Parish</label>
                  <Input value={parish} onChange={(e) => setParish(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Month/Quarter</label>
                  <Input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ordinary Income Section */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div 
              className="absolute top-0 right-0 w-48 h-48"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
              }}
            />
            <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-gray-200 relative z-10">
              <CardTitle className="text-lg font-bold text-gray-900">ORDINARY INCOME (DEDUCTIBLE)</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-0">
              <Table
                columns={reportOrdinaryColumns}
                dataSource={generateReport.ordinary}
                rowKey={(record, index) => `${record.category}-${record.subcategory}-${index}`}
                pagination={false}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="bg-green-50 font-bold">
                      <Table.Summary.Cell index={0}>
                        <span className="font-bold text-gray-900">SUB TOTAL (Deductible)</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <span className="font-bold text-gray-900">GHC {generateReport.ordinaryTotal.toFixed(2)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <span className="font-bold text-blue-600">GHC {generateReport.ordinaryLevy.toFixed(2)}</span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </CardContent>
          </Card>

          {/* Special Income Section */}
          <Card className="relative overflow-hidden border-0 shadow-lg">
            <div 
              className="absolute bottom-0 left-0 w-48 h-48"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/svg%3E")',
              }}
            />
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-gray-200 relative z-10">
              <CardTitle className="text-lg font-bold text-gray-900">SPECIAL INCOME (NON-DEDUCTIBLE)</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-0">
              <Table
                columns={reportSpecialColumns}
                dataSource={generateReport.special}
                rowKey={(record, index) => `${record.category}-${record.subcategory}-${index}`}
                pagination={false}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="bg-blue-50 font-bold">
                      <Table.Summary.Cell index={0}>
                        <span className="font-bold text-gray-900">SUB-TOTAL (Non-Deductible)</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <span className="font-bold text-gray-900">GHC {generateReport.specialTotal.toFixed(2)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <span className="font-bold text-blue-600">GHC {generateReport.specialLevy.toFixed(2)}</span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </CardContent>
          </Card>

          {/* Grand Total */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: patternStyles[1].background }}
            />
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">GRAND TOTAL</h3>
                  <p className="text-sm text-gray-600">All Income Sources</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    GHC {generateReport.grandTotal.toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-600 font-semibold mt-1">
                    Total Levy: GHC {generateReport.grandLevy.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Vouchers Tab */}
      {activeTab === 'payment-vouchers' && (
        <Card className="relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-64 h-64"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
            }}
          />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Payment Vouchers</CardTitle>
              <Space>
                <AntButton icon={<DownloadOutlined />}>Export</AntButton>
              </Space>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Table
              columns={voucherColumns}
              dataSource={vouchers}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} vouchers`,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Welfare Tab */}
      {activeTab === 'welfare' && (
        <Card className="relative overflow-hidden">
          <div 
            className="absolute top-0 right-0 w-64 h-64"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
            }}
          />
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Welfare Records</CardTitle>
              <Space>
                <AntInput
                  placeholder="Search by member name..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 250 }}
                />
                <AntButton icon={<DownloadOutlined />}>Export</AntButton>
              </Space>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Table
              columns={welfareColumns}
              dataSource={welfares.filter(welfare => 
                !searchTerm || welfare.memberName.toLowerCase().includes(searchTerm.toLowerCase())
              )}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} welfare contributions`,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Record Income Entry Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <HiPlus className="h-5 w-5 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Record Income Entry</span>
          </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 400}
        onClose={() => setShowIncomeModal(false)}
        open={showIncomeModal}
        styles={{
          body: { padding: '24px' },
        }}
      >
        <form onSubmit={handleAddIncome} className="space-y-6">
          {/* Date Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Date <span className="text-red-500">*</span>
            </label>
              <Input
                type="date"
                value={incomeForm.date}
                onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                required
              className="h-11"
              />
            </div>

          {/* Category Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
              <select
              className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all"
              value={incomeForm.category}
              onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value, subcategory: '' })}
              required
            >
              <option value="">Select a category</option>
              {incomeCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Subcategory Field */}
          {getSubcategories(incomeForm.category).length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Subcategory
              </label>
              <select
                className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all"
                value={incomeForm.subcategory}
                onChange={(e) => setIncomeForm({ ...incomeForm, subcategory: e.target.value })}
              >
                <option value="">Select a subcategory (optional)</option>
                {getSubcategories(incomeForm.category).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Amount Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Amount (GHC) <span className="text-red-500">*</span>
            </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                required
              className="h-11"
              />
            </div>

          {/* Payment Method Field */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3">
              <label className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg transition-all ${
                incomeForm.paymentMethod === 'cash' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={incomeForm.paymentMethod === 'cash'}
                  onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value as 'cash' | 'mobile-money' | 'bank-transfer' })}
                  className="w-5 h-5 text-green-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">Cash</span>
                  <p className="text-xs text-gray-500 mt-0.5">Physical cash payment</p>
          </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg transition-all ${
                incomeForm.paymentMethod === 'mobile-money' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mobile-money"
                  checked={incomeForm.paymentMethod === 'mobile-money'}
                  onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value as 'cash' | 'mobile-money' | 'bank-transfer' })}
                  className="w-5 h-5 text-green-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">Mobile Money</span>
                  <p className="text-xs text-gray-500 mt-0.5">MTN Mobile Money, Vodafone Cash, etc.</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg transition-all ${
                incomeForm.paymentMethod === 'bank-transfer' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank-transfer"
                  checked={incomeForm.paymentMethod === 'bank-transfer'}
                  onChange={(e) => setIncomeForm({ ...incomeForm, paymentMethod: e.target.value as 'cash' | 'mobile-money' | 'bank-transfer' })}
                  className="w-5 h-5 text-green-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">Bank Transfer</span>
                  <p className="text-xs text-gray-500 mt-0.5">Direct bank transfer or cheque</p>
                </div>
              </label>
            </div>
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Notes
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
              placeholder="Add any additional notes or comments..."
              value={incomeForm.notes}
              onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowIncomeModal(false)} 
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-11 shadow-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              Record Entry
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Record Expenditure Entry Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <HiMinus className="h-5 w-5 text-red-600" />
            <span className="text-xl font-bold text-gray-900">Record Expenditure</span>
          </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 400}
        onClose={() => setShowExpenditureModal(false)}
        open={showExpenditureModal}
        styles={{
          body: { padding: '24px' },
        }}
      >
        <form onSubmit={handleAddExpenditure} className="space-y-6">
          {/* Date Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={expenditureForm.date}
              onChange={(e) => setExpenditureForm({ ...expenditureForm, date: e.target.value })}
              required
              className="h-11"
            />
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white transition-all"
              value={expenditureForm.category}
              onChange={(e) => setExpenditureForm({ ...expenditureForm, category: e.target.value, subcategory: '' })}
              required
            >
              <option value="">Select a category</option>
              {expenditureCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Subcategory Field */}
          {getSubcategories(expenditureForm.category).length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Subcategory
              </label>
              <select
                className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white transition-all"
                value={expenditureForm.subcategory}
                onChange={(e) => setExpenditureForm({ ...expenditureForm, subcategory: e.target.value })}
              >
                <option value="">Select a subcategory (optional)</option>
                {getSubcategories(expenditureForm.category).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Payee Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Payee / Recipient
            </label>
            <Input
              type="text"
              placeholder="Enter payee name (optional)"
              value={expenditureForm.payee}
              onChange={(e) => setExpenditureForm({ ...expenditureForm, payee: e.target.value })}
              className="h-11"
            />
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Amount (GHC) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={expenditureForm.amount}
              onChange={(e) => setExpenditureForm({ ...expenditureForm, amount: e.target.value })}
              required
              className="h-11"
            />
          </div>

          {/* Payment Method Field */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3">
              <label className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg transition-all ${
                expenditureForm.paymentMethod === 'cash' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="expenditurePaymentMethod"
                  value="cash"
                  checked={expenditureForm.paymentMethod === 'cash'}
                  onChange={(e) => setExpenditureForm({ ...expenditureForm, paymentMethod: e.target.value as 'cash' | 'mobile-money' | 'bank-transfer' })}
                  className="w-5 h-5 text-red-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">Cash</span>
                  <p className="text-xs text-gray-500 mt-0.5">Physical cash payment</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg transition-all ${
                expenditureForm.paymentMethod === 'mobile-money' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="expenditurePaymentMethod"
                  value="mobile-money"
                  checked={expenditureForm.paymentMethod === 'mobile-money'}
                  onChange={(e) => setExpenditureForm({ ...expenditureForm, paymentMethod: e.target.value as 'cash' | 'mobile-money' | 'bank-transfer' })}
                  className="w-5 h-5 text-red-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">Mobile Money</span>
                  <p className="text-xs text-gray-500 mt-0.5">MTN Mobile Money, Vodafone Cash, etc.</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 cursor-pointer p-4 border-2 rounded-lg transition-all ${
                expenditureForm.paymentMethod === 'bank-transfer' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="expenditurePaymentMethod"
                  value="bank-transfer"
                  checked={expenditureForm.paymentMethod === 'bank-transfer'}
                  onChange={(e) => setExpenditureForm({ ...expenditureForm, paymentMethod: e.target.value as 'cash' | 'mobile-money' | 'bank-transfer' })}
                  className="w-5 h-5 text-red-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900">Bank Transfer</span>
                  <p className="text-xs text-gray-500 mt-0.5">Direct bank transfer or cheque</p>
                </div>
              </label>
            </div>
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Notes
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
              placeholder="Add any additional notes or comments..."
              value={expenditureForm.notes}
              onChange={(e) => setExpenditureForm({ ...expenditureForm, notes: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowExpenditureModal(false)} 
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-11 shadow-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Record Expenditure
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Payment Voucher Drawer */}
      <Drawer
        open={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        title="Payment Voucher"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      >
        <form className="p-4 sm:p-6 space-y-4">
          <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h3 className="text-center text-xl font-bold text-gray-900 mb-2">ST. JOSEPH PARISH CHURCH</h3>
            <p className="text-center text-sm font-bold text-gray-900 mt-2">PAYMENT VOUCHER</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
              <Input type="date" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Voucher No. *</label>
              <Input placeholder="PV-001" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Please Pay *</label>
            <Input placeholder="Enter payee name" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <Input placeholder="e.g., Divine worship (singing ministry)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (GHC) *</label>
              <Input type="number" step="0.01" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount in Words *</label>
              <Input placeholder="e.g., Sixty Ghana cedis only" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method *</label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="paymentMethod" value="cash" className="w-4 h-4" />
                <span className="text-sm">Cash</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="paymentMethod" value="cheque" className="w-4 h-4" />
                <span className="text-sm">Cheque</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="paymentMethod" value="bank" className="w-4 h-4" />
                <span className="text-sm">Bank Transfer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="paymentMethod" value="other" className="w-4 h-4" />
                <span className="text-sm">Other</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Received By</label>
              <Input placeholder="Signature" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reviewed By</label>
              <Input placeholder="Signature" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Approved By</label>
              <Input placeholder="Signature" />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setShowVoucherModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700">
              Create Voucher
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Welfare Entry Drawer */}
      <Drawer
        open={showWelfareModal}
        onClose={() => {
          setShowWelfareModal(false);
          setWelfareForm({
            memberId: null,
            memberName: '',
            amount: '',
            year: new Date().getFullYear(),
          });
          setMemberSearchValue('');
        }}
        title="Record Welfare"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      >
        <form onSubmit={handleAddWelfare} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Member Name *</label>
            <AutoComplete
              options={memberOptions}
              value={memberSearchValue}
              onChange={(value) => {
                setMemberSearchValue(value);
                const selected = sampleMembers.find(m => m.name === value);
                if (selected) {
                  setWelfareForm({
                    ...welfareForm,
                    memberId: selected.id,
                    memberName: selected.name,
                  });
                } else {
                  setWelfareForm({
                    ...welfareForm,
                    memberId: null,
                    memberName: '',
                  });
                }
              }}
              onSearch={(value) => setMemberSearchValue(value)}
              placeholder="Search or select member name"
              className="w-full"
              style={{ width: '100%' }}
              size="large"
            />
            {welfareForm.memberId && (
              <p className="text-xs text-green-600 mt-1">Selected: {welfareForm.memberName}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (GHC) *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={welfareForm.amount}
                onChange={(e) => setWelfareForm({ ...welfareForm, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
              <Input
                type="number"
                placeholder="2024"
                value={welfareForm.year}
                onChange={(e) => setWelfareForm({ ...welfareForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
                required
                min={2000}
                max={2100}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => {
              setShowWelfareModal(false);
              setWelfareForm({
                memberId: null,
                memberName: '',
                amount: '',
                year: new Date().getFullYear(),
              });
              setMemberSearchValue('');
            }} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 shadow-lg bg-gradient-to-r from-green-600 to-green-700">
              Save & Generate Receipt
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Receipt Drawer */}
      <Drawer
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedWelfare(null);
        }}
        title="Welfare Receipt"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      >
        {selectedWelfare && (
          <div className="p-4 sm:p-6">
            <div id="welfare-receipt" className="bg-white p-8 border-2 border-gray-300">
              {/* Header */}
              <div className="text-center border-b-2 border-gray-400 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">ST. JOSEPH PARISH CHURCH</h2>
                <p className="text-base font-bold text-gray-900 mt-2">WELFARE RECEIPT</p>
              </div>

              {/* Receipt Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Receipt No.:</span>
                  <span className="text-sm font-bold text-gray-900">{selectedWelfare.receiptNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Date:</span>
                  <span className="text-sm text-gray-900">{new Date(selectedWelfare.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="border-t border-gray-300 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Member Name:</span>
                    <span className="text-sm font-bold text-gray-900">{selectedWelfare.memberName}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Year:</span>
                    <span className="text-sm text-gray-900">{selectedWelfare.year}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-300 mt-4">
                    <span className="text-base font-bold text-gray-900">Amount Paid:</span>
                    <span className="text-xl font-bold text-gray-900">GHC {selectedWelfare.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="border-t-2 border-gray-400 pt-4 mb-6">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Amount in Words:</span>{' '}
                  <span className="italic">{convertNumberToWords(selectedWelfare.amount)} Only</span>
                </p>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-400 pt-6 mt-6">
                <div className="grid grid-cols-2 gap-8 text-center">
                  <div>
                    <div className="border-t border-gray-400 pt-2 mt-12">
                      <p className="text-xs text-gray-600">Received By</p>
                      <p className="text-xs text-gray-900 font-semibold mt-2">Signature</p>
                    </div>
                  </div>
                  <div>
                    <div className="border-t border-gray-400 pt-2 mt-12">
                      <p className="text-xs text-gray-600">Member Signature</p>
                      <p className="text-xs text-gray-900 font-semibold mt-2">Signature</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-6">
                  This is a computer-generated receipt. Thank you for your contribution.
                </p>
              </div>
            </div>

            {/* Print Button */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedWelfare(null);
                }} 
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  const printContent = document.getElementById('welfare-receipt');
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Welfare Receipt - ${selectedWelfare.receiptNo}</title>
                            <style>
                              body { 
                                font-family: Arial, sans-serif; 
                                padding: 20px;
                                margin: 0;
                              }
                              @media print {
                                body { padding: 0; }
                                @page { margin: 0.5cm; }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }
                }} 
                className="flex-1 shadow-lg bg-gradient-to-r from-green-600 to-green-700"
              >
                <HiPrinter className="h-4 w-4 mr-2 inline" />
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// Helper function to convert number to words
function convertNumberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertInteger = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertInteger(remainder) : '');
    }
    if (n < 1000000) {
      const thousand = Math.floor(n / 1000);
      const remainder = n % 1000;
      return convertInteger(thousand) + ' Thousand' + (remainder > 0 ? ' ' + convertInteger(remainder) : '');
    }
    if (n < 1000000000) {
      const million = Math.floor(n / 1000000);
      const remainder = n % 1000000;
      return convertInteger(million) + ' Million' + (remainder > 0 ? ' ' + convertInteger(remainder) : '');
    }
    return n.toString();
  };

  // Handle decimal part (pesewas)
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  
  let result = '';
  if (integerPart === 0 && decimalPart === 0) {
    result = 'Zero';
  } else if (integerPart === 0) {
    result = '';
  } else {
    result = convertInteger(integerPart);
  }
  
  if (decimalPart > 0) {
    const pesewas = convertInteger(decimalPart);
    if (result) {
      result += ' Ghana Cedis and ' + pesewas + ' Pesewas';
    } else {
      result = pesewas + ' Pesewas';
    }
  } else if (result) {
    result += ' Ghana Cedis';
  }
  
  return result || 'Zero';
}
