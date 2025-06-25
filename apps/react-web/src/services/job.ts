import http from '@/utils/http';

export const getJobBillList = () => {
  return http.get('/account/bill');
};
