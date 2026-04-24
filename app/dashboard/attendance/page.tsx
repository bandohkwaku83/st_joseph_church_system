"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
} from "antd";

import {
  ManOutlined,
  WomanOutlined,
  UserOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { apiRequest } from "@/lib/api";



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

// Backend attendance interface to match API response
interface BackendAttendance {
  id: number;
  service_type: string;
  men: number;
  women: number;
  children: number;
  total: number;
  additional_notes?: string;
  // Note: date field is missing from backend response
}


const SERVICES = [
  { id: "evening_service", name: "Evening Service" },
  { id: "first_service", name: "1st Service" },
  { id: "second_service", name: "2nd Service" },
  { id: "joint_service", name: "Joint Service" },
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
  const { showToast } = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [form] = Form.useForm();

  // Convert backend attendance to frontend format
  const mapBackendAttendance = (backendAttendance: BackendAttendance): AttendanceRecord => {
    // Map service type to display name
    const serviceMap: Record<string, string> = {
      'evening_service': 'Evening Service',
      'first_service': '1st Service',
      'second_service': '2nd Service',
      'joint_service': 'Joint Service',
    };

    return {
      id: backendAttendance.id,
      service: serviceMap[backendAttendance.service_type] || backendAttendance.service_type,
      date: new Date().toISOString().split('T')[0], // Use current date since backend doesn't provide it
      men: backendAttendance.men,
      women: backendAttendance.women,
      children: backendAttendance.children,
      total: backendAttendance.total, // Use backend total instead of calculating
      notes: backendAttendance.additional_notes,
    };
  };

  // Fetch attendance records from API
  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await apiRequest<{ attendances: BackendAttendance[] }>('attendances', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.attendances && Array.isArray(response.data.attendances)) {
        const mappedAttendance = response.data.attendances.map(mapBackendAttendance);
        setAttendanceRecords(mappedAttendance);
      } else if (response.error) {
        console.error('Failed to fetch attendance records:', response.error);
        setError(response.error.message || 'Failed to fetch attendance records');
      } else {
        console.warn('Unexpected API response format:', response);
        setAttendanceRecords([]); // Set empty array instead of error
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setError('Network error occurred while fetching attendance records');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance records on component mount
  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

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
    async (values: {
      service: string;
      date: Dayjs;
      men: number;
      women: number;
      children: number;
      notes?: string;
    }) => {
      try {
        setSubmitting(true);

        // Prepare the API payload according to the backend structure
        const attendancePayload = {
          attendance: {
            service_type: values.service,
            date: values.date.format("YYYY-MM-DD"),
            men: Number(values.men) || 0,
            women: Number(values.women) || 0,
            children: Number(values.children) || 0,
            additional_notes: values.notes || '',
          }
        };

        // Get authentication token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await apiRequest('attendances', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attendancePayload),
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to record attendance');
        }

        // Success - refresh the attendance records
        await fetchAttendanceRecords();

        // Close modal and reset form
        setShowRecordModal(false);
        form.resetFields();

        // Show success message
        showToast('Attendance recorded successfully!', 'success');

      } catch (error) {
        console.error('Error recording attendance:', error);
        showToast(
          error instanceof Error ? error.message : 'Failed to record attendance',
          'error'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [form, showToast]
  );

  const handleCloseModal = useCallback(() => {
    setShowRecordModal(false);
    form.resetFields();
  }, [form]);





  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Attendance Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Track and record attendance by category</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading attendance records...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Attendance Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Track and record attendance by category</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineUsers className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to load attendance records</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchAttendanceRecords} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex gap-2">
            <Button
              onClick={fetchAttendanceRecords}
              variant="outline"
              disabled={loading}
            >
              Refresh
            </Button>
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
              Attendance History ({attendanceRecords.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 overflow-x-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Men
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Women
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Children
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <HiOutlineCalendar className="h-4 w-4 text-gray-500" />
                            {dayjs(record.date).format('DD MMM YYYY')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.service}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.men}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.women}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.children}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          {record.total}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {record.notes || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
                service: "first_service",
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
                  loading={submitting}
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