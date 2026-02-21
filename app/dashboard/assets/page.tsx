'use client';

import { useState } from 'react';
import {
  HiOutlineCube,
  HiOutlineCollection,
  HiTrendingUp,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, Tag, Space, Button as AntButton, Input, Drawer, Form, Radio, InputNumber, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';

interface Asset {
  id: number;
  name: string;
  category: string;
  categoryOther?: string;
  code: string;
  quantity: number;
  unit: string;
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
}

export default function AssetsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: 1,
      name: 'Piano',
      category: 'Musical Instrument',
      code: 'AST-001',
      quantity: 1,
      unit: 'Piece (pc / pcs)',
      condition: 'Good',
    },
    {
      id: 2,
      name: 'Sound System',
      category: 'Electrical / Sound Equipment',
      code: 'AST-002',
      quantity: 1,
      unit: 'Set',
      condition: 'New',
    },
    {
      id: 3,
      name: 'Parish Chairs',
      category: 'Furniture',
      code: 'AST-003',
      quantity: 200,
      unit: 'Piece (pc / pcs)',
      condition: 'Good',
    },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  // Units of measurement organized by category
  const unitsOfMeasurement = [
    // Quantity / Count
    { value: 'Piece (pc / pcs)', label: 'Piece (pc / pcs)', category: 'Quantity / Count' },
    { value: 'Item', label: 'Item', category: 'Quantity / Count' },
    { value: 'Set', label: 'Set', category: 'Quantity / Count' },
    { value: 'Pair', label: 'Pair', category: 'Quantity / Count' },
    { value: 'Dozen', label: 'Dozen', category: 'Quantity / Count' },
    { value: 'Carton', label: 'Carton', category: 'Quantity / Count' },
    { value: 'Pack', label: 'Pack', category: 'Quantity / Count' },
    { value: 'Bundle', label: 'Bundle', category: 'Quantity / Count' },
    { value: 'Roll', label: 'Roll', category: 'Quantity / Count' },
    // Length
    { value: 'Millimeter (mm)', label: 'Millimeter (mm)', category: 'Length' },
    { value: 'Centimeter (cm)', label: 'Centimeter (cm)', category: 'Length' },
    { value: 'Meter (m)', label: 'Meter (m)', category: 'Length' },
    { value: 'Kilometer (km)', label: 'Kilometer (km)', category: 'Length' },
    { value: 'Inch (in)', label: 'Inch (in)', category: 'Length' },
    { value: 'Foot (ft)', label: 'Foot (ft)', category: 'Length' },
    { value: 'Yard (yd)', label: 'Yard (yd)', category: 'Length' },
    // Area
    { value: 'Square meter (m²)', label: 'Square meter (m²)', category: 'Area' },
    { value: 'Square foot (ft²)', label: 'Square foot (ft²)', category: 'Area' },
    { value: 'Square yard (yd²)', label: 'Square yard (yd²)', category: 'Area' },
    { value: 'Hectare (ha)', label: 'Hectare (ha)', category: 'Area' },
    { value: 'Acre', label: 'Acre', category: 'Area' },
    // Volume / Capacity
    { value: 'Milliliter (ml)', label: 'Milliliter (ml)', category: 'Volume / Capacity' },
    { value: 'Liter (L)', label: 'Liter (L)', category: 'Volume / Capacity' },
    { value: 'Cubic meter (m³)', label: 'Cubic meter (m³)', category: 'Volume / Capacity' },
    { value: 'Gallon', label: 'Gallon', category: 'Volume / Capacity' },
    { value: 'Barrel', label: 'Barrel', category: 'Volume / Capacity' },
    // Mass / Weight
    { value: 'Milligram (mg)', label: 'Milligram (mg)', category: 'Mass / Weight' },
    { value: 'Gram (g)', label: 'Gram (g)', category: 'Mass / Weight' },
    { value: 'Kilogram (kg)', label: 'Kilogram (kg)', category: 'Mass / Weight' },
    { value: 'Tonne (t)', label: 'Tonne (t)', category: 'Mass / Weight' },
    { value: 'Pound (lb)', label: 'Pound (lb)', category: 'Mass / Weight' },
    { value: 'Ounce (oz)', label: 'Ounce (oz)', category: 'Mass / Weight' },
    // Time
    { value: 'Second (s)', label: 'Second (s)', category: 'Time' },
    { value: 'Minute (min)', label: 'Minute (min)', category: 'Time' },
    { value: 'Hour (hr)', label: 'Hour (hr)', category: 'Time' },
    { value: 'Day', label: 'Day', category: 'Time' },
    { value: 'Week', label: 'Week', category: 'Time' },
    { value: 'Month', label: 'Month', category: 'Time' },
    { value: 'Year', label: 'Year', category: 'Time' },
    // Temperature
    { value: 'Celsius (°C)', label: 'Celsius (°C)', category: 'Temperature' },
    { value: 'Fahrenheit (°F)', label: 'Fahrenheit (°F)', category: 'Temperature' },
    { value: 'Kelvin (K)', label: 'Kelvin (K)', category: 'Temperature' },
    // Electricity & Power
    { value: 'Volt (V)', label: 'Volt (V)', category: 'Electricity & Power' },
    { value: 'Ampere (A)', label: 'Ampere (A)', category: 'Electricity & Power' },
    { value: 'Watt (W)', label: 'Watt (W)', category: 'Electricity & Power' },
    { value: 'Kilowatt (kW)', label: 'Kilowatt (kW)', category: 'Electricity & Power' },
    { value: 'Ohm (Ω)', label: 'Ohm (Ω)', category: 'Electricity & Power' },
    // Data / Digital Storage
    { value: 'Bit', label: 'Bit', category: 'Data / Digital Storage' },
    { value: 'Byte', label: 'Byte', category: 'Data / Digital Storage' },
    { value: 'Kilobyte (KB)', label: 'Kilobyte (KB)', category: 'Data / Digital Storage' },
    { value: 'Megabyte (MB)', label: 'Megabyte (MB)', category: 'Data / Digital Storage' },
    { value: 'Gigabyte (GB)', label: 'Gigabyte (GB)', category: 'Data / Digital Storage' },
    { value: 'Terabyte (TB)', label: 'Terabyte (TB)', category: 'Data / Digital Storage' },
    // Frequency & Sound
    { value: 'Hertz (Hz)', label: 'Hertz (Hz)', category: 'Frequency & Sound' },
    { value: 'Decibel (dB)', label: 'Decibel (dB)', category: 'Frequency & Sound' },
  ];

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
  const goodCondition = assets.filter(a => a.condition === 'Good' || a.condition === 'New').length;

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

  // Filter assets
  const filteredAssets = assets.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Table columns
  const columns: ColumnsType<Asset> = [
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <span className="text-sm font-semibold text-gray-900">{text}</span>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string, record: Asset) => (
        <span className="text-sm text-gray-900">
          {record.categoryOther || category}
        </span>
      ),
    },
    {
      title: 'Code/Tag',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => (
        <span className="text-sm font-mono text-gray-700">{text}</span>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: Asset) => (
        <span className="text-sm text-gray-900">
          {quantity} {record.unit}
        </span>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: string) => {
        const colorMap: Record<string, string> = {
          'New': 'green',
          'Good': 'blue',
          'Fair': 'orange',
          'Poor': 'red',
        };
        return (
          <Tag color={colorMap[condition] || 'default'}>
            {condition}
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
          />
          <AntButton
            type="link"
            icon={<EditOutlined />}
            className="text-green-600"
            title="Edit"
          />
        </Space>
      ),
    },
  ];

  const handleAddAsset = (values: any) => {
    const newAsset: Asset = {
      id: assets.length + 1,
      name: values.name,
      category: values.category === 'Others' ? 'Others' : values.category,
      categoryOther: values.category === 'Others' ? values.categoryOther : undefined,
      code: values.code,
      quantity: values.quantity,
      unit: values.unit,
      condition: values.condition,
    };
    setAssets([...assets, newAsset]);
    form.resetFields();
    setShowAddModal(false);
  };

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
        <Button onClick={() => setShowAddModal(true)} className="shadow-lg">
          <PlusOutlined className="mr-2" />
          Add Asset/Equipment
        </Button>
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
          onFinish={handleAddAsset}
          initialValues={{
            unit: 'Piece (pc / pcs)',
            condition: 'Good',
          }}
        >
          <Form.Item
            label="Asset / Equipment Name"
            name="name"
            rules={[{ required: true, message: 'Please enter asset name' }]}
          >
            <Input placeholder="Enter asset/equipment name" size="large" />
          </Form.Item>

          <Form.Item
            label="Asset Category"
            name="category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="Musical Instrument">Musical Instrument</Radio>
                <Radio value="Electrical / Sound Equipment">Electrical / Sound Equipment</Radio>
                <Radio value="Furniture">Furniture</Radio>
                <Radio value="Office Equipment">Office Equipment</Radio>
                <Radio value="Building / Maintenance Tool">Building / Maintenance Tool</Radio>
                <Radio value="Liturgical Item">Liturgical Item</Radio>
                <Radio value="Others">Others (specify)</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.category !== currentValues.category
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('category') === 'Others' ? (
                <Form.Item
                  label="Specify Category"
                  name="categoryOther"
                  rules={[{ required: true, message: 'Please specify the category' }]}
                >
                  <Input placeholder="Enter category" size="large" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            label="Asset Code / Tag Number"
            name="code"
            rules={[{ required: true, message: 'Please enter asset code/tag number' }]}
          >
            <Input placeholder="Enter asset code or tag number" size="large" />
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
            label="Unit of Measurement"
            name="unit"
            rules={[{ required: true, message: 'Please select unit of measurement' }]}
          >
            <Select
              showSearch
              placeholder="Search and select unit"
              size="large"
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={unitsOfMeasurement.map(unit => ({
                value: unit.value,
                label: unit.label,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Condition"
            name="condition"
            rules={[{ required: true, message: 'Please select condition' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="New">New</Radio>
                <Radio value="Good">Good</Radio>
                <Radio value="Fair">Fair</Radio>
                <Radio value="Poor">Poor</Radio>
              </Space>
            </Radio.Group>
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
              >
                Cancel
              </Button>
              <Button type="submit">
                Add Asset/Equipment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

