'use client';

import { useState } from 'react';
import {
  HiOutlineChatAlt,
  HiOutlinePhone,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
  HiOutlineCalendar,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, Tag, Form, Select, DatePicker, TimePicker, Space, Input, message as antMessage, Drawer } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, FilterOutlined, DownloadOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons';

interface SMSMessage {
  id: number;
  recipient: string;
  recipientType: 'individual' | 'group' | 'all';
  phoneNumber?: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  characterCount: number;
  cost?: number;
}

interface ScheduledMessage {
  id: number;
  recipient: string;
  message: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'sent' | 'cancelled';
}

export default function CommunicationPage() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  const [scheduleForm] = Form.useForm();

  // Sample data - Replace with actual data from your API
  const recentMessages: SMSMessage[] = [
    {
      id: 1,
      recipient: 'All Members',
      recipientType: 'all',
      message: 'Sunday Service Reminder: Join us this Sunday at 9:00 AM. God bless!',
      sentAt: '2024-01-14 08:00',
      status: 'delivered',
      characterCount: 78,
      cost: 0.05,
    },
    {
      id: 2,
      recipient: 'Choir Members',
      recipientType: 'group',
      message: 'Rehearsal scheduled for Friday at 7:00 PM. Please confirm attendance.',
      sentAt: '2024-01-13 14:30',
      status: 'sent',
      characterCount: 85,
      cost: 0.12,
    },
    {
      id: 3,
      recipient: 'John Doe',
      recipientType: 'individual',
      phoneNumber: '+1 234-567-8900',
      message: 'Happy Birthday! May God continue to bless you abundantly.',
      sentAt: '2024-01-12 09:00',
      status: 'delivered',
      characterCount: 62,
      cost: 0.05,
    },
    {
      id: 4,
      recipient: 'Youth Group',
      recipientType: 'group',
      message: 'Youth meeting this Saturday at 3:00 PM. Bring your friends!',
      sentAt: '2024-01-10 10:00',
      status: 'delivered',
      characterCount: 68,
      cost: 0.15,
    },
    {
      id: 5,
      recipient: 'Sarah Williams',
      recipientType: 'individual',
      phoneNumber: '+1 234-567-8903',
      message: 'Thank you for your generous contribution. God bless you!',
      sentAt: '2024-01-09 15:20',
      status: 'failed',
      characterCount: 65,
      cost: 0.05,
    },
  ];

  const scheduledMessages: ScheduledMessage[] = [
    {
      id: 1,
      recipient: 'All Members',
      message: 'Weekly Bible Study Reminder',
      scheduledDate: '2024-01-18',
      scheduledTime: '08:00',
      status: 'scheduled',
    },
    {
      id: 2,
      recipient: 'Women\'s Fellowship',
      message: 'Monthly meeting reminder',
      scheduledDate: '2024-01-20',
      scheduledTime: '10:00',
      status: 'scheduled',
    },
  ];

  const filteredMessages = recentMessages.filter(
    (msg) =>
      msg.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalSent = recentMessages.length;
  const delivered = recentMessages.filter((m) => m.status === 'delivered').length;
  const failed = recentMessages.filter((m) => m.status === 'failed').length;
  const scheduled = scheduledMessages.filter((m) => m.status === 'scheduled').length;
  const totalCost = recentMessages.reduce((sum, m) => sum + (m.cost || 0), 0);

  // Pattern SVG definitions (matching dashboard style)
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
    {
      background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2316a34a\' fill-opacity=\'0.12\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'3\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    },
  ];

  const stats = [
    { label: 'Total SMS Sent', value: totalSent.toLocaleString(), icon: HiOutlineChatAlt, trend: '+12%', trendUp: true },
    { label: 'Delivered', value: delivered.toLocaleString(), icon: HiOutlineCheckCircle, trend: `${((delivered / totalSent) * 100).toFixed(1)}%`, trendUp: true },
    { label: 'Failed', value: failed.toLocaleString(), icon: HiOutlineXCircle, trend: `${((failed / totalSent) * 100).toFixed(1)}%`, trendUp: false },
    { label: 'Scheduled', value: scheduled.toLocaleString(), icon: HiOutlineClock, trend: 'Active', trendUp: null },
    { label: 'Total Cost', value: `$${totalCost.toFixed(2)}`, icon: HiOutlinePhone, trend: 'This month', trendUp: null },
  ];

  // Handle SMS sending
  const handleSendSMS = async (values: any) => {
    try {
      // TODO: Integrate with your third-party SMS service here
      // Example structure:
      // const response = await fetch('/api/sms/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     recipients: values.recipients,
      //     message: values.message,
      //     recipientType: values.recipientType,
      //   }),
      // });
      // const result = await response.json();

      console.log('Sending SMS:', values);
      antMessage.success('SMS sent successfully!');
      form.resetFields();
      setShowSendModal(false);
    } catch (error) {
      console.error('Error sending SMS:', error);
      antMessage.error('Failed to send SMS. Please try again.');
    }
  };

  // Handle scheduled SMS
  const handleScheduleSMS = async (values: any) => {
    try {
      // TODO: Integrate with your third-party SMS service for scheduling
      // Example structure:
      // const response = await fetch('/api/sms/schedule', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     recipients: values.recipients,
      //     message: values.message,
      //     scheduledDate: values.scheduledDate,
      //     scheduledTime: values.scheduledTime,
      //   }),
      // });

      console.log('Scheduling SMS:', values);
      antMessage.success('SMS scheduled successfully!');
      scheduleForm.resetFields();
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Error scheduling SMS:', error);
      antMessage.error('Failed to schedule SMS. Please try again.');
    }
  };

  // Table columns
  const columns: ColumnsType<SMSMessage> = [
    {
      title: 'Recipient',
      key: 'recipient',
      render: (_, record: SMSMessage) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{record.recipient}</div>
          {record.phoneNumber && (
            <div className="text-xs text-gray-500">{record.phoneNumber}</div>
          )}
          <Tag color={record.recipientType === 'all' ? 'blue' : record.recipientType === 'group' ? 'green' : 'default'}>
            {record.recipientType}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Message',
      key: 'message',
      render: (_, record: SMSMessage) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-2">{record.message}</p>
          <p className="text-xs text-gray-500 mt-1">{record.characterCount} characters</p>
        </div>
      ),
    },
    {
      title: 'Sent At',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (text: string) => (
        <div>
          <div className="text-sm text-gray-900">{new Date(text).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{new Date(text).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          sent: { color: 'processing', icon: <HiOutlineClock className="h-3 w-3" />, text: 'Sent' },
          delivered: { color: 'success', icon: <HiOutlineCheckCircle className="h-3 w-3" />, text: 'Delivered' },
          failed: { color: 'error', icon: <HiOutlineXCircle className="h-3 w-3" />, text: 'Failed' },
          pending: { color: 'warning', icon: <HiOutlineExclamationCircle className="h-3 w-3" />, text: 'Pending' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
        return (
          <Tag color={config.color}>
            <span className="flex items-center gap-1.5">
              {config.icon}
              {config.text}
            </span>
          </Tag>
        );
      },
    },
    {
      title: 'Cost',
      key: 'cost',
      render: (_, record: SMSMessage) => (
        <span className="text-sm text-gray-900">${record.cost?.toFixed(2) || '0.00'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button variant="ghost" size="sm">
            <EyeOutlined />
          </Button>
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
            SMS Communication
          </h1>
          <p className="text-gray-600 mt-1">Send and manage SMS messages to parish members</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
            <HiOutlineCalendar className="h-4 w-4 mr-2" />
            Schedule SMS
          </Button>
          <Button onClick={() => setShowSendModal(true)} className="shadow-lg">
            <SendOutlined className="mr-2" />
            Send SMS
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
                    <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                    {stat.trend && (
                      <div className="flex items-center gap-1 mt-1">
                        {stat.trendUp === true && <HiOutlineArrowUp className="h-3 w-3 text-green-600" />}
                        {stat.trendUp === false && <HiOutlineArrowDown className="h-3 w-3 text-red-600" />}
                        <p
                          className={`text-xs ${
                            stat.trendUp === true
                              ? 'text-green-600'
                              : stat.trendUp === false
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {stat.trend}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowSendModal(true)}>
          <CardContent className="p-6">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <HiOutlineChatAlt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Send SMS</h3>
                <p className="text-sm text-gray-600">Send message to members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowScheduleModal(true)}>
          <CardContent className="p-6">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <HiOutlineCalendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
                <h3 className="font-semibold text-gray-900">Schedule SMS</h3>
                <p className="text-sm text-gray-600">Schedule for later</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Messages */}
      {scheduledMessages.length > 0 && (
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Scheduled Messages</CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
        </div>
          </CardHeader>
          <CardContent className="relative z-10">
        <div className="space-y-3">
              {scheduledMessages.map((scheduled) => (
            <div
                  key={scheduled.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <HiOutlineClock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                      <p className="font-medium text-gray-900">{scheduled.recipient}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{scheduled.message}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                      {new Date(scheduled.scheduledDate).toLocaleDateString()} at {scheduled.scheduledTime}
                </p>
                    <Tag color="processing" className="mt-1">
                      {scheduled.status}
                    </Tag>
              </div>
            </div>
          ))}
        </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Messages Table */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-base font-semibold text-gray-900">Recent Messages</CardTitle>
            <Space>
              <Input
                placeholder="Search messages..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 250 }}
              />
              <Button variant="outline" size="sm">
                <FilterOutlined className="mr-2" />
              Filter
              </Button>
              <Button variant="outline" size="sm">
                <DownloadOutlined className="mr-2" />
              Export
              </Button>
            </Space>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <Table
            columns={columns}
            dataSource={filteredMessages}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} messages`,
            }}
          />
        </CardContent>
      </Card>

      {/* Emergency Broadcast */}
      <Card className="bg-red-50 border-2 border-red-200 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23dc2626\' fill-opacity=\'1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
              <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                <HiOutlineExclamationCircle className="h-5 w-5" />
                Emergency Broadcast
              </h3>
            <p className="text-sm text-red-700 mt-1">
                Send urgent SMS message to all members immediately
            </p>
          </div>
            <Button
              variant="destructive"
              onClick={() => {
                setShowSendModal(true);
                // Pre-fill form with emergency settings
                form.setFieldsValue({
                  recipientType: 'all',
                  recipients: 'all',
                });
              }}
            >
            Send Emergency Alert
            </Button>
        </div>
        </CardContent>
      </Card>

      {/* Send SMS Drawer */}
      <Drawer
        open={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          form.resetFields();
        }}
        title="Send SMS"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      >
        <div className="p-4 sm:p-6">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSendSMS}
            initialValues={{
              recipientType: 'all',
            }}
          >
            <Form.Item
              label="Recipient Type"
              name="recipientType"
              rules={[{ required: true, message: 'Please select recipient type' }]}
            >
              <Select size="large">
                <Select.Option value="all">All Members</Select.Option>
                <Select.Option value="group">Group/Department</Select.Option>
                <Select.Option value="individual">Individual Member</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.recipientType !== currentValues.recipientType}
            >
              {({ getFieldValue }) => {
                const recipientType = getFieldValue('recipientType');
                if (recipientType === 'group') {
                  return (
                    <Form.Item
                      label="Select Group/Department"
                      name="recipients"
                      rules={[{ required: true, message: 'Please select a group' }]}
                    >
                      <Select size="large" placeholder="Select group">
                        <Select.Option value="choir">Choir</Select.Option>
                        <Select.Option value="ushers">Ushers</Select.Option>
                        <Select.Option value="youth">Youth</Select.Option>
                        <Select.Option value="mens-fellowship">Men's Fellowship</Select.Option>
                        <Select.Option value="womens-fellowship">Women's Fellowship</Select.Option>
                        <Select.Option value="children">Children's Ministry</Select.Option>
                      </Select>
                    </Form.Item>
                  );
                }
                if (recipientType === 'individual') {
                  return (
                    <Form.Item
                      label="Select Member"
                      name="recipients"
                      rules={[{ required: true, message: 'Please select a member' }]}
                    >
                      <Select
                        size="large"
                        placeholder="Search and select member"
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={[
                          { value: '1', label: 'John Doe (+1 234-567-8900)' },
                          { value: '2', label: 'Jane Smith (+1 234-567-8901)' },
                          { value: '3', label: 'Michael Johnson (+1 234-567-8902)' },
                        ]}
                      />
                    </Form.Item>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Form.Item
              label="Message"
              name="message"
              rules={[
                { required: true, message: 'Please enter a message' },
                { max: 160, message: 'Message must be 160 characters or less for single SMS' },
              ]}
            >
              <Input.TextArea
                rows={6}
                placeholder="Enter your SMS message (max 160 characters for single SMS)..."
                showCount
                maxLength={160}
              />
            </Form.Item>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSendModal(false);
                  form.resetFields();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                <SendOutlined className="mr-2" />
                Send SMS
              </Button>
            </div>
          </Form>
        </div>
      </Drawer>

      {/* Schedule SMS Drawer */}
      <Drawer
        open={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          scheduleForm.resetFields();
        }}
        title="Schedule SMS"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
      >
        <div className="p-4 sm:p-6">
          <Form
            form={scheduleForm}
            layout="vertical"
            onFinish={handleScheduleSMS}
            initialValues={{
              recipientType: 'all',
            }}
          >
            <Form.Item
              label="Recipient Type"
              name="recipientType"
              rules={[{ required: true, message: 'Please select recipient type' }]}
            >
              <Select size="large">
                <Select.Option value="all">All Members</Select.Option>
                <Select.Option value="group">Group/Department</Select.Option>
                <Select.Option value="individual">Individual Member</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.recipientType !== currentValues.recipientType}
            >
              {({ getFieldValue }) => {
                const recipientType = getFieldValue('recipientType');
                if (recipientType === 'group') {
                  return (
                    <Form.Item
                      label="Select Group/Department"
                      name="recipients"
                      rules={[{ required: true, message: 'Please select a group' }]}
                    >
                      <Select size="large" placeholder="Select group">
                        <Select.Option value="choir">Choir</Select.Option>
                        <Select.Option value="ushers">Ushers</Select.Option>
                        <Select.Option value="youth">Youth</Select.Option>
                        <Select.Option value="mens-fellowship">Men's Fellowship</Select.Option>
                        <Select.Option value="womens-fellowship">Women's Fellowship</Select.Option>
                        <Select.Option value="children">Children's Ministry</Select.Option>
                      </Select>
                    </Form.Item>
                  );
                }
                if (recipientType === 'individual') {
                  return (
                    <Form.Item
                      label="Select Member"
                      name="recipients"
                      rules={[{ required: true, message: 'Please select a member' }]}
                    >
                      <Select
                        size="large"
                        placeholder="Search and select member"
                        showSearch
                        options={[
                          { value: '1', label: 'John Doe (+1 234-567-8900)' },
                          { value: '2', label: 'Jane Smith (+1 234-567-8901)' },
                          { value: '3', label: 'Michael Johnson (+1 234-567-8902)' },
                        ]}
                      />
                    </Form.Item>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Form.Item
              label="Message"
              name="message"
              rules={[
                { required: true, message: 'Please enter a message' },
                { max: 160, message: 'Message must be 160 characters or less for single SMS' },
              ]}
            >
              <Input.TextArea
                  rows={6}
                placeholder="Enter your SMS message (max 160 characters for single SMS)..."
                showCount
                maxLength={160}
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Scheduled Date"
                name="scheduledDate"
                rules={[{ required: true, message: 'Please select a date' }]}
              >
                <DatePicker style={{ width: '100%' }} size="large" format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item
                label="Scheduled Time"
                name="scheduledTime"
                rules={[{ required: true, message: 'Please select a time' }]}
              >
                <TimePicker style={{ width: '100%' }} size="large" format="HH:mm" />
              </Form.Item>
              </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                  type="button"
                variant="outline"
                onClick={() => {
                  setShowScheduleModal(false);
                  scheduleForm.resetFields();
                }}
                className="flex-1"
                >
                  Cancel
              </Button>
              <Button type="submit" className="flex-1">
                <HiOutlineCalendar className="mr-2 h-4 w-4" />
                Schedule SMS
              </Button>
              </div>
          </Form>
        </div>
      </Drawer>
    </div>
  );
}
