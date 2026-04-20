'use client';

import { useState, useEffect } from 'react';
import {
  HiOutlineCube,
  HiOutlineCollection,
  HiTrendingUp,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, Tag, Space, Button as AntButton, Input, Drawer, Form, Radio, InputNumber, Select, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EditOutlined, EyeOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { apiRequest } from '@/lib/api';

interface Asset {
  id: number;
  asset_name: string;
  asset_category: string;
  other_specify?: string;
  quantity: number;
  condition: string;
}

interface BackendAsset {
  id: number;
  asset_name: string;
  asset_category: string;
  other_specify?: string;
  quantity: number;
  condition: string;
}

interface AssetResponse {
  message: string;
  status: string;
  assets: BackendAsset[];
}

export default function AssetsPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // Asset categories as specified
  const assetCategories = [
    { value: 'musical_instrument', label: 'Musical Instrument' },
    { value: 'electrical_or_sound_equipment', label: 'Electrical or Sound Equipment' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'office_equipment', label: 'Office Equipment' },
    { value: 'building_or_maintenance_tool', label: 'Building or Maintenance Tool' },
    { value: 'liturgical_item', label: 'Liturgical Item' },
    { value: 'others', label: 'Others (specify)' },
  ];

  // Fetch assets from API
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        showToast('No authentication token found', 'error');
        return;
      }

      const response = await apiRequest<AssetResponse>('/assets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.error) {
        showToast(`Failed to fetch assets: ${response.error.message}`, 'error');
        return;
      }

      if (response.data?.assets) {
        setAssets(response.data.assets);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      showToast('Failed to fetch assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create asset
  const createAsset = async (values: any) => {
    try {
      setCreating(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        showToast('No authentication token found', 'error');
        return;
      }

      const payload = {
        asset: {
          asset_name: values.asset_name,
          asset_category: values.asset_category,
          ...(values.asset_category === 'others' && { other_specify: values.other_specify }),
          quantity: values.quantity,
          condition: values.condition,
        },
      };

      const response = await apiRequest('/assets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.error) {
        showToast(`Failed to create asset: ${response.error.message}`, 'error');
        return;
      }

      // Success - refresh the assets list
      await fetchAssets();
      
      // Close modal and reset form
      setShowAddModal(false);
      form.resetFields();

      // Show success message
      showToast('Asset created successfully!', 'success');
    } catch (error) {
      console.error('Error creating asset:', error);
      showToast('Failed to create asset', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Update asset
  const updateAsset = async (values: any) => {
    if (!editingAsset) return;
    
    try {
      setUpdating(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        showToast('No authentication token found', 'error');
        return;
      }

      const payload = {
        asset: {
          asset_name: values.asset_name,
          asset_category: values.asset_category,
          ...(values.asset_category === 'others' && { other_specify: values.other_specify }),
          quantity: values.quantity,
          condition: values.condition,
        },
      };

      const response = await apiRequest(`/assets/${editingAsset.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.error) {
        showToast(`Failed to update asset: ${response.error.message}`, 'error');
        return;
      }

      // Success - refresh the assets list
      await fetchAssets();
      
      // Close modal and reset form
      setShowEditModal(false);
      setEditingAsset(null);
      editForm.resetFields();

      // Show success message
      showToast('Asset updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating asset:', error);
      showToast('Failed to update asset', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // View asset
  const viewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowViewModal(true);
  };

  // Edit asset
  const editAsset = (asset: Asset) => {
    setEditingAsset(asset);
    editForm.setFieldsValue({
      asset_name: asset.asset_name,
      asset_category: asset.asset_category,
      other_specify: asset.other_specify || '',
      quantity: asset.quantity,
      condition: asset.condition,
    });
    setShowEditModal(true);
  };

  // Load assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

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
  ];

  // Calculate stats
  const totalAssets = assets.length;
  const totalQuantity = assets.reduce((sum, asset) => sum + asset.quantity, 0);
  const goodCondition = assets.filter(a => a.condition === 'good' || a.condition === 'new').length;

  const stats = [
    { 
      label: 'Total Assets', 
      value: totalAssets.toString(), 
      icon: HiOutlineCube,
      color: 'text-blue-600'
    },
    { 
      label: 'Total Quantity', 
      value: totalQuantity.toString(), 
      icon: HiOutlineCollection,
      color: 'text-green-600'
    },
    { 
      label: 'Good Condition', 
      value: goodCondition.toString(), 
      icon: HiOutlineCheckCircle,
      color: 'text-purple-600'
    },
  ];

  // Get category display name
  const getCategoryDisplayName = (category: string, otherSpecify?: string) => {
    if (category === 'others' && otherSpecify) {
      return otherSpecify;
    }
    const categoryObj = assetCategories.find(cat => cat.value === category);
    return categoryObj ? categoryObj.label : category;
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) =>
    asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.other_specify && asset.other_specify.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Table columns
  const columns: ColumnsType<Asset> = [
    {
      title: 'Asset Name',
      dataIndex: 'asset_name',
      key: 'asset_name',
      render: (text: string) => (
        <span className="text-sm font-semibold text-gray-900">{text}</span>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'asset_category',
      key: 'asset_category',
      render: (category: string, record: Asset) => (
        <span className="text-sm text-gray-900">
          {getCategoryDisplayName(category, record.other_specify)}
        </span>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => (
        <span className="text-sm text-gray-900">{quantity}</span>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: string) => {
        const colorMap: Record<string, string> = {
          'new': 'green',
          'good': 'blue',
          'fair': 'orange',
          'poor': 'red',
        };
        const displayCondition = condition.charAt(0).toUpperCase() + condition.slice(1);
        return (
          <Tag color={colorMap[condition.toLowerCase()] || 'default'}>
            {displayCondition}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <AntButton
            type="link"
            icon={<EyeOutlined />}
            className="text-blue-600"
            title="View"
            onClick={() => viewAsset(record)}
          />
          {(hasPermission('assets_or_equipment') || isSuperAdmin) && (
            <AntButton
              type="link"
              icon={<EditOutlined />}
              className="text-green-600"
              title="Edit"
              onClick={() => editAsset(record)}
            />
          )}
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
            Assets/Equipment
          </h1>
          <p className="text-gray-600 mt-1">Manage parish assets and equipment</p>
        </div>
        {(hasPermission('assets_or_equipment') || isSuperAdmin) && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchAssets}
              disabled={loading}
            >
              {loading ? <LoadingOutlined spin /> : 'Refresh'}
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="shadow-lg">
              <PlusOutlined className="mr-2" />
              Add Asset/Equipment
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Assets Table */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              All Assets/Equipment
            </CardTitle>
            <Input
              placeholder="Search assets..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {loading ? (
            <div className="text-center py-12">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <p className="text-gray-500 mt-4">Loading assets...</p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredAssets}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} assets`,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Asset/Equipment Drawer */}
      <Drawer
        title="Add Asset/Equipment"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={createAsset}
          initialValues={{
            condition: 'good',
          }}
        >
          <Form.Item
            label="Asset / Equipment Name"
            name="asset_name"
            rules={[{ required: true, message: 'Please enter asset name' }]}
          >
            <Input placeholder="Enter asset/equipment name" size="large" />
          </Form.Item>

          <Form.Item
            label="Asset Category"
            name="asset_category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select
              placeholder="Select category"
              size="large"
              options={assetCategories}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.asset_category !== currentValues.asset_category
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('asset_category') === 'others' ? (
                <Form.Item
                  label="Specify Category"
                  name="other_specify"
                  rules={[{ required: true, message: 'Please specify the category' }]}
                >
                  <Input placeholder="Enter category" size="large" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' },
            ]}
          >
            <InputNumber
              placeholder="Enter quantity"
              size="large"
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>

          <Form.Item
            label="Condition"
            name="condition"
            rules={[{ required: true, message: 'Please select condition' }]}
          >
            <Select
              placeholder="Select condition"
              size="large"
              options={[
                { value: 'new', label: 'New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' },
              ]}
            />
          </Form.Item>

          <Form.Item className="mt-6">
            <Space>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  form.resetFields();
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Add Asset/Equipment'
                )}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* View Asset Modal */}
      <Drawer
        title="Asset Details"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAsset(null);
        }}
      >
        {selectedAsset && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Information</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Name
                  </label>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                    {selectedAsset.asset_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                    {getCategoryDisplayName(selectedAsset.asset_category, selectedAsset.other_specify)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                    {selectedAsset.quantity}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <div className="bg-white p-2 rounded border">
                    <Tag color={
                      selectedAsset.condition === 'new' ? 'green' :
                      selectedAsset.condition === 'good' ? 'blue' :
                      selectedAsset.condition === 'fair' ? 'orange' : 'red'
                    }>
                      {selectedAsset.condition.charAt(0).toUpperCase() + selectedAsset.condition.slice(1)}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedAsset(null);
                }}
              >
                Close
              </Button>
              {(hasPermission('assets_or_equipment') || isSuperAdmin) && (
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    editAsset(selectedAsset);
                  }}
                >
                  <EditOutlined className="mr-2" />
                  Edit Asset
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit Asset Modal */}
      <Drawer
        title="Edit Asset/Equipment"
        placement="right"
        width={typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 600}
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAsset(null);
          editForm.resetFields();
        }}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={updateAsset}
        >
          <Form.Item
            label="Asset / Equipment Name"
            name="asset_name"
            rules={[{ required: true, message: 'Please enter asset name' }]}
          >
            <Input placeholder="Enter asset/equipment name" size="large" />
          </Form.Item>

          <Form.Item
            label="Asset Category"
            name="asset_category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select
              placeholder="Select category"
              size="large"
              options={assetCategories}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.asset_category !== currentValues.asset_category
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('asset_category') === 'others' ? (
                <Form.Item
                  label="Specify Category"
                  name="other_specify"
                  rules={[{ required: true, message: 'Please specify the category' }]}
                >
                  <Input placeholder="Enter category" size="large" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' },
            ]}
          >
            <InputNumber
              placeholder="Enter quantity"
              size="large"
              style={{ width: '100%' }}
              min={1}
            />
          </Form.Item>

          <Form.Item
            label="Condition"
            name="condition"
            rules={[{ required: true, message: 'Please select condition' }]}
          >
            <Select
              placeholder="Select condition"
              size="large"
              options={[
                { value: 'new', label: 'New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' },
              ]}
            />
          </Form.Item>

          <Form.Item className="mt-6">
            <Space>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAsset(null);
                  editForm.resetFields();
                }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} className="mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Asset'
                )}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

