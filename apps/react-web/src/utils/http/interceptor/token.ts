export default (config) => {
  // 获取 access_token（用于 Bearer 认证）
  const accessToken = localStorage.getItem('access_token');

  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
};
