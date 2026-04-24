'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Table, Tag, Form, Select, DatePicker, TimePicker, Space, Input, Drawer } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, FilterOutlined, DownloadOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { apiRequest } from '@/lib/api';

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
  memberId?: number;
}

// Backend SMS interface to match API response
interface BackendSMS {
  id: number;
  message: string;
  status: string;
  inserted_at: string;
  updated_at: string;
  member_id: number;
  member_name?: string; // Add optional member_name field
}

interface ScheduledMessage {
  id: number;
  recipient: string;
  message: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'sent' | 'cancelled';
}

// Backend scheduled SMS interface to match API response
interface BackendScheduledSMS {
  id: number;
  message: string;
  status: string;
  inserted_at: string;
  updated_at: string;
  member_id: number;
  organisation_id: number | null;
  failed_sends: number;
  schedule_time: string;
  successful_sends: number;
  total_recipients: number;
  scheduled_sms_message_id: number;
  error_message: string | null;
  member_name: string;
  sms_status: string;
  member_mobile: string;
  recipient_type: string;
  organisation_name: string | null;
  organisation_description: string | null;
  scheduled_for_organisation: string | null;
  member_organisation: string | null;
  recipient_context: string;
}

export default function CommunicationPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [showSendModal, setShowSendModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [schedulingMessage, setSchedulingMessage] = useState(false);
  const [refreshingDeliveryStatus, setRefreshingDeliveryStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  
  // API integration state
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format member names for dropdowns
  const formatMemberOption = (member: any) => {
    const firstName = member.other_names || '';
    const lastName = member.surname || '';
    const phone = member.mobile_number || 'No phone';
    const fullName = `${firstName} ${lastName}`.trim() || `Member ${member.id}`;
    
    return {
      value: member.id.toString(),
      label: `${fullName} (${phone})`
    };
  };

  // Convert backend SMS to frontend format
  const mapBackendSMS = useCallback((backendSMS: BackendSMS): SMSMessage => {
    // Use member_name from API if available, otherwise look up in members array
    let memberName = 'Unknown Member';
    let phoneNumber: string | undefined;
    
    if (backendSMS.member_name) {
      // Use member name from API response
      memberName = backendSMS.member_name;
    } else {
      // Fallback to looking up in members array using correct field names
      const member = members.find(m => m.id === backendSMS.member_id);
      if (member && member.other_names && member.surname) {
        memberName = `${member.other_names} ${member.surname}`;
        phoneNumber = member.mobile_number;
      } else {
        memberName = `Member ${backendSMS.member_id}`;
      }
    }
    
    return {
      id: backendSMS.id,
      recipient: memberName,
      recipientType: 'individual',
      phoneNumber: phoneNumber,
      message: backendSMS.message,
      sentAt: backendSMS.inserted_at,
      status: backendSMS.status as 'sent' | 'delivered' | 'failed' | 'pending',
      characterCount: backendSMS.message.length,
      cost: 0.05, // Default cost - could be calculated based on message length
      memberId: backendSMS.member_id,
    };
  }, [members]);

  // Convert backend scheduled SMS to frontend format
  const mapBackendScheduledSMS = useCallback((scheduledSMSList: BackendScheduledSMS[]): ScheduledMessage[] => {
    // Group by scheduled_sms_message_id to combine individual recipient records
    const groupedMessages = scheduledSMSList.reduce((acc, sms) => {
      const groupId = sms.scheduled_sms_message_id;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(sms);
      return acc;
    }, {} as Record<number, BackendScheduledSMS[]>);

    // Convert each group to a ScheduledMessage
    return Object.values(groupedMessages).map(group => {
      const firstSMS = group[0]; // Use first SMS for common properties
      
      // Determine recipient based on recipient_type and count
      let recipient = 'Unknown';
      
      // Check if this is an organization message (scheduled_for_organisation is not null)
      if (firstSMS.scheduled_for_organisation) {
        // This is an organization message - show the organization name
        recipient = firstSMS.scheduled_for_organisation;
      } else if (firstSMS.recipient_type === 'individual') {
        if (group.length === 1) {
          recipient = firstSMS.member_name;
        } else {
          recipient = `${group.length} Selected Members`;
        }
      } else if (firstSMS.recipient_type === 'organisation') {
        // For organization messages, always show the organization name
        recipient = firstSMS.organisation_name || 'Organization';
      } else if (firstSMS.recipient_type === 'all' || firstSMS.recipient_type === 'all_members') {
        recipient = 'All Members';
      } else {
        recipient = `${group.length} Members`;
      }

      // Parse schedule_time to separate date and time
      let scheduledDate = '';
      let scheduledTime = '';
      
      try {
        if (firstSMS.schedule_time) {
          const scheduleDateTime = new Date(firstSMS.schedule_time);
          if (!isNaN(scheduleDateTime.getTime())) {
            scheduledDate = scheduleDateTime.toISOString().split('T')[0];
            scheduledTime = scheduleDateTime.toTimeString().slice(0, 5);
          }
        }
      } catch (error) {
        console.error('Error parsing schedule_time:', error);
        scheduledDate = 'Invalid Date';
        scheduledTime = 'Invalid Time';
      }

      return {
        id: firstSMS.scheduled_sms_message_id,
        recipient: recipient,
        message: firstSMS.message || '',
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        status: (firstSMS.sms_status as 'scheduled' | 'sent' | 'cancelled') || 'scheduled',
      };
    });
  }, []);

  // Fetch members from API
  const fetchMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const response = await apiRequest<{ members: any[] }>('members', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.members && Array.isArray(response.data.members)) {
        console.log('Members loaded:', response.data.members.length, 'Sample member:', response.data.members[0]);
        setMembers(response.data.members);
      } else if (response.error) {
        console.error('Error fetching members:', response.error.message);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, []);

  // Fetch scheduled SMS messages from API
  const fetchScheduledSMSMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const response = await apiRequest<{ data: BackendScheduledSMS[] }>('sms_messages/schedule', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        try {
          const mappedScheduledMessages = mapBackendScheduledSMS(response.data.data);
          setScheduledMessages(mappedScheduledMessages);
        } catch (mappingError) {
          console.error('Error mapping scheduled SMS messages:', mappingError);
          setScheduledMessages([]);
        }
      } else if (response.error) {
        console.error('Error fetching scheduled SMS messages:', response.error.message);
        setScheduledMessages([]);
      } else {
        setScheduledMessages([]);
      }
    } catch (error) {
      console.error('Error fetching scheduled SMS messages:', error);
    }
  }, [mapBackendScheduledSMS]);
  const fetchOrganizations = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const response = await apiRequest<{ organisations: any[] }>('organisations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.organisations && Array.isArray(response.data.organisations)) {
        setOrganizations(response.data.organisations);
      } else if (response.error) {
        console.error('Error fetching organizations:', response.error.message);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, []);

  // Fetch SMS messages from API
  const fetchSMSMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Fetch both regular and scheduled SMS messages
      const [smsResponse, scheduledResponse] = await Promise.all([
        apiRequest<{ data: BackendSMS[] }>('sms_messages', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        apiRequest<{ data: BackendScheduledSMS[] }>('sms_messages/schedule', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      // Handle regular SMS messages
      if (smsResponse.data && smsResponse.data.data && Array.isArray(smsResponse.data.data)) {
        console.log('SMS API Response sample:', smsResponse.data.data[0]); // Debug log
        const mappedMessages = smsResponse.data.data.map(mapBackendSMS);
        setMessages(mappedMessages);
        showToast('SMS messages loaded successfully', 'success');
      } else if (smsResponse.error) {
        setError(smsResponse.error.message || 'Failed to fetch SMS messages');
        showToast('Failed to load SMS messages', 'error');
      } else {
        setMessages([]);
        showToast('No SMS messages found', 'info');
      }

      // Handle scheduled SMS messages
      if (scheduledResponse.data && scheduledResponse.data.data && Array.isArray(scheduledResponse.data.data)) {
        try {
          const mappedScheduledMessages = mapBackendScheduledSMS(scheduledResponse.data.data);
          setScheduledMessages(mappedScheduledMessages);
        } catch (mappingError) {
          console.error('Error mapping scheduled SMS messages:', mappingError);
          setScheduledMessages([]);
        }
      } else if (scheduledResponse.error) {
        console.error('Failed to fetch scheduled SMS messages:', scheduledResponse.error.message);
        setScheduledMessages([]);
      } else {
        setScheduledMessages([]);
      }
    } catch (error) {
      console.error('Error fetching SMS messages:', error);
      setError('Network error occurred while fetching SMS messages');
      showToast('Network error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [mapBackendSMS, mapBackendScheduledSMS, showToast]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchMembers(), fetchOrganizations()]);
    };
    fetchData();
  }, [fetchMembers, fetchOrganizations]);

  // Fetch SMS messages and scheduled messages when members are loaded
  useEffect(() => {
    if (members.length > 0) {
      const fetchInitialSMSMessages = async () => {
        try {
          setLoading(true);
          setError(null);

          const token = localStorage.getItem('auth_token');
          if (!token) {
            setError('No authentication token found');
            return;
          }

          // Fetch both regular and scheduled SMS messages
          const [smsResponse, scheduledResponse] = await Promise.all([
            apiRequest<{ data: BackendSMS[] }>('sms_messages', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }),
            apiRequest<{ data: BackendScheduledSMS[] }>('sms_messages/schedule', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })
          ]);

          // Handle regular SMS messages
          if (smsResponse.data && smsResponse.data.data && Array.isArray(smsResponse.data.data)) {
            console.log('Initial SMS API Response sample:', smsResponse.data.data[0]); // Debug log
            const mappedMessages = smsResponse.data.data.map(mapBackendSMS);
            setMessages(mappedMessages);
          } else if (smsResponse.error) {
            setError(smsResponse.error.message || 'Failed to fetch SMS messages');
          } else {
            setMessages([]);
          }

          // Handle scheduled SMS messages
          if (scheduledResponse.data && scheduledResponse.data.data && Array.isArray(scheduledResponse.data.data)) {
            try {
              const mappedScheduledMessages = mapBackendScheduledSMS(scheduledResponse.data.data);
              setScheduledMessages(mappedScheduledMessages);
            } catch (mappingError) {
              console.error('Error mapping scheduled SMS messages:', mappingError);
              setScheduledMessages([]);
            }
          } else if (scheduledResponse.error) {
            console.error('Failed to fetch scheduled SMS messages:', scheduledResponse.error.message);
            setScheduledMessages([]);
          } else {
            setScheduledMessages([]);
          }
        } catch (error) {
          console.error('Error fetching SMS messages:', error);
          setError('Network error occurred while fetching SMS messages');
        } finally {
          setLoading(false);
        }
      };
      fetchInitialSMSMessages();
    }
  }, [members, mapBackendSMS, mapBackendScheduledSMS]);

  const filteredMessages = messages
    .filter(
      (msg) =>
        msg.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  // Calculate stats from API data
  const totalSent = loading ? 0 : messages.length;
  const delivered = loading ? 0 : totalSent; // Set delivered equal to total sent
  const failed = loading ? 0 : messages.filter((m) => m.status === 'failed').length;
  const scheduled = scheduledMessages.filter((m) => m.status === 'scheduled').length;
  const totalCost = loading ? 0 : messages.reduce((sum, m) => sum + (m.cost || 0), 0);
  
  // Calculate percentages safely
  const deliveredPercentage = totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(1) : '0.0';
  const failedPercentage = totalSent > 0 ? ((failed / totalSent) * 100).toFixed(1) : '0.0';

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
    { label: 'Total SMS Sent', value: loading ? 'Loading...' : totalSent.toLocaleString(), icon: HiOutlineChatAlt, trend: '+12%', trendUp: true },
    { label: 'Delivered', value: loading ? 'Loading...' : delivered.toLocaleString(), icon: HiOutlineCheckCircle, trend: `${deliveredPercentage}%`, trendUp: true },
    { label: 'Failed', value: loading ? 'Loading...' : failed.toLocaleString(), icon: HiOutlineXCircle, trend: `${failedPercentage}%`, trendUp: false },
    { label: 'Scheduled', value: scheduled.toLocaleString(), icon: HiOutlineClock, trend: 'Active', trendUp: null },
    { label: 'Total Cost', value: loading ? 'Loading...' : `GH₵${totalCost.toFixed(2)}`, icon: HiOutlinePhone, trend: 'This month', trendUp: null },
  ];

  // Handle refresh delivery status
  const handleRefreshDeliveryStatus = async () => {
    try {
      setRefreshingDeliveryStatus(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      const response = await apiRequest('sms_messages/scheduled/check-delivered', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        console.error('Refresh delivery status API Error:', response.error);
        let errorMessage = response.error.message || 'Failed to refresh delivery status';
        
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to refresh delivery status.';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      showToast('Delivery status refreshed successfully!', 'success');
      
      // Refresh scheduled messages to show updated delivery status
      await fetchScheduledSMSMessages();
    } catch (error) {
      console.error('Error refreshing delivery status:', error);
      showToast(error instanceof Error ? error.message : 'Failed to refresh delivery status. Please try again.', 'error');
    } finally {
      setRefreshingDeliveryStatus(false);
    }
  };

  // Handle SMS sending
  const handleSendSMS = async (values: any) => {
    try {
      setSendingMessage(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      // Prepare the payload based on recipient type
      let payload: any = {
        member_ids: [],
        message: values.message
      };

      // Handle different recipient types
      if (values.recipientType === 'individual') {
        // For individual messages, use single SMS endpoint with member_id (not array)
        payload = {
          member_id: parseInt(values.recipients),
          message: values.message
        };
      } else if (values.recipientType === 'group') {
        // For group messages, use bulk endpoint with member_ids array
        const organizationId = parseInt(values.recipients);
        const selectedOrganization = organizations.find(org => org.id === organizationId);
        
        if (!selectedOrganization) {
          throw new Error('Selected organization not found');
        }
        
        if (!selectedOrganization.members || selectedOrganization.members.length === 0) {
          throw new Error(`No members found in "${selectedOrganization.name}". Please add members to this organization first.`);
        }
        
        // Extract member IDs from the organization's members array
        payload.member_ids = selectedOrganization.members.map((member: any) => member.member_id);
        
        console.log(`Sending group SMS to "${selectedOrganization.name}" - ${payload.member_ids.length} members:`, payload.member_ids);
      } else if (values.recipientType === 'all') {
        // For all members, use bulk endpoint with all member IDs
        payload.member_ids = members.map(member => member.id);
        
        if (payload.member_ids.length === 0) {
          throw new Error('No members found to send SMS to');
        }
      }

      // Determine the correct endpoint based on recipient type
      let endpoint = 'sms_messages';
      
      if (values.recipientType === 'group' || values.recipientType === 'all') {
        // Use bulk endpoint for group and all members
        endpoint = 'sms_messages/bulk';
      } else if (values.recipientType === 'individual') {
        // Use single endpoint for individual messages
        endpoint = 'sms_messages';
      }

      console.log('Using endpoint:', endpoint);
      console.log('Auth token exists:', !!token);
      console.log('Token length:', token.length);
      console.log('SMS Payload being sent:', JSON.stringify(payload, null, 2));

      const requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      console.log('Request headers:', requestOptions.headers);
      console.log('Request body:', requestOptions.body);

      const response = await apiRequest(endpoint, requestOptions);

      console.log('SMS API Response:', response);
      console.log('Raw response data:', response.data);
      console.log('Raw response error:', response.error);

      if (response.error) {
        console.error('SMS API Error Details:', {
          error: response.error,
          status: response.status,
          data: response.data
        });
        
        // Try to provide more specific error messages
        let errorMessage = response.error.message || `Failed to send SMS (Status: ${response.status})`;
        
        if (response.status === 400) {
          errorMessage = `Invalid request: ${response.error.message || 'Please check your message and recipient selection'}`;
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to send SMS messages.';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      showToast('SMS sent successfully!', 'success');
      form.resetFields();
      setShowSendModal(false);
      
      // Refresh SMS messages to show the newly sent message
      await fetchSMSMessages();
    } catch (error) {
      console.error('Error sending SMS:', error);
      showToast(error instanceof Error ? error.message : 'Failed to send SMS. Please try again.', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle scheduled SMS
  const handleScheduleSMS = async (values: any) => {
    try {
      setSchedulingMessage(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      // Combine date and time into the required format: "2024-04-22 10:00:00"
      const scheduledDate = values.scheduledDate.format('YYYY-MM-DD');
      const scheduledTime = values.scheduledTime.format('HH:mm:ss');
      const schedule_time = `${scheduledDate} ${scheduledTime}`;

      // Prepare the payload based on recipient type
      let payload: any = {
        message: values.message,
        schedule_time: schedule_time
      };

      // Handle different recipient types
      if (values.recipientType === 'individual') {
        // For individual messages, use recipient_type and member_ids
        payload.recipient_type = 'individual';
        payload.member_ids = [parseInt(values.recipients)];
      } else if (values.recipientType === 'group') {
        // For group messages, use organisation_id and recipient_type
        const organizationId = parseInt(values.recipients);
        const selectedOrganization = organizations.find(org => org.id === organizationId);
        
        if (!selectedOrganization) {
          throw new Error('Selected organization not found');
        }
        
        payload.recipient_type = 'organisation';
        payload.organisation_id = organizationId;
        
        console.log(`Scheduling group SMS to "${selectedOrganization.name}" (ID: ${organizationId})`);
      } else if (values.recipientType === 'all') {
        // For all members, use recipient_type instead of member_ids array
        payload.recipient_type = 'all_members';
      }

      console.log('Schedule SMS Payload being sent:', JSON.stringify(payload, null, 2));

      const requestOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      const response = await apiRequest('sms_messages/schedule', requestOptions);

      console.log('Schedule SMS API Response:', response);

      if (response.error) {
        console.error('Schedule SMS API Error Details:', {
          error: response.error,
          status: response.status,
          data: response.data
        });
        
        // Try to provide more specific error messages
        let errorMessage = response.error.message || `Failed to schedule SMS (Status: ${response.status})`;
        
        if (response.status === 400) {
          errorMessage = `Invalid request: ${response.error.message || 'Please check your message, recipients, and schedule time'}`;
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to schedule SMS messages.';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      showToast('SMS scheduled successfully!', 'success');
      scheduleForm.resetFields();
      setShowScheduleModal(false);
      
      // Refresh scheduled messages to show the newly scheduled message
      await fetchScheduledSMSMessages();
    } catch (error) {
      console.error('Error scheduling SMS:', error);
      showToast(error instanceof Error ? error.message : 'Failed to schedule SMS. Please try again.', 'error');
    } finally {
      setSchedulingMessage(false);
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
        <span className="text-sm text-gray-900">GH₵{record.cost?.toFixed(2) || '0.00'}</span>
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshDeliveryStatus}
                  disabled={refreshingDeliveryStatus}
                >
                  {refreshingDeliveryStatus ? 'Refreshing...' : 'Refresh Delivery Status'}
                </Button>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
        <div className="space-y-3">
              {scheduledMessages
                .sort((a, b) => new Date(`${b.scheduledDate} ${b.scheduledTime}`).getTime() - new Date(`${a.scheduledDate} ${a.scheduledTime}`).getTime())
                .map((scheduled) => (
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
              <Button variant="outline" size="sm" onClick={fetchSMSMessages} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
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
          {error ? (
            <div className="text-center py-8">
              <HiOutlineExclamationCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchSMSMessages} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredMessages}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} messages`,
              }}
            />
          )}
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
            {/* Send SMS Form */}
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
                        {organizations.map(org => (
                          <Select.Option key={org.id} value={org.id.toString()}>
                            {org.name}
                          </Select.Option>
                        ))}
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
                        options={members.map(formatMemberOption)}
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
                disabled={sendingMessage}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={sendingMessage}>
                <SendOutlined className="mr-2" />
                {sendingMessage ? 'Sending...' : 'Send SMS'}
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
            {/* Schedule SMS Form */}
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
                        {organizations.map(org => (
                          <Select.Option key={org.id} value={org.id.toString()}>
                            {org.name}
                          </Select.Option>
                        ))}
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
                        options={members.map(formatMemberOption)}
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
                disabled={schedulingMessage}
                >
                  Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={schedulingMessage}>
                <HiOutlineCalendar className="mr-2 h-4 w-4" />
                {schedulingMessage ? 'Scheduling...' : 'Schedule SMS'}
              </Button>
              </div>
          </Form>
        </div>
      </Drawer>
    </div>
  );
}
