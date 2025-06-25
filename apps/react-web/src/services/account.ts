import http from '@/utils/http';

export const getAccountBalance = () => {
  return http.get('/account/get');
};
