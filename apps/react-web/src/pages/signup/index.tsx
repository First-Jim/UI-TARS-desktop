import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Typography,
  Divider,
  Space,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, SignupDto } from '@/services/auth';
import WechatLogin from '@/components/WechatLogin';

const { Title, Text } = Typography;

const SignupPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showWechatLogin, setShowWechatLogin] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: SignupDto) => {
    try {
      setLoading(true);
      const response = await authApi.signup(values);

      message.success('注册成功！');

      // 如果用户邮箱未验证，提示验证邮箱
      if (!response.user.isVerified) {
        message.info('请查看邮箱并点击验证链接完成注册', 5);
      }

      // 跳转到首页或仪表板
      navigate('/dashboard');
    } catch (error: any) {
      console.error('注册失败:', error);

      // 适配后端统一数据结构的错误处理
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || error.message;

      if (
        errorMessage === 'Email already exists' ||
        errorMessage.includes('邮箱已存在')
      ) {
        message.error('该邮箱已被注册，请使用其他邮箱或直接登录');
      } else if (
        errorMessage === 'Password is too weak' ||
        errorMessage.includes('密码强度')
      ) {
        const feedback = errorData?.feedback;
        message.error(
          `密码强度不足：${feedback?.join('；') || '请使用更强的密码'}`,
        );
      } else {
        message.error(errorMessage || '注册失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWechatSuccess = () => {
    setShowWechatLogin(false);
    message.success('微信登录成功！');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <Title level={2} className="mb-2">
            创建账户
          </Title>
          <Text type="secondary">加入我们，开始您的旅程</Text>
        </div>

        <Form
          form={form}
          name="signup"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[
              { required: true, message: '请输入您的姓名' },
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
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少需要8个字符' },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: '密码必须包含大小写字母、数字和特殊字符',
              },
            ]}
            extra="密码需包含大小写字母、数字和特殊字符，至少8位"
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-lg font-medium"
            >
              注册
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
            微信注册
          </Button>
        </div>

        <div className="text-center mt-6">
          <Text type="secondary">
            已有账户？{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              立即登录
            </Link>
          </Text>
        </div>

        <div className="text-center mt-4">
          <Text type="secondary" className="text-xs">
            注册即表示您同意我们的{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-800">
              服务条款
            </Link>{' '}
            和{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-800">
              隐私政策
            </Link>
          </Text>
        </div>
      </Card>

      <WechatLogin
        visible={showWechatLogin}
        onClose={() => setShowWechatLogin(false)}
        onSuccess={handleWechatSuccess}
      />
    </div>
  );
};

export default SignupPage;
