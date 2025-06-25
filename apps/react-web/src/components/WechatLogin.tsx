import React, { useState, useEffect, useRef } from 'react';
import { Modal, Spin, message, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { wechatApi } from '@/services';
import GlobalStore from '@/store';
import { observer } from 'mobx-react-lite';

interface WechatLoginProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (userInfo: any) => void;
}

const WechatLogin: React.FC<WechatLoginProps> = observer(
  ({ visible, onClose, onSuccess }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [expired, setExpired] = useState<boolean>(false);
    const [currentScene, setCurrentScene] = useState<string>('');
    const [isPersonalSubscription, setIsPersonalSubscription] =
      useState<boolean>(false);
    const [personalGuide, setPersonalGuide] = useState<any>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const attemptsRef = useRef<number>(0);

    // 检查是否为开发环境
    const isDevelopment = import.meta.env.DEV;

    // 生成二维码
    const generateQrCode = async () => {
      try {
        setLoading(true);
        setExpired(false);
        setIsPersonalSubscription(false);
        setPersonalGuide(null);

        const scene = `login_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        setCurrentScene(scene);

        const response = await wechatApi.createTempQrCode(scene, 300); // 5分钟过期
        console.log('🚀 ~ generateQrCode ~ response:', response);

        if (response) {
          // 检查是否是个人订阅号
          if (response.is_personal_subscription || response.is_mock) {
            setIsPersonalSubscription(true);
            setPersonalGuide(response.personal_subscription_guide);
            message.info('检测到个人订阅号，请按照指引完成登录', 5);
          }

          if (response.qr_code_url) {
            setQrCodeUrl(response.qr_code_url);
            startPolling(scene);
          } else {
            message.error('获取二维码失败，请重试');
          }
        } else {
          message.error('获取二维码失败，请重试');
        }
      } catch (error) {
        console.error('生成二维码失败:', error);
        message.error('生成二维码失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    // 开始轮询检查登录状态
    const startPolling = (scene: string) => {
      attemptsRef.current = 0;

      const poll = async () => {
        try {
          attemptsRef.current++;

          // 检查是否超过最大尝试次数 (5分钟 = 150次 * 2秒)
          if (attemptsRef.current > 150) {
            setExpired(true);
            message.warning('二维码已过期，请重新获取');
            return;
          }

          // 检查二维码扫描状态
          const result = await wechatApi.checkQrCodeStatus(scene);

          if (result && result.success && result.data) {
            const { status, userInfo, tokens } = result.data;

            if (status === 'scanned' && userInfo) {
              // 扫码成功，保存token和用户信息
              if (tokens?.access_token) {
                localStorage.setItem('access_token', tokens.access_token);
              }
              if (tokens?.refresh_token) {
                localStorage.setItem('refresh_token', tokens.refresh_token);
              }

              // 更新全局状态
              GlobalStore.setUserInfo(userInfo);
              message.success('登录成功！');

              if (onSuccess) {
                onSuccess(userInfo);
              }

              onClose();
              return;
            } else if (status === 'expired') {
              // 二维码过期或不存在，继续轮询
              pollRef.current = setTimeout(poll, 2000);
              return;
            }
            // status === 'pending' 或其他状态，继续轮询
          } else if (result && !result.success) {
            // 处理业务错误
            if (result.code === 'INVALID_SCENE_VALUE') {
              // 场景值无效，停止轮询
              console.error('场景值无效:', result.message);
              setExpired(true);
              return;
            }
          }

          // 继续轮询
          pollRef.current = setTimeout(poll, 2000);
        } catch (error: any) {
          // 网络错误或其他异常，停止轮询
          console.error('轮询检查二维码状态失败:', error);
          setExpired(true);
        }
      };

      // 开始轮询
      pollRef.current = setTimeout(poll, 2000);
    };

    // 停止轮询
    const stopPolling = () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current);
        pollRef.current = null;
      }
    };

    // 刷新二维码
    const refreshQrCode = () => {
      stopPolling();
      generateQrCode();
    };

    // 模拟扫码（仅开发环境）
    const simulateScan = async () => {
      if (!currentScene) {
        message.error('请先生成二维码');
        return;
      }

      try {
        setLoading(true);
        await wechatApi.simulateScanEvent(currentScene);
        message.success('模拟扫码成功，请等待状态更新...');
      } catch (error) {
        console.error('模拟扫码失败:', error);
        message.error('模拟扫码失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    // 组件挂载时生成二维码
    useEffect(() => {
      if (visible) {
        generateQrCode();
      } else {
        stopPolling();
      }

      return () => {
        stopPolling();
      };
    }, [visible]);

    // 组件卸载时清理
    useEffect(() => {
      return () => {
        stopPolling();
      };
    }, []);

    const handleClose = () => {
      stopPolling();
      onClose();
    };

    return (
      <Modal
        title="微信扫码登录"
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={400}
        centered
        destroyOnClose
      >
        <div className="flex flex-col items-center py-6">
          {loading ? (
            <div className="flex flex-col items-center">
              <Spin size="large" />
              <p className="mt-4 text-gray-600">正在生成二维码...</p>
            </div>
          ) : (
            <>
              <div className="relative">
                {qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="微信登录二维码"
                    className="w-64 h-64 border border-gray-200 rounded-lg"
                  />
                )}

                {expired && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-center text-white">
                      <p className="mb-4">二维码已过期</p>
                      <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={refreshQrCode}
                      >
                        重新获取
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                {isPersonalSubscription && personalGuide ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">
                      {personalGuide.title}
                    </h3>
                    <p className="text-sm text-blue-600 mb-3">
                      {personalGuide.description}
                    </p>
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-700 mb-2">
                        登录步骤：
                      </p>
                      <ol className="text-sm text-blue-600 space-y-1">
                        {personalGuide.steps?.map(
                          (step: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="inline-block w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                                {index + 1}
                              </span>
                              {step.replace(/^\d+\.\s*/, '')}
                            </li>
                          ),
                        )}
                      </ol>
                    </div>
                    {personalGuide.tips && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-500">
                          💡 提示：{personalGuide.tips.join('；')}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-800 mb-2">
                      请使用微信扫描二维码
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      扫码后关注公众号即可完成登录
                    </p>
                  </>
                )}

                {!expired && (
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <Spin size="small" className="mr-2" />
                    {isPersonalSubscription
                      ? '等待关注和消息推送...'
                      : '等待扫码中...'}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2 justify-center">
                <Button
                  type="link"
                  icon={<ReloadOutlined />}
                  onClick={refreshQrCode}
                  disabled={loading}
                >
                  刷新二维码
                </Button>

                {isDevelopment && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={simulateScan}
                    disabled={loading || !currentScene}
                    style={{
                      backgroundColor: '#52c41a',
                      borderColor: '#52c41a',
                    }}
                  >
                    🧪 模拟扫码
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    );
  },
);

export default WechatLogin;
