'use client';

import { useState, useMemo } from 'react';
import { HiPlus, HiDownload } from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, Tag, Space, Button as AntButton, Input as AntInput, Drawer } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, DownloadOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
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

export default function RecordIncomePage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<IncomeEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for income entry
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    subcategory: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'mobile-money' | 'bank-transfer',
    notes: '',
  });

  // Store all income entries
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([
    { id: '1', date: '2024-03-15', category: 'Offerings', subcategory: 'Sunday Morning Service (1st)', amount: 205.00, paymentMethod: 'cash' },
    { id: '2', date: '2024-03-10', category: 'Sunday Offerings', amount: 7360.00, paymentMethod: 'cash' },
    { id: '3', date: '2024-03-12', category: 'Mid-week Services Offerings', amount: 1070.50, paymentMethod: 'mobile-money' },
    { id: '4', date: '2024-03-10', category: 'Tithes', subcategory: 'Member-linked', amount: 254.80, paymentMethod: 'bank-transfer' },
    { id: '5', date: '2024-03-10', category: 'Tithes', subcategory: 'Anonymous', amount: 7798.08, paymentMethod: 'cash' },
    { id: '6', date: '2024-03-14', category: 'Special Thanksgiving Offerings', amount: 770.00, paymentMethod: 'cash' },
    { id: '7', date: '2024-03-08', category: 'Donations', subcategory: 'One-off donations', amount: 325.00, paymentMethod: 'bank-transfer' },
    { id: '8', date: '2024-03-09', category: 'Donations', subcategory: 'Welfare donations', amount: 350.00, paymentMethod: 'mobile-money' },
    { id: '9', date: '2024-03-11', category: 'Donations', subcategory: 'Project donations', amount: 454.00, paymentMethod: 'cash' },
    { id: '10', date: '2024-03-13', category: 'Special Society Funds', subcategory: 'Welfare Fund', amount: 410.00, paymentMethod: 'cash' },
    { id: '11', date: '2024-03-07', category: 'Special Society Funds', subcategory: 'Building Fund', amount: 148.20, paymentMethod: 'bank-transfer' },
    { id: '12', date: '2024-03-06', category: 'Special Society Funds', subcategory: 'Mission / Evangelism Fund', amount: 212.50, paymentMethod: 'mobile-money' },
    { id: '13', date: '2024-03-05', category: 'Harvest / Anniversary Offerings', amount: 1800.00, paymentMethod: 'cash' },
  ]);

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
    };
    return subcats[category] || [];
  };

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
      render: (_, record: IncomeEntry) => (
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
            Record Income
          </h1>
          <p className="text-gray-600 mt-1">Record and manage income entries</p>
        </div>
        {(hasPermission('record_income') || isSuperAdmin) && (
          <Button onClick={() => setShowIncomeModal(true)} className="shadow-lg">
            <HiPlus className="h-4 w-4 mr-2" />
            Record Income Entry
          </Button>
        )}
      </div>

      {/* Income Entries Table */}
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

      {/* Record Income Entry Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <HiPlus className="h-5 w-5 text-green-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Record Income Entry</span>
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

      {/* Income Entry Details Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined className="h-5 w-5 text-green-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Income Entry Details</span>
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

            {/* Amount */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</p>
              <p className="text-2xl font-bold text-green-600">
                GHC {selectedEntry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment Method</p>
              <div>
                {selectedEntry.paymentMethod === 'cash' && (
                  <Tag color="green" className="text-sm py-1 px-3">Cash</Tag>
                )}
                {selectedEntry.paymentMethod === 'mobile-money' && (
                  <Tag color="blue" className="text-sm py-1 px-3">Mobile Money</Tag>
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

