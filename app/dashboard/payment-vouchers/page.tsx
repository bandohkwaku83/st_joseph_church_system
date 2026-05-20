'use client';

import { useState } from 'react';
import { HiPlus } from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, Tag, Space, Button as AntButton, Drawer } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { TABLE_SCROLL, useDrawerWidth } from '@/lib/responsive';

interface PaymentVoucher {
  id: number;
  voucherNo: string;
  date: string;
  payee: string;
  amount: number;
  purpose: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function PaymentVouchersPage() {
  const drawerWidthMd = useDrawerWidth(600);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([
    { id: 1, voucherNo: 'PV-001', date: '2024-01-14', payee: 'Seth Opoku', amount: 60.00, purpose: 'Divine worship (singing ministry)', status: 'Approved' },
    { id: 2, voucherNo: 'PV-002', date: '2024-01-13', payee: 'John Doe', amount: 150.00, purpose: 'Equipment maintenance', status: 'Pending' },
  ]);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Payment Vouchers
          </h1>
          <p className="text-gray-600 mt-1">Create and manage payment vouchers</p>
        </div>
        <Button onClick={() => setShowVoucherModal(true)} className="shadow-lg w-full sm:w-auto">
          <HiPlus className="h-4 w-4 mr-2" />
          Create Voucher
        </Button>
      </div>

      {/* Payment Vouchers Table */}
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
            scroll={TABLE_SCROLL}
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

      {/* Payment Voucher Drawer */}
      <Drawer
        open={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        title="Payment Voucher"
        placement="right"
        width={drawerWidthMd}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
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
    </div>
  );
}

