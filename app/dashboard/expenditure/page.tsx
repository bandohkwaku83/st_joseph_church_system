'use client';

import { useState, useMemo } from 'react';
import { HiMinus, HiDownload } from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, Tag, Space, Button as AntButton, Input as AntInput, Drawer } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, DownloadOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';

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

export default function ExpenditurePage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const [showExpenditureModal, setShowExpenditureModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ExpenditureEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Store all expenditure entries
  const [expenditureEntries, setExpenditureEntries] = useState<ExpenditureEntry[]>([
    { id: '1', date: '2024-03-15', category: 'Operational Expenses', subcategory: 'Utilities (water, electricity)', amount: 450.00, paymentMethod: 'bank-transfer', payee: 'ECG' },
    { id: '2', date: '2024-03-10', category: 'Operational Expenses', subcategory: 'Cleaning & maintenance', amount: 200.00, paymentMethod: 'cash' },
    { id: '3', date: '2024-03-12', category: 'Payroll & Allowances', subcategory: 'Ministers\' stipends', amount: 1200.00, paymentMethod: 'bank-transfer', payee: 'Rev. John Doe' },
    { id: '4', date: '2024-03-10', category: 'Programs & Activities', subcategory: 'Evangelism programs', amount: 500.00, paymentMethod: 'cash' },
    { id: '5', date: '2024-03-10', category: 'Capital Expenditure', subcategory: 'Equipment purchases (PA system, instruments)', amount: 3500.00, paymentMethod: 'bank-transfer', payee: 'Sound Systems Ltd' },
  ]);

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
  const filteredEntries = useMemo(() => {
    if (!searchTerm) return expenditureEntries;
    return expenditureEntries.filter(entry =>
      entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.payee?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenditureEntries, searchTerm]);

  const expenditureCategories = [
    'Operational Expenses',
    'Payroll & Allowances',
    'Programs & Activities',
    'Capital Expenditure',
    'Other',
  ];

  const getSubcategories = (category: string) => {
    const subcats: Record<string, string[]> = {
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
      render: (_, record: ExpenditureEntry) => (
        <Space>
          <AntButton 
            type="link" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEntry(record);
              setShowDetailsDrawer(true);
            }}
            title="View"
          />
          <AntButton 
            type="link" 
            icon={<EditOutlined />} 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              // Handle edit functionality here
            }}
            title="Edit"
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
            Expenditure
          </h1>
          <p className="text-gray-600 mt-1">Record and manage expenditure entries</p>
        </div>
        {(hasPermission('expenditure') || isSuperAdmin) && (
          <Button onClick={() => setShowExpenditureModal(true)} className="shadow-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
            <HiMinus className="h-4 w-4 mr-2" />
            Record Expenditure
          </Button>
        )}
      </div>

      {/* Expenditure Entries Table */}
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
            columns={expenditureColumns}
            dataSource={filteredEntries}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedEntry(record);
                setShowDetailsDrawer(true);
              },
              className: 'cursor-pointer hover:bg-gray-50',
            })}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} entries`,
            }}
          />
        </CardContent>
      </Card>

      {/* Record Expenditure Entry Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <HiMinus className="h-5 w-5 text-red-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Record Expenditure</span>
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

      {/* Expenditure Entry Details Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined className="h-5 w-5 text-red-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Expenditure Entry Details</span>
          </div>
        }
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 400}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedEntry(null);
        }}
        open={showDetailsDrawer}
        styles={{
          body: { padding: '24px' },
        }}
      >
        {selectedEntry && (
          <div className="space-y-6">
            {/* Entry ID */}
            <div className="pb-4 border-b border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Entry ID</p>
              <p className="text-sm font-semibold text-gray-900">{selectedEntry.id}</p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</p>
              <p className="text-base text-gray-900">
                {new Date(selectedEntry.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</p>
              <p className="text-base font-semibold text-gray-900">{selectedEntry.category}</p>
              {selectedEntry.subcategory && (
                <p className="text-sm text-gray-600">Subcategory: {selectedEntry.subcategory}</p>
              )}
            </div>

            {/* Payee */}
            {selectedEntry.payee && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payee / Recipient</p>
                <p className="text-base text-gray-900">{selectedEntry.payee}</p>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</p>
              <p className="text-2xl font-bold text-red-600">
                GHC {selectedEntry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Method</p>
              <div>
                {selectedEntry.paymentMethod === 'cash' && (
                  <Tag color="red" className="text-sm py-1 px-3">Cash</Tag>
                )}
                {selectedEntry.paymentMethod === 'mobile-money' && (
                  <Tag color="orange" className="text-sm py-1 px-3">Mobile Money</Tag>
                )}
                {selectedEntry.paymentMethod === 'bank-transfer' && (
                  <Tag color="purple" className="text-sm py-1 px-3">Bank Transfer</Tag>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedEntry.notes && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</p>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEntry.notes}</p>
                </div>
              </div>
            )}

            {!selectedEntry.notes && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</p>
                <p className="text-sm text-gray-400 italic">No notes added</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDetailsDrawer(false);
                  setSelectedEntry(null);
                }} 
                className="flex-1 h-11"
              >
                Close
              </Button>
              <Button 
                type="button"
                onClick={() => {
                  setShowDetailsDrawer(false);
                  // Handle edit functionality here
                  // You can populate the form with selectedEntry data
                }}
                className="flex-1 h-11 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <EditOutlined className="h-4 w-4 mr-2" />
                Edit Entry
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

