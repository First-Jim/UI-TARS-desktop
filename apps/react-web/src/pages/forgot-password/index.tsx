import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authApi, ForgotPasswordDto } from '@/services/auth';

const { Title, Text } = Typography;

const ForgotPasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const onFinish = async (values: ForgotPasswordDto) => {
    try {
      setLoading(true);
      await authApi.forgotPassword(values);

      setSentEmail(values.email);
      setEmailSent(true);
      message.success('重置邮件已发送，请查看您的邮箱');
    } catch (error: any) {
      console.error('发送重置邮件失败:', error);
      message.error(error.response?.data?.message || '发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await authApi.forgotPassword({ email: sentEmail });
      message.success('重置邮件已重新发送');
    } catch (error: any) {
      console.error('重新发送失败:', error);
      message.error(error.response?.data?.message || '发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <Result
            status="success"
            title="邮件已发送"
            subTitle={
              <div className="space-y-2">
                <Text>
                  我们已向 <strong>{sentEmail}</strong> 发送了密码重置链接
                </Text>
                <Text type="secondary" className="block">
                  请查看您的邮箱（包括垃圾邮件文件夹）并点击链接重置密码
                </Text>
              </div>
            }
            extra={[
              <Button key="resend" onClick={handleResend} loading={loading}>
                重新发送邮件
              </Button>,
              <Button key="back" type="primary">
                <Link to="/login">返回登录</Link>
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
            忘记密码
          </Title>
          <Text type="secondary">输入您的邮箱地址，我们将发送重置链接给您</Text>
        </div>

        <Form
          form={form}
          name="forgot-password"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入您的邮箱地址" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-lg font-medium"
            >
              发送重置邮件
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-6">
          <Button type="link" icon={<ArrowLeftOutlined />}>
            <Link to="/login">返回登录</Link>
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <Text type="secondary" className="text-sm">
            <strong>提示：</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>请确保输入的邮箱地址正确</li>
              <li>重置邮件可能需要几分钟才能到达</li>
              <li>请检查垃圾邮件文件夹</li>
              <li>重置链接将在24小时后过期</li>
            </ul>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
