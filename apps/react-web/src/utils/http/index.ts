import axios from 'axios';
import { get } from 'lodash';
import ErrorDialog from './error';
import token from './interceptor/token';
import validateData from './interceptor/validateData';
import validateStatus from './interceptor/validateStatus';
import { message } from 'antd';
import { API_CONFIG } from '@/config/api';
import { csrfService } from '@/services/csrf';
import GlobalStore from '@/store';

const abortControler = new AbortController();
const error = new ErrorDialog();

// 根据错误码获取默认错误信息
const getDefaultErrorMessage = (errorCode: number | string): string => {
  switch (errorCode) {
    case 19005:
      return '密码错误';
    case 19004:
      return '邮箱不存在';
    case 19003:
      return '账户已被锁定';
    case 19002:
      return '邮箱未验证，请先验证邮箱';
    case 19001:
      return '用户不存在';
    case 400:
      return '请求参数错误';
    case 401:
      return '认证失败，请重新登录';
    case 403:
      return '权限不足或邮箱未验证';
    case 404:
      return '资源不存在';
    case 500:
      return '服务器内部错误';
    default:
      return '请求失败';
  }
};

// 使用 API 配置
const baseURL = API_CONFIG.BASE_URL;

const Instance = () => {
  const instance: any = axios.create({
    baseURL,
    signal: abortControler.signal,
    withCredentials: true, // 确保发送 cookies
  });

  // 请求拦截器：添加 token 和 CSRF token
  instance.interceptors.request.use(token);
  // instance.interceptors.request.use(async (config: any) => {
  //   // 添加 CSRF token
  //   return await csrfService.addTokenToRequest(config);
  // });

  instance.interceptors.response.use(validateStatus);
  instance.interceptors.response.use(validateData);
  instance.interceptors.response.use(
    (res) => {
      console.log('🚀 ~ Instance ~ res:', res);

      const responseData = res?.data;

      // 检查是否是成功响应 (code === 0)
      if (responseData?.code !== 0) {
        if (!get(res, 'config.ignoreError')) {
          // 根据错误码显示不同的 message
          const errorMessage = responseData?.message;
          const errorCode = responseData?.code;

          // 特殊处理：403 且有数据的情况（如邮箱未验证但返回用户信息）
          if (errorCode === 403 && responseData?.data) {
            // 显示警告信息但不抛出错误，让业务代码处理
            if (errorMessage) {
              message.warning(errorMessage);
            }
            // 返回完整响应数据，包含用户信息
            return responseData;
          }

          // 其他错误情况的正常处理
          const displayMessage =
            errorMessage ?? getDefaultErrorMessage(errorCode);
          message.error(displayMessage);

          // 同时显示详细错误对话框（可选）
          if (get(res, 'config.showDetailError')) {
            error.show({
              message: errorMessage,
              title: '详细错误信息',
              code: errorCode,
              config: {
                Method: res?.config?.method,
                Url: res?.config?.url,
                Params: res?.config?.params,
                Body: res?.config?.data,
                Response: responseData,
              },
            });
          }

          // 创建错误对象，保持与原有错误处理兼容
          const apiError = new Error(errorMessage);
          (apiError as any).response = {
            data: responseData,
            status: res.status,
            statusText: res.statusText,
          };
          throw apiError;
        }

        return responseData;
      }

      // 成功响应，可以显示成功消息（如果配置了的话）
      if (get(res, 'config.showSuccessMessage') && responseData?.message) {
        message.success(responseData.message);
      }

      return responseData?.data;
    },
    async (err: any) => {
      console.log('🚀 ~ HTTP Error ~ err:', err);

      // 处理网络错误
      if (!err.response) {
        message.error('网络连接失败，请检查网络设置');
        return Promise.reject(err);
      }

      const { code, data } = err.response;
      console.log('🚀 ~ data:', data);
      const errorMessage = data?.message ?? err.message;
      message.error(errorMessage);
      // 只有 401 状态码才处理 token 过期，403 是权限问题不需要刷新 token
      if (code === 401) {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          try {
            console.log('🔄 Attempting to refresh token...');

            // 尝试刷新 token
            const refreshResponse = await axios.post(
              `${baseURL}/auth/refresh`,
              {
                refresh_token: refreshToken,
              },
            );

            if (refreshResponse.data?.access_token) {
              const { access_token, refresh_token: newRefreshToken } =
                refreshResponse.data;

              // 更新存储的 token
              localStorage.setItem('access_token', access_token);
              localStorage.setItem('refresh_token', newRefreshToken);

              console.log('✅ Token refreshed successfully');

              // 重试原始请求
              const originalRequest = err.config;
              originalRequest.headers.Authorization = `Bearer ${access_token}`;

              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);

            message.error('登录已过期，请重新登录');

            // 刷新失败，清除所有 token 和用户信息
            // localStorage.removeItem('access_token');
            // localStorage.removeItem('refresh_token');
            GlobalStore.clearUserInfo();

            // 跳转到登录页
            if (window.location.pathname !== '/login') {
              setTimeout(() => {
                window.location.href = '/login';
              }, 1000);
            }

            return Promise.reject(refreshError);
          }
        } else {
          console.log('⚠️ No refresh token available, redirecting to login');

          // 没有 refresh token，清除所有数据并跳转到登录页
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          GlobalStore.clearUserInfo();

          if (window.location.pathname !== '/login') {
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
      }

      // 处理 CSRF token 错误
      if (csrfService.handleTokenError(err)) {
        console.log(
          'CSRF token error handled, you may want to retry the request',
        );
      }

      return Promise.reject(err);
    },
  );
  return instance;
};

export default Instance();
