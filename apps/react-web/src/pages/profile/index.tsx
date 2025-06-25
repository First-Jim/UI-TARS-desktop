import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
  Typography,
  Space,
  Divider,
  Modal,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  CameraOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import GlobalStore from '@/store';
import { authApi } from '@/services/auth';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const ProfilePage: React.FC = observer(() => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 初始化表单数据
    form.setFieldsValue({
      name: GlobalStore.userInfo.name,
      email: GlobalStore.userInfo.email,
    });
  }, [form]);

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      // 这里应该调用更新用户信息的API
      // await userApi.updateProfile(values);

      // 更新本地存储的用户信息
      GlobalStore.setUserInfo({
        ...GlobalStore.userInfo,
        ...values,
      });

      message.success('个人信息已更新');
    } catch (error: any) {
      console.error('更新个人信息失败:', error);
      message.error(error.response?.data?.message || '更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'uploading') {
      setAvatarLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // 获取上传结果
      const avatarUrl = info.file.response?.url;
      if (avatarUrl) {
        GlobalStore.setUserInfo({
          ...GlobalStore.userInfo,
          avatar: avatarUrl,
        });
        message.success('头像更新成功');
      }
      setAvatarLoading(false);
    }
    if (info.file.status === 'error') {
      message.error('头像上传失败');
      setAvatarLoading(false);
    }
  };

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB');
      return false;
    }
    return true;
  };

  const handleDeleteAccount = async () => {
    try {
      // 这里应该调用删除账户的API
      // await userApi.deleteAccount();

      message.success('账户已删除');
      await authApi.logout();
      navigate('/login');
    } catch (error: any) {
      console.error('删除账户失败:', error);
      message.error(error.response?.data?.message || '删除失败，请重试');
    }
  };

  const { userInfo } = GlobalStore;

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/dashboard')}
          >
            返回
          </Button>
          <Title level={3} className="mb-0">
            个人设置
          </Title>
        </div>
      </Header>

      <Content className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-sm">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  src={userInfo.wechatHeadImgUrl || userInfo.avatar}
                  className="bg-blue-500"
                />
                <Upload
                  name="avatar"
                  showUploadList={false}
                  action="/api/upload/avatar"
                  beforeUpload={beforeUpload}
                  onChange={handleAvatarChange}
                  headers={{
                    authorization: `Bearer ${localStorage.getItem('access_token')}`,
                  }}
                >
                  <Button
                    icon={<CameraOutlined />}
                    shape="circle"
                    size="large"
                    loading={avatarLoading}
                    className="absolute bottom-0 right-0 bg-white shadow-md"
                  />
                </Upload>
              </div>
              <div className="mt-4">
                <Title level={4}>
                  {userInfo.wechatNickname || userInfo.name}
                </Title>
                <Text type="secondary">点击相机图标更换头像</Text>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              size="large"
            >
              <Form.Item
                name="name"
                label="姓名"
                rules={[
                  { required: true, message: '请输入姓名' },
                  { min: 2, message: '姓名至少需要2个字符' },
                  { max: 50, message: '姓名不能超过50个字符' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入您的姓名" />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="请输入邮箱地址"
                  disabled={!!userInfo.email} // 如果已有邮箱则不允许修改
                />
              </Form.Item>

              {userInfo.wechatNickname && (
                <Form.Item label="微信昵称">
                  <Input
                    value={userInfo.wechatNickname}
                    disabled
                    placeholder="微信昵称"
                  />
                </Form.Item>
              )}

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                    size="large"
                  >
                    保存更改
                  </Button>
                  <Button onClick={() => navigate('/security')} size="large">
                    安全设置
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            <Divider />

            <div className="space-y-4">
              <Title level={5} className="text-red-600">
                危险操作
              </Title>

              <Card className="border-red-200 bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Title level={5} className="mb-1 text-red-800">
                      删除账户
                    </Title>
                    <Text className="text-red-700">
                      删除账户后，所有数据将无法恢复。请谨慎操作。
                    </Text>
                  </div>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setDeleteModalVisible(true)}
                  >
                    删除账户
                  </Button>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </Content>

      <Modal
        title="确认删除账户"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            取消
          </Button>,
          <Button key="delete" danger onClick={handleDeleteAccount}>
            确认删除
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <Text>您确定要删除账户吗？此操作将：</Text>
          <ul className="list-disc list-inside space-y-1 text-red-600">
            <li>永久删除您的所有个人信息</li>
            <li>删除所有会议记录和数据</li>
            <li>无法恢复任何已删除的内容</li>
          </ul>
          <Text strong className="text-red-600">
            此操作不可撤销，请谨慎考虑！
          </Text>
        </div>
      </Modal>
    </Layout>
  );
});

export default ProfilePage;
