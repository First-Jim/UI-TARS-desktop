import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { observer } from 'mobx-react-lite';
import GlobalStore from '@/store';
import { authApi, tokenUtils } from '@/services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // 是否需要认证，默认为 true
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = observer(
  ({ children, requireAuth = true }) => {
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const location = useLocation();

    useEffect(() => {
      checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
      try {
        // 如果不需要认证，直接通过
        if (!requireAuth) {
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        // 检查是否有 access token
        if (!tokenUtils.hasValidToken()) {
          console.log('⚠️ No access token found');
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        // 如果已经有用户信息，直接通过（避免重复请求）
        if (GlobalStore.userInfo?.id) {
          console.log('✅ User already authenticated, skipping profile fetch');
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        // 添加防抖，避免频繁请求
        const lastCheck = localStorage.getItem('last_auth_check');
        const now = Date.now();
        if (lastCheck && now - parseInt(lastCheck) < 5000) {
          // 5秒内不重复检查
          console.log('⏱️ Auth check too frequent, skipping...');
          setLoading(false);
          setAuthChecked(true);
          return;
        }

        // 尝试获取用户信息
        console.log('🔍 Fetching user profile...');
        localStorage.setItem('last_auth_check', now.toString());

        const userProfile = await authApi.getProfile();
        if (userProfile) {
          GlobalStore.setUserInfo(userProfile);
          console.log('✅ User profile loaded successfully');
        }
      } catch (error: any) {
        console.error('❌ Auth check failed:', error);

        // 如果是限流错误，不清除 token，只是跳过检查
        if (error.response?.status === 429) {
          console.log('⚠️ Rate limited, will retry later');
          // 如果有用户信息，继续使用
          if (GlobalStore.userInfo?.id) {
            setLoading(false);
            setAuthChecked(true);
            return;
          }
        }

        // 如果是 token 过期或无效，清除 token
        if (error.response?.status === 401) {
          console.log('🔄 Token invalid, clearing tokens...');
          tokenUtils.clearTokens();
        }
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    // 正在检查认证状态
    if (loading || !authChecked) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Spin size="large" />
            <div className="mt-4 text-gray-600">正在验证登录状态...</div>
          </div>
        </div>
      );
    }

    // 不需要认证的页面，直接渲染
    if (!requireAuth) {
      return <>{children}</>;
    }

    // 需要认证但未登录，重定向到登录页
    if (!GlobalStore.isLogin) {
      console.log('🔒 User not authenticated, redirecting to login');

      // 保存当前路径，登录后可以重定向回来
      const redirectPath =
        location.pathname !== '/login' ? location.pathname : '/dashboard';

      return <Navigate to="/login" state={{ from: redirectPath }} replace />;
    }

    // 已登录，渲染受保护的内容
    return <>{children}</>;
  },
);

export default ProtectedRoute;
