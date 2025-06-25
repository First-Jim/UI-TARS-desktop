import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Checkbox,
  message,
  Typography,
  Divider,
  Modal,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import WechatLogin from '@/components/WechatLogin';
import TwoFactorAuth from '@/components/TwoFactorAuth';
import { authApi, LoginDto } from '@/services/auth';
import GlobalStore from '@/store';
import { observer } from 'mobx-react-lite';

const { Title, Text } = Typography;

const LoginPage: React.FC = observer(() => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showWechatLogin, setShowWechatLogin] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // 检查是否已经登录
  useEffect(() => {
    console.log('🔍 Login page - checking login status:', {
      isLogin: GlobalStore.isLogin,
      hasUserInfo: !!GlobalStore.userInfo?.id,
      hasAccessToken: !!localStorage.getItem('access_token'),
      userInfo: GlobalStore.userInfo,
    });

    // 只有在确实有用户信息且有有效 token 时才跳转
    if (GlobalStore.isLogin && GlobalStore.userInfo?.id) {
      console.log('✅ User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [GlobalStore.isLogin, GlobalStore.userInfo, navigate]);

  const onFinish = async (values: LoginDto) => {
    try {
      setLoading(true);
      const response = await authApi.login(values);
      console.log('🚀 ~ onFinish ~ response:', response);

      // 检查是否需要 2FA
      if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
        setTempToken(response.tempToken);
        setShowTwoFactor(true);
        message.info('请输入双因素认证码');
        return;
      }
      if (response?.data?.code === 0) {
        message.success('登录成功！');
        navigate('/dashboard');
        return;
      }
    } catch (error: any) {
    } finally {
      setLoading(false);
    }
  };

  const handleWechatSuccess = () => {
    setShowWechatLogin(false);
    message.success('微信登录成功！');
    navigate('/dashboard');
  };

  const handleTwoFactorSuccess = () => {
    setShowTwoFactor(false);
    setTempToken('');
    message.success('登录成功！');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <Title level={2} className="mb-2">
            欢迎回来
          </Title>
          <Text type="secondary">登录您的账户</Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-between items-center">
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              >
                记住我
              </Checkbox>
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-800"
              >
                忘记密码？
              </Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-lg font-medium"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div className="space-y-3">
          <Button
            type="default"
            icon={
              <img src="/wechat-icon.svg" alt="WeChat" className="w-4 h-4" />
            }
            onClick={() => setShowWechatLogin(true)}
            className="w-full h-12 text-lg font-medium border-green-500 text-green-600 hover:bg-green-50"
          >
            微信登录
          </Button>
        </div>

        <div className="text-center mt-6">
          <Text type="secondary">
            还没有账户？{' '}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              立即注册
            </Link>
          </Text>
        </div>
      </Card>

      <WechatLogin
        visible={showWechatLogin}
        onClose={() => setShowWechatLogin(false)}
        onSuccess={handleWechatSuccess}
      />

      <TwoFactorAuth
        visible={showTwoFactor}
        tempToken={tempToken}
        onClose={() => {
          setShowTwoFactor(false);
          setTempToken('');
        }}
        onSuccess={handleTwoFactorSuccess}
      />
    </div>
  );
});

export default LoginPage;
