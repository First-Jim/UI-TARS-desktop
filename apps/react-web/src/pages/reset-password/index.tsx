import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Typography,
  Result,
  Progress,
} from 'antd';
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi, ResetPasswordDto } from '@/services/auth';

const { Title, Text } = Typography;

const ResetPasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      message.error('重置链接无效');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  // 密码强度检测
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[@$!%*?&]/.test(password)) strength += 10;

    setPasswordStrength(Math.min(strength, 100));
  };

  const getStrengthColor = () => {
    if (passwordStrength < 30) return '#ff4d4f';
    if (passwordStrength < 60) return '#faad14';
    if (passwordStrength < 80) return '#1890ff';
    return '#52c41a';
  };

  const getStrengthText = () => {
    if (passwordStrength < 30) return '弱';
    if (passwordStrength < 60) return '中等';
    if (passwordStrength < 80) return '强';
    return '很强';
  };

  const onFinish = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    if (!token) {
      message.error('重置链接无效');
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({
        token,
        password: values.password,
      });

      setResetSuccess(true);
      message.success('密码重置成功！');
    } catch (error: any) {
      console.error('重置密码失败:', error);

      if (error.response?.status === 401) {
        message.error('重置链接已过期或无效，请重新申请');
      } else {
        message.error(error.response?.data?.message || '重置失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <Result
            icon={<CheckCircleOutlined className="text-green-500" />}
            status="success"
            title="密码重置成功"
            subTitle="您的密码已成功重置，现在可以使用新密码登录了"
            extra={[
              <Button key="login" type="primary" size="large">
                <Link to="/login">立即登录</Link>
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <Title level={2} className="mb-2">
            重置密码
          </Title>
          <Text type="secondary">请输入您的新密码</Text>
        </div>

        <Form
          form={form}
          name="reset-password"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="password"
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
              onChange={(e) => checkPasswordStrength(e.target.value)}
            />
          </Form.Item>

          {passwordStrength > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <Text type="secondary" className="text-sm">
                  密码强度
                </Text>
                <Text className="text-sm" style={{ color: getStrengthColor() }}>
                  {getStrengthText()}
                </Text>
              </div>
              <Progress
                percent={passwordStrength}
                strokeColor={getStrengthColor()}
                showInfo={false}
                size="small"
              />
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认新密码' },
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
              loading={loading}
              className="w-full h-12 text-lg font-medium"
            >
              重置密码
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-6">
          <Text type="secondary">
            记起密码了？{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              返回登录
            </Link>
          </Text>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <Text type="secondary" className="text-sm">
            <strong>密码要求：</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>至少8个字符</li>
              <li>包含大写字母</li>
              <li>包含小写字母</li>
              <li>包含数字</li>
              <li>包含特殊字符 (@$!%*?&)</li>
            </ul>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
