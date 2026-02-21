'use client';

import { useState } from 'react';
import { HiPlus, HiPrinter } from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, Space, Button as AntButton, Input as AntInput, AutoComplete, Drawer } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';

interface Tithe {
  id: string;
  memberId: number;
  memberName: string;
  amount: number;
  month: string;
  date: string;
  receiptNo: string;
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

export default function TithesPage() {
  const { hasRole } = useAuth();
  const [showTitheModal, setShowTitheModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTithe, setSelectedTithe] = useState<Tithe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [tithes, setTithes] = useState<Tithe[]>([]);
  const [titheForm, setTitheForm] = useState({
    memberId: null as number | null,
    memberName: '',
    amount: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    date: new Date().toISOString().slice(0, 10),
  });
  const [memberSearchValue, setMemberSearchValue] = useState('');
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate receipt number
  const generateReceiptNo = (): string => {
    const year = new Date().getFullYear();
    const count = tithes.length + 1;
    return `TITHE-${year}-${String(count).padStart(4, '0')}`;
  };

  // Handle tithe submission
  const handleAddTithe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titheForm.memberId || !titheForm.memberName || !titheForm.amount || !titheForm.month || !titheForm.date) {
      return;
    }

    const newTithe: Tithe = {
      id: Date.now().toString(),
      memberId: titheForm.memberId,
      memberName: titheForm.memberName,
      amount: parseFloat(titheForm.amount) || 0,
      month: titheForm.month,
      date: titheForm.date,
      receiptNo: generateReceiptNo(),
    };

    setTithes([...tithes, newTithe]);
    setTitheForm({
      memberId: null,
      memberName: '',
      amount: '',
      month: new Date().toLocaleString('default', { month: 'long' }),
      date: new Date().toISOString().slice(0, 10),
    });
    setMemberSearchValue('');
    setShowTitheModal(false);
    
    // Show receipt
    setSelectedTithe(newTithe);
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

  // Tithe table columns
  const titheColumns: ColumnsType<Tithe> = [
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
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      sorter: (a, b) => months.indexOf(a.month) - months.indexOf(b.month),
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
      render: (_, record: Tithe) => (
        <Space>
          <AntButton 
            type="link" 
            icon={<PrinterOutlined />} 
            size="small"
            onClick={() => {
              setSelectedTithe(record);
              setShowReceiptModal(true);
            }}
          >
            Print Receipt
          </AntButton>
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
            Tithes
          </h1>
          <p className="text-gray-600 mt-1">Record and manage tithe contributions</p>
        </div>
        {!hasRole('head_pastor') && (
          <Button onClick={() => setShowTitheModal(true)} className="shadow-lg">
            <HiPlus className="h-4 w-4 mr-2" />
            Record Tithe
          </Button>
        )}
      </div>

      {/* Tithes Table */}
      <Card className="relative overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-64 h-64"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 50 Q25 30, 50 50 T100 50\' stroke=\'%2316a34a\' stroke-width=\'1.5\' fill=\'none\' opacity=\'0.12\'/%3E%3C/svg%3E")',
          }}
        />
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Tithes Records</CardTitle>
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
            columns={titheColumns}
            dataSource={tithes.filter(tithe => 
              !searchTerm || tithe.memberName.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} tithes`,
            }}
          />
        </CardContent>
      </Card>

      {/* Tithe Entry Drawer */}
      <Drawer
        title="Record Tithe"
        open={showTitheModal}
        onClose={() => {
          setShowTitheModal(false);
          setTitheForm({
            memberId: null,
            memberName: '',
            amount: '',
            month: new Date().toLocaleString('default', { month: 'long' }),
            date: new Date().toISOString().slice(0, 10),
          });
          setMemberSearchValue('');
        }}
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 400}
        placement="right"
      >
        <form onSubmit={handleAddTithe} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Member Name *</label>
            <AutoComplete
              options={memberOptions}
              value={memberSearchValue}
              onChange={(value) => {
                setMemberSearchValue(value);
                const selected = sampleMembers.find(m => m.name === value);
                if (selected) {
                  setTitheForm({
                    ...titheForm,
                    memberId: selected.id,
                    memberName: selected.name,
                  });
                } else {
                  setTitheForm({
                    ...titheForm,
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
            {titheForm.memberId && (
              <p className="text-xs text-green-600 mt-1">Selected: {titheForm.memberName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (GHC) *</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={titheForm.amount}
              onChange={(e) => setTitheForm({ ...titheForm, amount: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Month Paying For *</label>
              <select
                value={titheForm.month}
                onChange={(e) => setTitheForm({ ...titheForm, month: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
              <Input
                type="date"
                value={titheForm.date}
                onChange={(e) => setTitheForm({ ...titheForm, date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => {
              setShowTitheModal(false);
              setTitheForm({
                memberId: null,
                memberName: '',
                amount: '',
                month: new Date().toLocaleString('default', { month: 'long' }),
                date: new Date().toISOString().slice(0, 10),
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

      {/* Receipt Modal */}
      <Drawer
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedTithe(null);
        }}
        title="Tithe Receipt"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      >
        {selectedTithe && (
          <div className="p-6">
            <div id="tithe-receipt" className="receipt-container bg-white max-w-xs mx-auto" style={{ fontFamily: 'monospace', width: '80mm', padding: '10px' }}>
              {/* Header */}
              <div className="text-center border-b-2 border-black pb-2 mb-3">
                <h2 className="text-base font-bold mb-1" style={{ fontSize: '14px', lineHeight: '1.2' }}>METHODIST CHURCH</h2>
                <p className="text-xs font-bold uppercase" style={{ fontSize: '11px' }}>TITHE RECEIPT</p>
              </div>

              {/* Receipt Number and Date */}
              <div className="mb-3" style={{ fontSize: '10px' }}>
                <div className="flex justify-between mb-1">
                  <span>Receipt No:</span>
                  <span className="font-bold">{selectedTithe.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(selectedTithe.date).toLocaleDateString('en-GB', { 
                    day: '2-digit',
                    month: 'short', 
                    year: 'numeric'
                  })}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-dashed border-black mb-3"></div>

              {/* Member Details */}
              <div className="mb-3" style={{ fontSize: '10px' }}>
                <div className="mb-2">
                  <div className="font-bold mb-1" style={{ fontSize: '11px' }}>Member Name:</div>
                  <div>{selectedTithe.memberName}</div>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Month:</span>
                  <span className="font-semibold">{selectedTithe.month}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Date:</span>
                  <span>{new Date(selectedTithe.date).toLocaleDateString('en-GB', { 
                    day: '2-digit',
                    month: 'short', 
                    year: 'numeric'
                  })}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-dashed border-black mb-3"></div>

              {/* Amount Section */}
              <div className="mb-3 text-center">
                <div className="mb-1" style={{ fontSize: '10px' }}>Amount Paid:</div>
                <div className="font-bold mb-2" style={{ fontSize: '18px' }}>GHC {selectedTithe.amount.toFixed(2)}</div>
                <div className="text-xs italic" style={{ fontSize: '9px', lineHeight: '1.3' }}>
                  {convertNumberToWords(selectedTithe.amount)} Only
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-dashed border-black mb-3"></div>

              {/* Payment Details */}
              <div className="mb-3" style={{ fontSize: '10px' }}>
                <div className="flex justify-between mb-1">
                  <span>Payment Type:</span>
                  <span className="font-semibold">TITHE</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold">PAID</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b-2 border-black mb-3"></div>

              {/* Signatures */}
              <div className="mb-3" style={{ fontSize: '9px' }}>
                <div className="mb-4">
                  <div className="mb-2">Received By:</div>
                  <div className="border-t border-black pt-1 mt-6">
                    <div className="font-semibold">Authorized Signature</div>
                    <div>Parish Treasurer</div>
                  </div>
                </div>
                <div>
                  <div className="mb-2">Member Signature:</div>
                  <div className="border-t border-black pt-1 mt-6">
                    <div>{selectedTithe.memberName}</div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-dashed border-black mb-3"></div>

              {/* Footer Note */}
              <div className="text-center" style={{ fontSize: '8px', lineHeight: '1.4' }}>
                <div className="mb-1">
                  This is an official receipt.
                </div>
                <div className="mb-1">
                  Please keep for your records.
                </div>
                <div className="mt-2">
                  Thank you for your contribution.
                </div>
              </div>

              {/* Bottom spacing for thermal printer */}
              <div className="mt-4" style={{ height: '20px' }}></div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6 no-print">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedTithe(null);
                }} 
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  const printContent = document.getElementById('tithe-receipt');
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const receiptHTML = printContent.innerHTML;
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Tithe Receipt - ${selectedTithe.receiptNo}</title>
                            <meta charset="UTF-8">
                            <style>
                              * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                              }
                              body { 
                                font-family: 'Courier New', 'Courier', monospace; 
                                padding: 5mm;
                                margin: 0;
                                background: white;
                                color: #000;
                                font-size: 10px;
                              }
                              .receipt-container {
                                width: 80mm;
                                max-width: 80mm;
                                margin: 0 auto;
                                background: white;
                                padding: 10px;
                                font-family: 'Courier New', 'Courier', monospace;
                              }
                              .no-print {
                                display: none !important;
                              }
                              @media print {
                                body { 
                                  padding: 0;
                                  margin: 0;
                                  font-size: 10px;
                                }
                                .receipt-container {
                                  width: 80mm;
                                  max-width: 80mm;
                                  margin: 0;
                                  padding: 10px;
                                  border: none;
                                  box-shadow: none;
                                }
                                .no-print {
                                  display: none !important;
                                }
                                @page { 
                                  margin: 0;
                                  size: 80mm auto;
                                }
                                * {
                                  -webkit-print-color-adjust: exact;
                                  print-color-adjust: exact;
                                  color: #000 !important;
                                  background: white !important;
                                }
                              }
                              h2 {
                                font-size: 14px;
                                font-weight: bold;
                                margin-bottom: 4px;
                                line-height: 1.2;
                              }
                              h3 {
                                font-size: 12px;
                                font-weight: 600;
                                margin-bottom: 4px;
                              }
                              .border-b-2 {
                                border-bottom: 2px solid #000;
                                padding-bottom: 8px;
                                margin-bottom: 12px;
                              }
                              .border-t-2 {
                                border-top: 2px solid #000;
                                padding-top: 8px;
                                margin-top: 12px;
                              }
                              .border-b {
                                border-bottom: 1px dashed #000;
                                padding-bottom: 6px;
                                margin-bottom: 12px;
                              }
                              .border-t {
                                border-top: 1px solid #000;
                                padding-top: 6px;
                                margin-top: 12px;
                              }
                              .font-bold {
                                font-weight: bold;
                              }
                              .font-semibold {
                                font-weight: 600;
                              }
                              .text-center {
                                text-align: center;
                              }
                              .text-right {
                                text-align: right;
                              }
                              .uppercase {
                                text-transform: uppercase;
                              }
                              .italic {
                                font-style: italic;
                              }
                              .flex {
                                display: flex;
                              }
                              .justify-between {
                                justify-content: space-between;
                              }
                              .mb-1 { margin-bottom: 4px; }
                              .mb-2 { margin-bottom: 8px; }
                              .mb-3 { margin-bottom: 12px; }
                              .mb-4 { margin-bottom: 16px; }
                              .mt-1 { margin-top: 4px; }
                              .mt-2 { margin-top: 8px; }
                              .mt-4 { margin-top: 16px; }
                              .mt-6 { margin-top: 24px; }
                              .pt-1 { padding-top: 4px; }
                              .pb-2 { padding-bottom: 8px; }
                            </style>
                          </head>
                          <body>
                            <div class="receipt-container">
                              ${receiptHTML}
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
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

