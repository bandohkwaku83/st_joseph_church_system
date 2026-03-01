"use client";

import { useState, useCallback, useMemo } from "react";
import {
  HiCheckCircle,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiUserGroup,
} from "react-icons/hi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  DatePicker,
  Row,
  Col,
  InputNumber,
  Input,
  Select,
  Button as AntButton,
  Drawer,
  Table,
  Pagination,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ManOutlined,
  WomanOutlined,
  UserOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useAuth } from "@/lib/auth-context";



interface AttendanceRecord {
  id: number;
  service: string;
  date: string;
  men: number;
  women: number;
  children: number;
  total: number;
  notes?: string;
}

const INITIAL_RECORDS: AttendanceRecord[] = [
  {
    id: 1,
    service: "Sunday Service",
    date: "2024-01-21",
    men: 32,
    women: 55,
    children: 15,
    total: 102,
    notes: "Regular service",
  },
  {
    id: 2,
    service: "Sunday Service",
    date: "2024-01-14",
    men: 30,
    women: 50,
    children: 12,
    total: 92,
    notes: "Regular service",
  },
  {
    id: 3,
    service: "Sunday Service",
    date: "2024-01-07",
    men: 28,
    women: 48,
    children: 10,
    total: 86,
  },
  {
    id: 4,
    service: "Sunday Service",
    date: "2023-12-31",
    men: 45,
    women: 65,
    children: 20,
    total: 130,
    notes: "New Year's Eve service",
  },
  {
    id: 5,
    service: "Sunday Service",
    date: "2023-12-24",
    men: 60,
    women: 80,
    children: 35,
    total: 175,
    notes: "Christmas Eve service",
  },
  {
    id: 6,
    service: "Midweek Service",
    date: "2024-01-17",
    men: 18,
    women: 28,
    children: 6,
    total: 52,
  },
  {
    id: 7,
    service: "Midweek Service",
    date: "2024-01-10",
    men: 15,
    women: 25,
    children: 5,
    total: 45,
  },
  {
    id: 8,
    service: "Midweek Service",
    date: "2024-01-03",
    men: 12,
    women: 22,
    children: 4,
    total: 38,
  },
  {
    id: 9,
    service: "Midweek Service",
    date: "2023-12-27",
    men: 10,
    women: 18,
    children: 3,
    total: 31,
  },
  {
    id: 10,
    service: "Youth Meeting",
    date: "2024-01-19",
    men: 10,
    women: 15,
    children: 18,
    total: 43,
  },
  {
    id: 11,
    service: "Youth Meeting",
    date: "2024-01-12",
    men: 8,
    women: 12,
    children: 15,
    total: 35,
  },
  {
    id: 12,
    service: "Youth Meeting",
    date: "2024-01-05",
    men: 9,
    women: 14,
    children: 16,
    total: 39,
  },
  {
    id: 13,
    service: "Daily Mass",
    date: "2024-01-20",
    men: 5,
    women: 12,
    children: 2,
    total: 19,
  },
  {
    id: 14,
    service: "Daily Mass",
    date: "2024-01-19",
    men: 6,
    women: 14,
    children: 3,
    total: 23,
  },
  {
    id: 15,
    service: "Daily Mass",
    date: "2024-01-18",
    men: 4,
    women: 10,
    children: 1,
    total: 15,
  },
  {
    id: 16,
    service: "Daily Mass",
    date: "2024-01-17",
    men: 7,
    women: 15,
    children: 4,
    total: 26,
  },
];

const SERVICES = [
  { id: "evening", name: "Evening Service" },
  { id: "1st", name: "1st Service" },
  { id: "2nd", name: "2nd Service" },
  { id: "joint", name: "Joint Service" },
];

const PATTERN_STYLES = [
  {
    background:
      "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
  },
  {
    background:
      "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2316a34a' fill-opacity='0.08'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E\")",
  },
  {
    background:
      "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30, 50 50 T100 50' stroke='%2316a34a' stroke-width='1.5' fill='none' opacity='0.12'/%3E%3C/svg%3E\")",
  },
];

export default function AttendancePage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_RECORDS);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [form] = Form.useForm();

  // Calculate totals safely
  const stats = useMemo(() => {
    const records = Array.isArray(attendanceRecords) ? attendanceRecords : [];
    return records.reduce(
      (acc, record) => ({
        men: acc.men + record.men,
        women: acc.women + record.women,
        children: acc.children + record.children,
        total: acc.total + record.total,
      }),
      { men: 0, women: 0, children: 0, total: 0 }
    );
  }, [attendanceRecords]);

  const handleRecordAttendance = useCallback(
    (values: {
      service: string;
      date: Dayjs;
      men: number;
      women: number;
      children: number;
      notes?: string;
    }) => {
      const service = SERVICES.find((s) => s.id === values.service);
      const men = Number(values.men) || 0;
      const women = Number(values.women) || 0;
      const children = Number(values.children) || 0;
      const total = men + women + children;

      const newRecord: AttendanceRecord = {
        id: Date.now(),
        service: service?.name || values.service,
        date: values.date.format("YYYY-MM-DD"),
        men,
        women,
        children,
        total,
        notes: values.notes,
      };

      setAttendanceRecords((prev) => [...(Array.isArray(prev) ? prev : []), newRecord]);
      setShowRecordModal(false);
      form.resetFields();
    },
    [form]
  );

  const handleCloseModal = useCallback(() => {
    setShowRecordModal(false);
    form.resetFields();
  }, [form]);

  // Safely sorted records (newest first)
  const sortedRecords = useMemo<AttendanceRecord[]>(() => {
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return [];
    }
    const records = [...attendanceRecords];
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceRecords]);

  // Ensure dataSource is always a valid array
  const tableData = useMemo<AttendanceRecord[]>(() => {
    if (!sortedRecords || !Array.isArray(sortedRecords)) {
      return [];
    }
    return sortedRecords;
  }, [sortedRecords]);

  const attendanceColumns: ColumnsType<AttendanceRecord> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => (
        <div className="flex items-center gap-2 text-sm text-gray-900">
          <HiOutlineCalendar className="h-4 w-4 text-gray-400" />
          {new Date(date).toLocaleDateString()}
        </div>
      ),
      sorter: (a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      },
      defaultSortOrder: "descend",
    },
    {
      title: "Service",
      dataIndex: "service",
      key: "service",
      render: (service: string) => (
        <span className="text-sm font-medium text-gray-900">{service}</span>
      ),
    },
    {
      title: "Men",
      dataIndex: "men",
      key: "men",
      align: "right",
      render: (men: number) => (
        <div className="flex items-center justify-end gap-2">
          <ManOutlined className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">{men}</span>
        </div>
      ),
      sorter: (a, b) => a.men - b.men,
    },
    {
      title: "Women",
      dataIndex: "women",
      key: "women",
      align: "right",
      render: (women: number) => (
        <div className="flex items-center justify-end gap-2">
          <WomanOutlined className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">{women}</span>
        </div>
      ),
      sorter: (a, b) => a.women - b.women,
    },
    {
      title: "Children",
      dataIndex: "children",
      key: "children",
      align: "right",
      render: (children: number) => (
        <div className="flex items-center justify-end gap-2">
          <UserOutlined className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">{children}</span>
        </div>
      ),
      sorter: (a, b) => a.children - b.children,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      align: "right",
      render: (total: number) => (
        <span className="text-sm font-bold text-green-600">{total}</span>
      ),
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes?: string) => (
        <span className="text-sm text-gray-500">{notes || "-"}</span>
      ),
    },
  ];


  return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Attendance Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Track and record attendance by category</p>
          </div>
          {(hasPermission('attendance') || isSuperAdmin) && (
            <Button
              onClick={() => {
                form.resetFields();
                setShowRecordModal(true);
              }}
              className="shadow-lg w-full sm:w-auto"
            >
              <PlusOutlined className="mr-2" />
              Record Attendance
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: PATTERN_STYLES[0].background }} />
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Men</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.men.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <ManOutlined className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: PATTERN_STYLES[1].background }} />
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Women</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.women.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <WomanOutlined className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0" style={{ backgroundImage: PATTERN_STYLES[2].background }} />
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Children</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.children.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <UserOutlined className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Attendance */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: PATTERN_STYLES[0].background }} />
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Attendance</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.total.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <HiUserGroup className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History Table */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-4 relative z-10">
            <CardTitle className="text-base font-semibold text-gray-900">
              Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 overflow-x-auto">
            <Table
              columns={attendanceColumns}
              dataSource={[]}
              rowKey={(record) => `attendance-${record.id}`}
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </CardContent>
        </Card>

        {/* Record Attendance Drawer */}
        <Drawer
          title={
            <div className="flex items-center gap-2">
              <HiOutlineUsers className="h-5 w-5 text-green-600" />
              <span className="text-lg sm:text-xl font-bold text-gray-900">Record Attendance</span>
            </div>
          }
          placement="right"
          width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
          onClose={handleCloseModal}
          open={showRecordModal}
        >
          <div className="pt-4">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleRecordAttendance}
              initialValues={{
                date: dayjs(),
                service: "1st",
                men: 0,
                women: 0,
                children: 0,
              }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="flex items-center gap-2"><HiOutlineCalendar className="text-gray-600" /> Service Type</span>}
                    name="service"
                    rules={[{ required: true, message: "Please select a service" }]}
                  >
                    <Select placeholder="Select Service" size="large">
                      {SERVICES.map((service) => (
                        <Select.Option key={service.id} value={service.id}>
                          {service.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label={<span className="flex items-center gap-2"><HiOutlineCalendar className="text-gray-600" /> Date</span>}
                    name="date"
                    rules={[{ required: true, message: "Please select a date" }]}
                  >
                    <DatePicker style={{ width: "100%" }} size="large" format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="mb-4 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                <p className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <HiOutlineUsers className="text-green-600" />
                  Attendance Count
                </p>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card className="border-2 border-gray-200 hover:border-gray-400 transition-colors">
                      <CardContent className="p-4">
                        <Form.Item
                          label={<span className="flex items-center gap-2 text-gray-700 font-semibold"><ManOutlined className="text-gray-600 text-lg" /> Men</span>}
                          name="men"
                          rules={[{ required: true, message: "Please enter number of men" }]}
                          className="mb-0"
                        >
                          <InputNumber min={0} style={{ width: "100%" }} size="large" placeholder="0" />
                        </Form.Item>
                      </CardContent>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="border-2 border-gray-200 hover:border-gray-400 transition-colors">
                      <CardContent className="p-4">
                        <Form.Item
                          label={<span className="flex items-center gap-2 text-gray-700 font-semibold"><WomanOutlined className="text-gray-600 text-lg" /> Women</span>}
                          name="women"
                          rules={[{ required: true, message: "Please enter number of women" }]}
                          className="mb-0"
                        >
                          <InputNumber min={0} style={{ width: "100%" }} size="large" placeholder="0" />
                        </Form.Item>
                      </CardContent>
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card className="border-2 border-gray-200 hover:border-gray-400 transition-colors">
                      <CardContent className="p-4">
                        <Form.Item
                          label={<span className="flex items-center gap-2 text-gray-700 font-semibold"><UserOutlined className="text-gray-600 text-lg" /> Children</span>}
                          name="children"
                          rules={[{ required: true, message: "Please enter number of children" }]}
                          className="mb-0"
                        >
                          <InputNumber min={0} style={{ width: "100%" }} size="large" placeholder="0" />
                        </Form.Item>
                      </CardContent>
                    </Card>
                  </Col>
                </Row>

                <Form.Item shouldUpdate>
                  {({ getFieldValue }) => {
                    const men = Number(getFieldValue("men")) || 0;
                    const women = Number(getFieldValue("women")) || 0;
                    const children = Number(getFieldValue("children")) || 0;
                    const total = men + women + children;
                    return (
                      <div className="mt-6 pt-4 border-t-2 border-gray-300">
                        <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
                          <span className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <HiCheckCircle className="text-green-600" />
                            Total Attendance:
                          </span>
                          <span className="text-3xl font-bold text-green-700">{total}</span>
                        </div>
                      </div>
                    );
                  }}
                </Form.Item>
              </div>

              <Form.Item label={<span className="text-gray-700 font-medium">Notes (Optional)</span>} name="notes">
                <Input.TextArea rows={3} placeholder="Add any additional notes..." className="rounded-lg" />
              </Form.Item>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1 w-full sm:w-auto">
                  Cancel
                </Button>
                <AntButton
                  type="primary"
                  htmlType="submit"
                  className="flex-1 w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  size="large"
                  icon={<PlusOutlined />}
                >
                  Record Attendance
                </AntButton>
              </div>
            </Form>
          </div>
        </Drawer>
      </div>
  );
}