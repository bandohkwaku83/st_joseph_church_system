'use client';

import { useState, useMemo } from 'react';
import { HiPrinter, HiDownload, HiTrendingUp, HiTrendingDown } from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

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

interface IncomeReportItem {
  category: string;
  subcategory?: string;
  total: number;
  count: number;
}

interface ExpenditureReportItem {
  category: string;
  subcategory?: string;
  total: number;
  count: number;
}

type PeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export default function GenerateReportPage() {
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  // Store all income entries (in a real app, this would come from an API or shared state)
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

  // Store all expenditure entries
  const [expenditureEntries] = useState<ExpenditureEntry[]>([
    { id: '1', date: '2024-03-15', category: 'Operational Expenses', subcategory: 'Utilities (water, electricity)', amount: 450.00, paymentMethod: 'bank-transfer', payee: 'ECG' },
    { id: '2', date: '2024-03-10', category: 'Operational Expenses', subcategory: 'Cleaning & maintenance', amount: 200.00, paymentMethod: 'cash' },
    { id: '3', date: '2024-03-12', category: 'Payroll & Allowances', subcategory: 'Ministers\' stipends', amount: 1200.00, paymentMethod: 'bank-transfer', payee: 'Rev. John Doe' },
    { id: '4', date: '2024-03-10', category: 'Programs & Activities', subcategory: 'Evangelism programs', amount: 500.00, paymentMethod: 'cash' },
    { id: '5', date: '2024-03-10', category: 'Capital Expenditure', subcategory: 'Equipment purchases (PA system, instruments)', amount: 3500.00, paymentMethod: 'bank-transfer', payee: 'Sound Systems Ltd' },
  ]);

  // Calculate date range based on period type
  const dateRange = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (periodType === 'weekly') {
      // Set to start of week (Monday)
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      
      // Set to end of week (Sunday)
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (periodType === 'monthly') {
      // Set to start of month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      // Set to end of month
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else if (periodType === 'quarterly') {
      // Set to start of quarter
      const quarter = Math.floor(start.getMonth() / 3);
      start.setMonth(quarter * 3);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      // Set to end of quarter
      end.setMonth((quarter + 1) * 3);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else if (periodType === 'yearly') {
      // Set to start of year
      start.setMonth(0);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      // Set to end of year
      end.setMonth(11);
      end.setDate(31);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }, [periodType, startDate, endDate]);

  // Generate income report
  const incomeReport = useMemo(() => {
    const filtered = incomeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= dateRange.start && entryDate <= dateRange.end;
    });

    const grouped: Record<string, IncomeReportItem> = {};

    filtered.forEach(entry => {
      const key = `${entry.category}-${entry.subcategory || ''}`;
      if (!grouped[key]) {
        grouped[key] = {
          category: entry.category,
          subcategory: entry.subcategory,
          total: 0,
          count: 0,
        };
      }
      grouped[key].total += entry.amount;
      grouped[key].count += 1;
    });

    const items = Object.values(grouped);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const totalCount = items.reduce((sum, item) => sum + item.count, 0);

    return { items, total, totalCount };
  }, [incomeEntries, dateRange]);

  // Generate expenditure report
  const expenditureReport = useMemo(() => {
    const filtered = expenditureEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= dateRange.start && entryDate <= dateRange.end;
    });

    const grouped: Record<string, ExpenditureReportItem> = {};

    filtered.forEach(entry => {
      const key = `${entry.category}-${entry.subcategory || ''}`;
      if (!grouped[key]) {
        grouped[key] = {
          category: entry.category,
          subcategory: entry.subcategory,
          total: 0,
          count: 0,
        };
      }
      grouped[key].total += entry.amount;
      grouped[key].count += 1;
    });

    const items = Object.values(grouped);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const totalCount = items.reduce((sum, item) => sum + item.count, 0);

    return { items, total, totalCount };
  }, [expenditureEntries, dateRange]);

  // Calculate net income
  const netIncome = incomeReport.total - expenditureReport.total;

  // Pattern styles
  const patternStyles = [
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/svg%3E")',
    },
  ];

  const incomeColumns: ColumnsType<IncomeReportItem> = [
    {
      title: 'Category',
      key: 'category',
      render: (_, record: IncomeReportItem) => (
        <div>
          <div className="font-medium text-gray-900">{record.category}</div>
          {record.subcategory && (
            <div className="text-xs text-gray-500">({record.subcategory})</div>
          )}
        </div>
      ),
    },
    {
      title: 'Number of Entries',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      render: (count: number) => (
        <Tag color="blue">{count}</Tag>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (total: number) => (
        <span className="font-bold text-green-600">GHC {total.toFixed(2)}</span>
      ),
    },
  ];

  const expenditureColumns: ColumnsType<ExpenditureReportItem> = [
    {
      title: 'Category',
      key: 'category',
      render: (_, record: ExpenditureReportItem) => (
        <div>
          <div className="font-medium text-gray-900">{record.category}</div>
          {record.subcategory && (
            <div className="text-xs text-gray-500">({record.subcategory})</div>
          )}
        </div>
      ),
    },
    {
      title: 'Number of Entries',
      dataIndex: 'count',
      key: 'count',
      align: 'center',
      render: (count: number) => (
        <Tag color="orange">{count}</Tag>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (total: number) => (
        <span className="font-bold text-red-600">GHC {total.toFixed(2)}</span>
      ),
    },
  ];

  const formatPeriodLabel = () => {
    const start = dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Generate Financial Report
          </h1>
          <p className="text-gray-600 mt-1">Generate comprehensive financial reports for your parish</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="shadow-lg no-print">
            <HiDownload className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => window.print()} className="shadow-lg print-button">
          <HiPrinter className="h-4 w-4 mr-2" />
          Print Report
        </Button>
        </div>
      </div>

      {/* Report Settings */}
      <Card className="relative overflow-hidden no-print">
        <div 
          className="absolute inset-0"
          style={{ backgroundImage: patternStyles[0].background }}
        />
        <CardContent className="p-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Report Period</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as PeriodType)}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Period</label>
              <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700">
                {formatPeriodLabel()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{ backgroundImage: patternStyles[0].background }}
          />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Income</p>
                <p className="text-2xl font-semibold text-green-600 mb-2">
                  GHC {incomeReport.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">{incomeReport.totalCount} entries</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <HiTrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{ backgroundImage: patternStyles[1].background }}
          />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Expenditure</p>
                <p className="text-2xl font-semibold text-red-600 mb-2">
                  GHC {expenditureReport.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">{expenditureReport.totalCount} entries</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <HiTrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{ backgroundImage: patternStyles[0].background }}
          />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Net Income</p>
                <p className={`text-2xl font-semibold mb-2 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  GHC {netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  {netIncome >= 0 ? 'Surplus' : 'Deficit'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {netIncome >= 0 ? (
                  <HiTrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <HiTrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Report Section */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div 
          className="absolute top-0 right-0 w-48 h-48"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
          }}
        />
        <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-gray-200 relative z-10">
          <CardTitle className="text-lg font-bold text-gray-900">INCOME REPORT</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-0">
          <Table
            columns={incomeColumns}
            dataSource={incomeReport.items}
            rowKey={(record, index) => `${record.category}-${record.subcategory}-${index}`}
            pagination={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row className="bg-green-50 font-bold">
                  <Table.Summary.Cell index={0}>
                    <span className="font-bold text-gray-900">TOTAL INCOME</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Tag color="blue">{incomeReport.totalCount}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <span className="font-bold text-green-600">GHC {incomeReport.total.toFixed(2)}</span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </CardContent>
      </Card>

      {/* Expenditure Report Section */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div 
          className="absolute bottom-0 left-0 w-48 h-48"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23dc2626\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z\'/%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-gray-200 relative z-10">
          <CardTitle className="text-lg font-bold text-gray-900">EXPENDITURE REPORT</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-0">
          <Table
            columns={expenditureColumns}
            dataSource={expenditureReport.items}
            rowKey={(record, index) => `${record.category}-${record.subcategory}-${index}`}
            pagination={false}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row className="bg-red-50 font-bold">
                  <Table.Summary.Cell index={0}>
                    <span className="font-bold text-gray-900">TOTAL EXPENDITURE</span>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Tag color="orange">{expenditureReport.totalCount}</Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <span className="font-bold text-red-600">GHC {expenditureReport.total.toFixed(2)}</span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: patternStyles[1].background }}
        />
        <CardContent className="p-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Period</h3>
              <p className="text-base font-bold text-gray-900">{formatPeriodLabel()}</p>
            </div>
            <div className="text-right md:text-left">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Net Income</h3>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                GHC {netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
