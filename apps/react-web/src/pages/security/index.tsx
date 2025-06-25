import React, { useState } from 'react';
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Space,
  Divider,
  Modal,
  QRCode,
  Alert,
  Switch,
} from 'antd';
import {
  LockOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CopyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import GlobalStore from '@/store';
import { authApi } from '@/services/auth';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const SecurityPage: React.FC = observer(() => {
  const [passwordForm] = Form.useForm();
  const [twoFactorForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<any>(null);
  const [verificationStep, setVerificationStep] = useState(1);
  const navigate = useNavigate();

  const handleChangePassword = async (values: any) => {
    try {
      setPasswordLoading(true);
      // 这里应该调用修改密码的API
      // await authApi.changePassword(values);

      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error: any) {
      console.error('修改密码失败:', error);
      message.error(error.response?.data?.message || '修改失败，请重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGenerateTwoFactor = async () => {
    try {
      setTwoFactorLoading(true);
      const response = await authApi.twoFactor.generate();
      setTwoFactorData(response);
      setShowTwoFactorSetup(true);
      setVerificationStep(1);
    } catch (error: any) {
      console.error('生成2FA失败:', error);
      message.error(error.response?.data?.message || '生成失败，请重试');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (values: any) => {
    try {
      setTwoFactorLoading(true);
      await authApi.twoFactor.verify(values.code);

      // 更新用户信息
      GlobalStore.setUserInfo({
        ...GlobalStore.userInfo,
        twoFactorEnabled: true,
      });

      message.success('双因素认证已启用');
      setShowTwoFactorSetup(false);
      setTwoFactorData(null);
    } catch (error: any) {
      console.error('验证2FA失败:', error);
      message.error(error.response?.data?.message || '验证失败，请重试');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    Modal.confirm({
      title: '确认禁用双因素认证',
      content: '禁用双因素认证会降低您账户的安全性，确定要继续吗？',
      okText: '确认禁用',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          // 这里需要用户输入密码确认
          const password = await new Promise<string>((resolve, reject) => {
            let inputPassword = '';
            Modal.confirm({
              title: '请输入密码确认',
              content: (
                <Input.Password
                  placeholder="请输入当前密码"
                  onChange={(e) => (inputPassword = e.target.value)}
                />
              ),
              onOk: () => resolve(inputPassword),
              onCancel: () => reject(new Error('用户取消')),
            });
          });

          await authApi.twoFactor.disable(password);

          GlobalStore.setUserInfo({
            ...GlobalStore.userInfo,
            twoFactorEnabled: false,
          });

          message.success('双因素认证已禁用');
        } catch (error: any) {
          if (error.message !== '用户取消') {
            console.error('禁用2FA失败:', error);
            message.error(error.response?.data?.message || '禁用失败，请重试');
          }
        }
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
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
            安全设置
          </Title>
        </div>
      </Header>

      <Content className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 修改密码 */}
          <Card title="修改密码" className="shadow-sm">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              size="large"
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入当前密码"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码至少需要8个字符' },
                  {
                    pattern:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: '密码必须包含大小写字母、数字和特殊字符',
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入新密码"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请再次输入新密码"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                  size="large"
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 双因素认证 */}
          <Card title="双因素认证" className="shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Title level={5} className="mb-1">
                    双因素认证 (2FA)
                  </Title>
                  <Text type="secondary">为您的账户添加额外的安全保护层</Text>
                </div>
                <Switch
                  checked={userInfo.twoFactorEnabled}
                  onChange={
                    userInfo.twoFactorEnabled
                      ? handleDisableTwoFactor
                      : handleGenerateTwoFactor
                  }
                  loading={twoFactorLoading}
                />
              </div>

              {userInfo.twoFactorEnabled ? (
                <Alert
                  message="双因素认证已启用"
                  description="您的账户已受到双因素认证保护。登录时需要输入身份验证器应用中的验证码。"
                  type="success"
                  icon={<CheckCircleOutlined />}
                  showIcon
                />
              ) : (
                <Alert
                  message="建议启用双因素认证"
                  description="双因素认证可以大大提高您账户的安全性，即使密码被泄露也能保护您的账户。"
                  type="warning"
                  showIcon
                />
              )}
            </div>
          </Card>

          {/* 登录设备管理 */}
          <Card title="登录设备" className="shadow-sm">
            <div className="space-y-4">
              <Text type="secondary">
                管理已登录的设备，您可以远程注销可疑设备。
              </Text>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Text strong>当前设备</Text>
                    <div className="text-sm text-gray-500">
                      {navigator.userAgent.includes('Chrome')
                        ? 'Chrome'
                        : 'Unknown'}{' '}
                      •{new Date().toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <Text type="success">当前</Text>
                </div>
              </div>

              <Button type="link" className="p-0">
                注销所有其他设备
              </Button>
            </div>
          </Card>
        </div>
      </Content>

      {/* 2FA 设置弹窗 */}
      <Modal
        title="设置双因素认证"
        open={showTwoFactorSetup}
        onCancel={() => {
          setShowTwoFactorSetup(false);
          setTwoFactorData(null);
        }}
        footer={null}
        width={500}
      >
        {twoFactorData && (
          <div className="space-y-6">
            {verificationStep === 1 && (
              <>
                <div className="text-center">
                  <Title level={4}>扫描二维码</Title>
                  <Text type="secondary">
                    使用身份验证器应用（如 Google
                    Authenticator、Authy）扫描下方二维码
                  </Text>
                </div>

                <div className="text-center">
                  <QRCode value={twoFactorData.qrCodeUrl} size={200} />
                </div>

                <div>
                  <Text strong>手动输入密钥：</Text>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input value={twoFactorData.secret} readOnly />
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(twoFactorData.secret)}
                    >
                      复制
                    </Button>
                  </div>
                </div>

                <Button
                  type="primary"
                  onClick={() => setVerificationStep(2)}
                  className="w-full"
                >
                  下一步
                </Button>
              </>
            )}

            {verificationStep === 2 && (
              <>
                <div className="text-center">
                  <Title level={4}>验证设置</Title>
                  <Text type="secondary">
                    请输入身份验证器应用中显示的6位验证码
                  </Text>
                </div>

                <Form
                  form={twoFactorForm}
                  onFinish={handleVerifyTwoFactor}
                  layout="vertical"
                >
                  <Form.Item
                    name="code"
                    rules={[
                      { required: true, message: '请输入验证码' },
                      { len: 6, message: '验证码必须是6位数字' },
                    ]}
                  >
                    <Input
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="text-center text-xl"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space className="w-full">
                      <Button onClick={() => setVerificationStep(1)}>
                        上一步
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={twoFactorLoading}
                        className="flex-1"
                      >
                        启用双因素认证
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
});

export default SecurityPage;
