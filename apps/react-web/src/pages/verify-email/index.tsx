import React, { useEffect, useState } from 'react';
import { Card, Result, Button, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/services/auth';

const VerifyEmailPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('验证链接无效');
      setLoading(false);
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      await authApi.verifyEmail(token!);
      setVerified(true);
      message.success('邮箱验证成功！');
    } catch (error: any) {
      console.error('邮箱验证失败:', error);
      setError(error.response?.data?.message || '验证失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <Spin size="large" />
          <div className="mt-4">
            <h3>正在验证邮箱...</h3>
            <p className="text-gray-600">请稍候</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        {verified ? (
          <Result
            icon={<CheckCircleOutlined className="text-green-500" />}
            status="success"
            title="邮箱验证成功"
            subTitle="您的邮箱已成功验证，现在可以正常使用所有功能了"
            extra={[
              <Button key="dashboard" type="primary" size="large">
                <Link to="/dashboard">进入仪表板</Link>
              </Button>,
              <Button key="login" size="large">
                <Link to="/login">返回登录</Link>
              </Button>,
            ]}
          />
        ) : (
          <Result
            icon={<CloseCircleOutlined className="text-red-500" />}
            status="error"
            title="邮箱验证失败"
            subTitle={error || '验证链接可能已过期或无效'}
            extra={[
              <Button key="resend" type="primary" size="large">
                <Link to="/login">重新发送验证邮件</Link>
              </Button>,
              <Button key="login" size="large">
                <Link to="/login">返回登录</Link>
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
