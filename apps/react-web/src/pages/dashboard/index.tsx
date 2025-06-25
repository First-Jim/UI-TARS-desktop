import React, { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Avatar,
  Typography,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  message,
  Spin,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
  LogoutOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import GlobalStore from '@/store';
console.log('🚀 ~ GlobalStore:', GlobalStore);
import { authApi } from '@/services/auth';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const DashboardPage: React.FC = observer(() => {
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      await authApi.getProfile();
    } catch (error: any) {
      console.error('获取用户信息失败:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await authApi.logout();
      message.success('已安全退出');
      navigate('/login');
    } catch (error: any) {
      console.error('退出失败:', error);
      message.error('退出失败，请重试');
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await authApi.resendVerification(GlobalStore.userInfo.email);
      message.success('验证邮件已重新发送，请查看您的邮箱');
    } catch (error: any) {
      console.error('发送验证邮件失败:', error);
      message.error(error.response?.data?.message || '发送失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const { userInfo } = GlobalStore;

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-white shadow-sm px-6 flex items-center justify-between">
        <Title level={3} className="mb-0">
          用户仪表板
        </Title>
        <Space>
          <Button
            icon={<SettingOutlined />}
            onClick={() => navigate('/profile')}
          >
            设置
          </Button>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            loading={logoutLoading}
          >
            退出
          </Button>
        </Space>
      </Header>

      <Content className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 用户信息卡片 */}
          <Card className="shadow-sm">
            <div className="flex items-center space-x-4">
              <Avatar
                size={80}
                icon={<UserOutlined />}
                src={userInfo.wechatHeadImgUrl}
                className="bg-blue-500"
              />
              <div className="flex-1">
                <Title level={2} className="mb-1">
                  {userInfo.wechatNickname || userInfo.name}
                </Title>
                <Space direction="vertical" size="small">
                  <div className="flex items-center space-x-2">
                    <MailOutlined className="text-gray-500" />
                    <Text>{userInfo.email}</Text>
                    {userInfo.isVerified ? (
                      <CheckCircleOutlined className="text-green-500" />
                    ) : (
                      <ExclamationCircleOutlined className="text-orange-500" />
                    )}
                  </div>
                  {!userInfo.isVerified && (
                    <Button
                      type="link"
                      size="small"
                      onClick={handleResendVerification}
                      className="p-0 h-auto"
                    >
                      重新发送验证邮件
                    </Button>
                  )}
                </Space>
              </div>
              <div className="text-right">
                <Text type="secondary">注册时间</Text>
                <div>
                  {new Date(userInfo.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
          </Card>

          {/* 统计信息 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm">
                <Statistic
                  title="账户状态"
                  value={userInfo.isVerified ? '已验证' : '未验证'}
                  valueStyle={{
                    color: userInfo.isVerified ? '#3f8600' : '#cf1322',
                  }}
                  prefix={
                    userInfo.isVerified ? (
                      <CheckCircleOutlined />
                    ) : (
                      <ExclamationCircleOutlined />
                    )
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm">
                <Statistic
                  title="双因素认证"
                  value={userInfo.twoFactorEnabled ? '已启用' : '未启用'}
                  valueStyle={{
                    color: userInfo.twoFactorEnabled ? '#3f8600' : '#cf1322',
                  }}
                  prefix={<SafetyOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm">
                <Statistic
                  title="登录方式"
                  value={userInfo.wechatOpenid ? '微信' : '邮箱'}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="shadow-sm">
                <Statistic
                  title="最后更新"
                  value={new Date(userInfo.updatedAt).toLocaleDateString(
                    'zh-CN',
                  )}
                />
              </Card>
            </Col>
          </Row>

          {/* 快速操作 */}
          <Card title="快速操作" className="shadow-sm">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  className="text-center cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  <SettingOutlined className="text-2xl text-blue-500 mb-2" />
                  <div>个人设置</div>
                  <Text type="secondary" className="text-sm">
                    修改个人信息和偏好设置
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  className="text-center cursor-pointer"
                  onClick={() => navigate('/security')}
                >
                  <SafetyOutlined className="text-2xl text-green-500 mb-2" />
                  <div>安全设置</div>
                  <Text type="secondary" className="text-sm">
                    管理密码和双因素认证
                  </Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card
                  hoverable
                  className="text-center cursor-pointer"
                  onClick={() => navigate('/meetings')}
                >
                  <UserOutlined className="text-2xl text-purple-500 mb-2" />
                  <div>我的会议</div>
                  <Text type="secondary" className="text-sm">
                    查看和管理会议记录
                  </Text>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* 提醒信息 */}
          {!userInfo.isVerified && (
            <Card className="shadow-sm border-orange-200 bg-orange-50">
              <div className="flex items-center space-x-3">
                <ExclamationCircleOutlined className="text-orange-500 text-xl" />
                <div className="flex-1">
                  <Title level={5} className="mb-1 text-orange-800">
                    请验证您的邮箱
                  </Title>
                  <Text className="text-orange-700">
                    为了确保账户安全，请点击我们发送到您邮箱的验证链接完成验证。
                  </Text>
                </div>
                <Button
                  type="primary"
                  onClick={handleResendVerification}
                  className="bg-orange-500 border-orange-500"
                >
                  重新发送
                </Button>
              </div>
            </Card>
          )}

          {!userInfo.twoFactorEnabled && (
            <Card className="shadow-sm border-blue-200 bg-blue-50">
              <div className="flex items-center space-x-3">
                <SafetyOutlined className="text-blue-500 text-xl" />
                <div className="flex-1">
                  <Title level={5} className="mb-1 text-blue-800">
                    启用双因素认证
                  </Title>
                  <Text className="text-blue-700">
                    为您的账户添加额外的安全保护，防止未经授权的访问。
                  </Text>
                </div>
                <Button type="primary" onClick={() => navigate('/security')}>
                  立即启用
                </Button>
              </div>
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
});

export default DashboardPage;
