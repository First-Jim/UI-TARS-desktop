import { lazy, ReactNode, Suspense } from 'react';
import {
  Route,
  Routes,
  useLocation,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { Spin } from 'antd';
import ProtectedRoute from '@/components/ProtectedRoute';
// 导入组件(懒加载)
const Home = lazy(() => import('@/pages/Home'));
const NotFound = lazy(() => import('@/pages/404'));
const Recharge = lazy(() => import('@/pages/recharge'));
const JobList = lazy(() => import('@/pages/jobList'));
const User = lazy(() => import('@/pages/UserInfo'));
const Login = lazy(() => import('@/pages/login'));
const Signup = lazy(() => import('@/pages/signup'));
const ForgotPassword = lazy(() => import('@/pages/forgot-password'));
const ResetPassword = lazy(() => import('@/pages/reset-password'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const Profile = lazy(() => import('@/pages/profile'));
const Security = lazy(() => import('@/pages/security'));
const VerifyEmail = lazy(() => import('@/pages/verify-email'));

// 避免闪屏
const lazyLoad = (component: ReactNode): ReactNode => {
  return <Suspense fallback={<Spin />}>{component}</Suspense>;
};

const AppRouter = () => {
  const location = useLocation();
  const { pathname } = location;

  const routes: RouteObject[] = [
    {
      path: '/',
      element: lazyLoad(<Home />),
    },
    // 认证相关路由
    {
      path: '/login',
      element: lazyLoad(<Login />),
    },
    {
      path: '/signup',
      element: lazyLoad(<Signup />),
    },
    {
      path: '/forgot-password',
      element: lazyLoad(<ForgotPassword />),
    },
    {
      path: '/reset-password',
      element: lazyLoad(<ResetPassword />),
    },
    {
      path: '/verify-email',
      element: lazyLoad(<VerifyEmail />),
    },
    // 用户相关路由
    {
      path: '/dashboard',
      element: lazyLoad(<Dashboard />),
    },
    {
      path: '/profile',
      element: lazyLoad(<Profile />),
    },
    {
      path: '/security',
      element: lazyLoad(<Security />),
    },
    // 原有路由
    {
      path: '/recharge',
      element: lazyLoad(<Recharge />),
    },
    {
      path: '/joblist',
      element: lazyLoad(<JobList />),
    },
    {
      path: '/user',
      element: lazyLoad(<User />),
    },
    {
      path: '*',
      element: <NotFound />,
    },
  ];

  const handleRedirect = (item: RouteObject) => {
    // if (pathname !== '/login' && !token) {
    //   return <Navigate to="/login" replace={true} />;
    // } else {
    //   return item.element;
    // }
    return item.element;
  };

  const RouteNav = (param: RouteObject[]) => {
    return param.map((item) => {
      return (
        <Route path={item.path} element={handleRedirect(item)} key={item.path}>
          {item?.children && RouteNav(item.children)}
        </Route>
      );
    });
  };

  return <Routes>{RouteNav(routes)}</Routes>;
};

export default AppRouter;
