import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  Input,
  Button,
  message,
  Typography,
  Space,
  Divider,
} from 'antd';
import { SafetyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { authApi } from '@/services/auth';

const { Title, Text } = Typography;

interface TwoFactorAuthProps {
  visible: boolean;
  tempToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  visible,
  tempToken,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 重置状态
  useEffect(() => {
    if (visible) {
      setCode('');
      setCountdown(300); // 5分钟倒计时
      // 聚焦第一个输入框
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [visible]);

  const handleInputChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return; // 只允许数字

    const newCode = code.split('');
    newCode[index] = value;
    const updatedCode = newCode.join('');
    setCode(updatedCode);

    // 自动跳转到下一个输入框
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 如果输入完成，自动提交
    if (updatedCode.length === 6) {
      handleSubmit(updatedCode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (submitCode?: string) => {
    const verificationCode = submitCode || code;

    if (verificationCode.length !== 6) {
      message.error('请输入6位验证码');
      return;
    }

    try {
      setLoading(true);
      await authApi.twoFactor.authenticate({
        code: verificationCode,
        tempToken,
      });

      message.success('验证成功！');
      onSuccess();
    } catch (error: any) {
      console.error('2FA验证失败:', error);

      if (error.response?.status === 401) {
        message.error('验证码错误或已过期，请重新输入');
      } else {
        message.error(error.response?.data?.message || '验证失败，请重试');
      }

      // 清空输入并聚焦第一个输入框
      setCode('');
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setCode('');
    setCountdown(0);
    onClose();
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={400}
      centered
      maskClosable={false}
    >
      <div className="text-center py-6">
        <div className="mb-6">
          <SafetyOutlined className="text-4xl text-blue-500 mb-4" />
          <Title level={3} className="mb-2">
            双因素认证
          </Title>
          <Text type="secondary">请打开您的身份验证器应用，输入6位验证码</Text>
        </div>

        <div className="mb-6">
          <Space size="small" className="justify-center">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                value={code[index] || ''}
                onChange={(e) => handleInputChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                maxLength={1}
                className="w-12 h-12 text-center text-xl font-bold"
                style={{
                  borderRadius: '8px',
                  borderColor: code[index] ? '#1890ff' : undefined,
                }}
              />
            ))}
          </Space>
        </div>

        {countdown > 0 && (
          <div className="mb-4 flex items-center justify-center text-orange-600">
            <ClockCircleOutlined className="mr-1" />
            <Text type="warning">
              验证码将在 {formatTime(countdown)} 后过期
            </Text>
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="primary"
            loading={loading}
            onClick={() => handleSubmit()}
            disabled={code.length !== 6}
            className="w-full h-12 text-lg font-medium"
          >
            验证
          </Button>

          <Button type="text" onClick={handleClose} className="w-full">
            取消
          </Button>
        </div>

        <Divider />

        <div className="text-center">
          <Text type="secondary" className="text-sm">
            没有收到验证码？请检查您的身份验证器应用
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default TwoFactorAuth;
